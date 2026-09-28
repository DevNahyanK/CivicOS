"use client";

import { useId, useMemo, useState, useTransition } from "react";
import {
  AlertTriangle,
  BarChart3,
  BookmarkCheck,
  CheckCircle2,
  Gauge,
  Layers,
  Loader2,
  RotateCcw,
  ShieldAlert,
  Sliders,
  Sparkles,
  Truck,
  Utensils,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { foodRecoveryModelDefinition } from "@/simulation/models/food-recovery";
import { SimulationEngine } from "@/simulation/core/engine";
import type { SimulationInputValues, SimulationResult } from "@/simulation/types";
import type { Scenario } from "@/types/database";
import { saveScenarioAction, setBaselineScenarioAction } from "@/features/scenarios/actions";
import { ScenarioComparison, type ScenarioItem } from "./scenario-comparison";
import { VisualAnalytics } from "./components/visual-analytics";
import { BottleneckDeepDive } from "./components/bottleneck-deep-dive";

interface SimulationWorkbenchProps {
  problemId: string;
  initialScenarios?: Scenario[];
}

type WorkbenchTab = "workbench" | "analytics" | "bottlenecks" | "comparison";

function parseScenarioToItem(scenario: Scenario): ScenarioItem {
  const rawInputs = (typeof scenario.inputs === "object" && scenario.inputs !== null && !Array.isArray(scenario.inputs)
    ? (scenario.inputs as SimulationInputValues)
    : {}) as SimulationInputValues;

  const result = SimulationEngine.run({
    model: foodRecoveryModelDefinition,
    inputs: rawInputs,
  });

  return {
    id: scenario.id,
    name: scenario.name,
    description: scenario.description,
    isBaseline: scenario.is_baseline,
    inputs: rawInputs,
    result,
  };
}

function getDefaultInputs(): SimulationInputValues {
  const defaults: SimulationInputValues = {};
  for (const inputDef of foodRecoveryModelDefinition.inputs) {
    defaults[inputDef.key] = inputDef.defaultValue;
  }
  return defaults;
}

export function SimulationWorkbench({
  problemId,
  initialScenarios = [],
}: SimulationWorkbenchProps) {
  const [inputs, setInputs] = useState<SimulationInputValues>(getDefaultInputs);
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(null);
  const [savedScenarios, setSavedScenarios] = useState<ScenarioItem[]>(() =>
    initialScenarios.map(parseScenarioToItem)
  );
  const [activeTab, setActiveTab] = useState<WorkbenchTab>("workbench");

  // Dialog / Save State
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [scenarioName, setScenarioName] = useState("");
  const [scenarioDesc, setScenarioDesc] = useState("");
  const [isBaseline, setIsBaseline] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const nameInputId = useId();
  const descInputId = useId();
  const baselineInputId = useId();

  // Deterministic real-time simulation output
  const currentResult: SimulationResult = useMemo(() => {
    return SimulationEngine.run({
      model: foodRecoveryModelDefinition,
      inputs,
    });
  }, [inputs]);

  const handleInputChange = (key: string, val: number) => {
    setInputs((prev) => ({
      ...prev,
      [key]: val,
    }));
    setActiveScenarioId(null);
  };

  const handleResetDefaults = () => {
    setInputs(getDefaultInputs());
    setActiveScenarioId(null);
  };

  const handleLoadScenario = (scenario: ScenarioItem) => {
    setInputs(scenario.inputs);
    setActiveScenarioId(scenario.id);
  };

  const handleSaveScenario = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scenarioName.trim()) {
      setSaveError("Please enter a scenario name.");
      return;
    }

    setSaveError(null);
    startTransition(async () => {
      const res = await saveScenarioAction({
        problemId,
        name: scenarioName.trim(),
        description: scenarioDesc.trim() || undefined,
        modelId: foodRecoveryModelDefinition.id,
        inputs,
        results: currentResult.metrics as unknown as Record<string, unknown>,
        isBaseline,
      });

      if (res.error) {
        setSaveError(res.error);
        return;
      }

      if (res.scenario) {
        const newItem = parseScenarioToItem(res.scenario);
        setSavedScenarios((prev) => {
          const updated = isBaseline ? prev.map((s) => ({ ...s, isBaseline: false })) : [...prev];
          return [newItem, ...updated];
        });
        setActiveScenarioId(newItem.id);
        setIsSaveModalOpen(false);
        setScenarioName("");
        setScenarioDesc("");
        setIsBaseline(false);
      }
    });
  };

  const handleSetBaseline = (scenarioId: string) => {
    startTransition(async () => {
      await setBaselineScenarioAction(problemId, scenarioId);
      setSavedScenarios((prev) =>
        prev.map((s) => ({
          ...s,
          isBaseline: s.id === scenarioId,
        }))
      );
    });
  };

  // Metric values
  const recoveredFood = Number(currentResult.metrics.actual_recovered_food_kg?.value ?? 0);
  const mealsProvided = Number(currentResult.metrics.meals_provided_daily?.value ?? 0);
  const fleetUtilization = Number(currentResult.metrics.fleet_utilization_pct?.value ?? 0);
  const totalSurplus = Number(currentResult.metrics.daily_total_surplus_kg?.value ?? 0);

  const activeBottlenecks = currentResult.bottlenecks;
  const isFleetBottlenecked = fleetUtilization > 90;

  return (
    <div className="space-y-6">
      {/* Workbench Header Card */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-[#123b5d]/10 px-2.5 py-1 text-xs font-semibold text-[#123b5d]">
                <Sliders size={14} /> Interactive Simulation Workbench
              </span>
              <span className="inline-flex items-center gap-1 rounded-md bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-800 border border-sky-200">
                <Sparkles size={13} /> Deterministic TypeScript Engine
              </span>
            </div>
            <h2 className="mt-2 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
              {foodRecoveryModelDefinition.name}
            </h2>
            <p className="mt-1 text-xs text-slate-500 max-w-2xl leading-relaxed">
              {foodRecoveryModelDefinition.description}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetDefaults}
              className="text-slate-600 hover:text-slate-900"
            >
              <RotateCcw size={14} /> Reset Defaults
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setSaveError(null);
                setIsSaveModalOpen(true);
              }}
              className="bg-[#123b5d] hover:bg-[#0d2e49] text-white"
            >
              <BookmarkCheck size={14} /> Save Scenario
            </Button>
          </div>
        </div>

        {/* Scenario Switcher Bar */}
        {savedScenarios.length > 0 && (
          <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
            <span className="text-xs font-semibold text-slate-500">Saved Scenarios:</span>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setInputs(getDefaultInputs());
                  setActiveScenarioId(null);
                }}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  activeScenarioId === null
                    ? "bg-[#123b5d] text-white shadow-xs"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                Custom Live
              </button>
              {savedScenarios.map((sc) => (
                <div key={sc.id} className="inline-flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleLoadScenario(sc)}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                      activeScenarioId === sc.id
                        ? "bg-[#123b5d] text-white shadow-xs"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    <span>{sc.name}</span>
                    {sc.isBaseline && (
                      <span className="rounded bg-emerald-200/90 px-1.5 py-0.2 text-[9px] font-bold text-emerald-950 uppercase">
                        Base
                      </span>
                    )}
                  </button>
                  {activeScenarioId === sc.id && !sc.isBaseline && (
                    <button
                      type="button"
                      onClick={() => handleSetBaseline(sc.id)}
                      className="rounded px-1.5 py-1 text-[10px] font-medium text-emerald-700 hover:bg-emerald-50 transition-colors"
                      title="Set as baseline for comparison"
                    >
                      ★ Set Baseline
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* PHASE 6 NAVIGATION TAB BAR */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab("workbench")}
          className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-colors ${
            activeTab === "workbench"
              ? "bg-[#123b5d] text-white shadow-xs"
              : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
          }`}
        >
          <Sliders size={14} /> Interactive Controls & Metrics
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("analytics")}
          className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-colors ${
            activeTab === "analytics"
              ? "bg-[#123b5d] text-white shadow-xs"
              : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
          }`}
        >
          <BarChart3 size={14} /> Visual Impact Charts
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("bottlenecks")}
          className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-colors ${
            activeTab === "bottlenecks"
              ? "bg-[#123b5d] text-white shadow-xs"
              : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
          }`}
        >
          <ShieldAlert size={14} /> Bottleneck Deep-Dive
          {activeBottlenecks.length > 0 ? (
            <span className="rounded bg-rose-200 px-1.5 py-0.5 text-[10px] font-extrabold text-rose-950">
              {activeBottlenecks.length}
            </span>
          ) : (
            <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
              OK
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("comparison")}
          className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-colors ${
            activeTab === "comparison"
              ? "bg-[#123b5d] text-white shadow-xs"
              : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
          }`}
        >
          <Layers size={14} /> Scenario Comparison Matrix
          {savedScenarios.length > 0 && (
            <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-bold text-slate-800">
              {savedScenarios.length}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: INTERACTIVE WORKBENCH CONTROLS & REAL-TIME OUTPUTS */}
      {activeTab === "workbench" && (
        <div className="space-y-6">
          <div className="grid gap-8 lg:grid-cols-12">
            {/* LEFT COLUMN: PARAMETER CONTROLS */}
            <section aria-label="Simulation Controls" className="lg:col-span-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Sliders size={18} className="text-[#123b5d]" /> Simulation Controls
                </h3>
                <span className="text-xs font-medium text-slate-500">
                  Provenance: <span className="text-blue-700 font-semibold">User Input</span>
                </span>
              </div>

              <div className="space-y-4">
                {/* Input 1: Restaurants */}
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <label htmlFor="participating_restaurants" className="font-semibold text-xs text-slate-900">
                        Participating Establishments
                      </label>
                      <p className="text-[11px] text-slate-500">Food businesses donating surplus</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Input
                        id="participating_restaurants"
                        type="number"
                        min={1}
                        max={1000}
                        step={1}
                        value={Number(inputs.participating_restaurants ?? 60)}
                        onChange={(e) =>
                          handleInputChange("participating_restaurants", Number(e.target.value))
                        }
                        className="h-8 w-20 text-right font-mono text-xs font-bold"
                      />
                      <span className="text-xs text-slate-500">outlets</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={500}
                    step={1}
                    value={Number(inputs.participating_restaurants ?? 60)}
                    onChange={(e) =>
                      handleInputChange("participating_restaurants", Number(e.target.value))
                    }
                    className="mt-3 w-full accent-[#123b5d]"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>1</span>
                    <span>250</span>
                    <span>500</span>
                  </div>
                </div>

                {/* Input 2: Surplus per restaurant */}
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <label htmlFor="daily_surplus_per_restaurant_kg" className="font-semibold text-xs text-slate-900">
                        Daily Surplus per Establishment
                      </label>
                      <p className="text-[11px] text-slate-500">Average edible food generated</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Input
                        id="daily_surplus_per_restaurant_kg"
                        type="number"
                        min={1}
                        max={100}
                        step={0.5}
                        value={Number(inputs.daily_surplus_per_restaurant_kg ?? 18.5)}
                        onChange={(e) =>
                          handleInputChange("daily_surplus_per_restaurant_kg", Number(e.target.value))
                        }
                        className="h-8 w-20 text-right font-mono text-xs font-bold"
                      />
                      <span className="text-xs text-slate-500">kg/day</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={80}
                    step={0.5}
                    value={Number(inputs.daily_surplus_per_restaurant_kg ?? 18.5)}
                    onChange={(e) =>
                      handleInputChange("daily_surplus_per_restaurant_kg", Number(e.target.value))
                    }
                    className="mt-3 w-full accent-[#123b5d]"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>1 kg</span>
                    <span>40 kg</span>
                    <span>80 kg</span>
                  </div>
                </div>

                {/* Input 3: Efficiency % */}
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <label htmlFor="collection_efficiency_pct" className="font-semibold text-xs text-slate-900">
                        Collection Efficiency
                      </label>
                      <p className="text-[11px] text-slate-500">Routing & recovery operational rate</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Input
                        id="collection_efficiency_pct"
                        type="number"
                        min={0}
                        max={100}
                        step={1}
                        value={Number(inputs.collection_efficiency_pct ?? 75)}
                        onChange={(e) =>
                          handleInputChange("collection_efficiency_pct", Number(e.target.value))
                        }
                        className="h-8 w-20 text-right font-mono text-xs font-bold"
                      />
                      <span className="text-xs text-slate-500">%</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={1}
                    value={Number(inputs.collection_efficiency_pct ?? 75)}
                    onChange={(e) =>
                      handleInputChange("collection_efficiency_pct", Number(e.target.value))
                    }
                    className="mt-3 w-full accent-[#123b5d]"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>0%</span>
                    <span>50%</span>
                    <span>100%</span>
                  </div>
                </div>

                {/* Input 4: Active Vehicles */}
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <label htmlFor="active_vehicles" className="font-semibold text-xs text-slate-900">
                        Active Recovery Vehicles
                      </label>
                      <p className="text-[11px] text-slate-500">Deployed collection vans/trucks</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Input
                        id="active_vehicles"
                        type="number"
                        min={1}
                        max={30}
                        step={1}
                        value={Number(inputs.active_vehicles ?? 3)}
                        onChange={(e) =>
                          handleInputChange("active_vehicles", Number(e.target.value))
                        }
                        className="h-8 w-20 text-right font-mono text-xs font-bold"
                      />
                      <span className="text-xs text-slate-500">vans</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={15}
                    step={1}
                    value={Number(inputs.active_vehicles ?? 3)}
                    onChange={(e) =>
                      handleInputChange("active_vehicles", Number(e.target.value))
                    }
                    className="mt-3 w-full accent-[#123b5d]"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>1</span>
                    <span>8</span>
                    <span>15</span>
                  </div>
                </div>

                {/* Input 5: Vehicle Capacity */}
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <label htmlFor="vehicle_capacity_kg" className="font-semibold text-xs text-slate-900">
                        Vehicle Shift Capacity
                      </label>
                      <p className="text-[11px] text-slate-500">Maximum transport limit per vehicle</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Input
                        id="vehicle_capacity_kg"
                        type="number"
                        min={50}
                        max={1500}
                        step={25}
                        value={Number(inputs.vehicle_capacity_kg ?? 350)}
                        onChange={(e) =>
                          handleInputChange("vehicle_capacity_kg", Number(e.target.value))
                        }
                        className="h-8 w-20 text-right font-mono text-xs font-bold"
                      />
                      <span className="text-xs text-slate-500">kg/van</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min={100}
                    max={1000}
                    step={25}
                    value={Number(inputs.vehicle_capacity_kg ?? 350)}
                    onChange={(e) =>
                      handleInputChange("vehicle_capacity_kg", Number(e.target.value))
                    }
                    className="mt-3 w-full accent-[#123b5d]"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>100 kg</span>
                    <span>550 kg</span>
                    <span>1,000 kg</span>
                  </div>
                </div>
              </div>
            </section>

            {/* RIGHT COLUMN: REAL-TIME PROJECTIONS & BOTTLENECK RADAR */}
            <section aria-label="Real-time Projections" className="lg:col-span-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Gauge size={18} className="text-sky-600" /> Projected Outcomes
                </h3>
                <span className="inline-flex items-center gap-1 rounded-md bg-sky-50 px-2 py-0.5 text-xs font-semibold text-sky-800 border border-sky-200">
                  Provenance: Calculated
                </span>
              </div>

              {/* Primary Metric 1: Food Recovered */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Daily Food Recovered
                    </p>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-3xl font-extrabold tracking-tight text-slate-950">
                        {recoveredFood.toLocaleString("en-US", { maximumFractionDigits: 1 })}
                      </span>
                      <span className="text-sm font-semibold text-slate-500">kg / day</span>
                    </div>
                  </div>
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
                    <Utensils size={20} />
                  </div>
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  Out of {totalSurplus.toLocaleString("en-US", { maximumFractionDigits: 0 })} kg total commercial surplus generated
                </p>
              </div>

              {/* Primary Metric 2: Daily Meals */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Projected Daily Meals Provided
                    </p>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-3xl font-extrabold tracking-tight text-slate-950">
                        {Math.round(mealsProvided).toLocaleString("en-US")}
                      </span>
                      <span className="text-sm font-semibold text-slate-500">meals / day</span>
                    </div>
                  </div>
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-600">
                    <Layers size={20} />
                  </div>
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  Distributed to community kitchens, shelters, and designated food banks
                </p>
              </div>

              {/* Primary Metric 3: Fleet Utilization Progress Bar */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Fleet Capacity Utilization
                    </p>
                    <p className="mt-1 text-2xl font-bold text-slate-900">{fleetUtilization.toFixed(1)}%</p>
                  </div>
                  <div
                    className={`grid h-10 w-10 place-items-center rounded-xl ${
                      isFleetBottlenecked
                        ? "bg-rose-50 text-rose-600"
                        : fleetUtilization > 75
                        ? "bg-amber-50 text-amber-600"
                        : "bg-emerald-50 text-emerald-600"
                    }`}
                  >
                    <Truck size={20} />
                  </div>
                </div>

                {/* Visual Gauge */}
                <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full transition-all duration-300 ${
                      isFleetBottlenecked
                        ? "bg-rose-600"
                        : fleetUtilization > 75
                        ? "bg-amber-500"
                        : "bg-emerald-500"
                    }`}
                    style={{ width: `${Math.min(fleetUtilization, 100)}%` }}
                  />
                </div>
                <div className="mt-2 flex justify-between text-[11px] text-slate-500">
                  <span>Low Load</span>
                  <span className="font-semibold">90% Bottleneck Threshold</span>
                  <span>100% Saturation</span>
                </div>
              </div>

              {/* Active Bottlenecks & Warnings Card */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <AlertTriangle size={14} className={activeBottlenecks.length > 0 ? "text-amber-500" : "text-emerald-500"} />
                    System Constraint & Bottleneck Analysis
                  </h4>
                  <button
                    type="button"
                    onClick={() => setActiveTab("bottlenecks")}
                    className="text-xs font-semibold text-[#123b5d] hover:underline"
                  >
                    Deep-Dive →
                  </button>
                </div>

                {activeBottlenecks.length === 0 ? (
                  <div className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-xs font-medium text-emerald-800 border border-emerald-200">
                    <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
                    <span>All operations viable. No bottlenecks or logistics saturation detected.</span>
                  </div>
                ) : (
                  <div className="mt-3 space-y-3">
                    {activeBottlenecks.map((b) => (
                      <div
                        key={b.id}
                        className="rounded-lg border border-rose-200 bg-rose-50/70 p-3.5 text-xs text-rose-950 space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold flex items-center gap-1 text-rose-900">
                            <AlertTriangle size={14} /> {b.label}
                          </span>
                          <span className="rounded bg-rose-200/90 px-1.5 py-0.5 text-[10px] font-bold text-rose-950 uppercase">
                            {b.severity} severity
                          </span>
                        </div>
                        <p className="text-rose-800">{b.message}</p>
                        {b.suggestedIntervention && (
                          <div className="rounded bg-white/80 p-2 text-[11px] text-slate-700 border border-rose-100">
                            <span className="font-bold text-slate-900">Recommended Intervention:</span>{" "}
                            {b.suggestedIntervention}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      )}

      {/* TAB 2: VISUAL IMPACT CHARTS */}
      {activeTab === "analytics" && (
        <VisualAnalytics
          currentResult={currentResult}
          savedScenarios={savedScenarios}
        />
      )}

      {/* TAB 3: BOTTLENECK DEEP-DIVE & INTERVENTIONS */}
      {activeTab === "bottlenecks" && (
        <BottleneckDeepDive
          currentResult={currentResult}
          onApplyIntervention={handleInputChange}
        />
      )}

      {/* TAB 4: SIDE-BY-SIDE SCENARIO COMPARISON MATRIX */}
      {activeTab === "comparison" && (
        <section aria-label="Scenario Comparison">
          <ScenarioComparison
            scenarios={savedScenarios}
            currentLiveResult={currentResult}
            onSelectScenario={handleLoadScenario}
          />
        </section>
      )}

      {/* SAVE SCENARIO MODAL */}
      {isSaveModalOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900">Save Current Scenario</h3>
            <p className="mt-1 text-xs text-slate-500">
              Save the current live input configuration and calculated metrics to compare against other policy options.
            </p>

            <form onSubmit={handleSaveScenario} className="mt-5 space-y-4">
              <div>
                <label htmlFor={nameInputId} className="text-xs font-semibold text-slate-800">
                  Scenario Name <span className="text-red-500">*</span>
                </label>
                <Input
                  id={nameInputId}
                  value={scenarioName}
                  onChange={(e) => setScenarioName(e.target.value)}
                  placeholder="e.g. Conservative Pilot, Aggressive Scale-Up"
                  required
                  className="mt-1.5"
                />
              </div>

              <div>
                <label htmlFor={descInputId} className="text-xs font-semibold text-slate-800">
                  Description <span className="font-normal text-slate-400">(optional)</span>
                </label>
                <Input
                  id={descInputId}
                  value={scenarioDesc}
                  onChange={(e) => setScenarioDesc(e.target.value)}
                  placeholder="Brief note about the underlying policy assumption"
                  className="mt-1.5"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id={baselineInputId}
                  checked={isBaseline}
                  onChange={(e) => setIsBaseline(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-[#123b5d] focus:ring-[#123b5d]"
                />
                <label htmlFor={baselineInputId} className="text-xs font-medium text-slate-700">
                  Set as Baseline Scenario (used for delta comparisons)
                </label>
              </div>

              {saveError && (
                <p role="alert" className="text-xs font-medium text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200">
                  {saveError}
                </p>
              )}

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsSaveModalOpen(false)}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isPending}
                  className="bg-[#123b5d] hover:bg-[#0d2e49] text-white"
                >
                  {isPending ? (
                    <>
                      <Loader2 size={14} className="animate-spin" /> Saving…
                    </>
                  ) : (
                    "Save Scenario"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
