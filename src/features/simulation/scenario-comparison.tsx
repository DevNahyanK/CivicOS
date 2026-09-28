"use client";

import { AlertTriangle, CheckCircle, Sparkles, TrendingDown, TrendingUp } from "lucide-react";
import type { SimulationResult } from "@/simulation/types";

export interface ScenarioItem {
  id: string;
  name: string;
  description?: string | null;
  isBaseline: boolean;
  inputs: Record<string, number | boolean>;
  result: SimulationResult;
}

interface ScenarioComparisonProps {
  scenarios: ScenarioItem[];
  currentLiveResult: SimulationResult;
  onSelectScenario: (scenario: ScenarioItem) => void;
}

function formatNumber(val: unknown, decimals: number = 0): string {
  const num = Number(val);
  if (!Number.isFinite(num)) return "—";
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: decimals,
  }).format(num);
}

export function ScenarioComparison({
  scenarios,
  currentLiveResult,
  onSelectScenario,
}: ScenarioComparisonProps) {
  // Find baseline scenario if present, else fallback to first or live
  const baseline = scenarios.find((s) => s.isBaseline) || scenarios[0];
  const baselineRecovered = baseline
    ? Number(baseline.result.metrics.actual_recovered_food_kg?.value ?? 0)
    : 0;
  const baselineMeals = baseline
    ? Number(baseline.result.metrics.meals_provided_daily?.value ?? 0)
    : 0;

  // Build full column list: baseline/saved scenarios + "Current Workbench"
  const allColumns: Array<{
    id: string;
    name: string;
    isBaseline: boolean;
    isLive: boolean;
    result: SimulationResult;
    sourceScenario?: ScenarioItem;
  }> = [
    ...scenarios.map((s) => ({
      id: s.id,
      name: s.name,
      isBaseline: s.isBaseline,
      isLive: false,
      result: s.result,
      sourceScenario: s,
    })),
    {
      id: "live_workbench",
      name: "Current Workbench (Live)",
      isBaseline: false,
      isLive: true,
      result: currentLiveResult,
    },
  ];

  if (allColumns.length === 1) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/50 p-8 text-center">
        <p className="font-semibold text-slate-700">No saved scenarios to compare yet</p>
        <p className="mt-1 text-sm text-slate-500">
          Save your current simulation parameters above as a scenario (e.g. &ldquo;Baseline&rdquo; or &ldquo;Scale-Up Target&rdquo;) to enable side-by-side comparative analysis.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
      <div className="border-b border-slate-200 bg-slate-50/70 px-6 py-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Side-by-Side Scenario Comparison</h3>
            <p className="text-xs text-slate-500">
              Deterministic comparison across saved scenarios and live workbench configuration
            </p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-md bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-800 border border-sky-200">
            <Sparkles size={13} /> Provenance: Calculated (Deterministic Engine)
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/40 text-xs font-semibold text-slate-600">
              <th className="py-3.5 pl-6 pr-4 min-w-[200px]">Parameter / Metric</th>
              {allColumns.map((col) => (
                <th key={col.id} className="px-4 py-3.5 min-w-[170px]">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-900">{col.name}</span>
                    {col.isBaseline && (
                      <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800 uppercase">
                        Baseline
                      </span>
                    )}
                    {col.isLive && (
                      <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-blue-800 uppercase">
                        Live
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
            {/* SECTION: INPUTS */}
            <tr className="bg-slate-100/60 font-bold text-slate-800">
              <td colSpan={allColumns.length + 1} className="py-2 pl-6 text-[11px] uppercase tracking-wider">
                Inputs (Provenance: User Input / Assumption)
              </td>
            </tr>
            <tr>
              <td className="py-2.5 pl-6 font-medium text-slate-600">Participating Restaurants</td>
              {allColumns.map((col) => (
                <td key={col.id} className="px-4 py-2.5">
                  {col.result.resolvedInputs.participating_restaurants?.value ?? "—"} establishments
                </td>
              ))}
            </tr>
            <tr>
              <td className="py-2.5 pl-6 font-medium text-slate-600">Daily Surplus / Outlet</td>
              {allColumns.map((col) => (
                <td key={col.id} className="px-4 py-2.5">
                  {col.result.resolvedInputs.daily_surplus_per_restaurant_kg?.value ?? "—"} kg/day
                </td>
              ))}
            </tr>
            <tr>
              <td className="py-2.5 pl-6 font-medium text-slate-600">Collection Efficiency</td>
              {allColumns.map((col) => (
                <td key={col.id} className="px-4 py-2.5">
                  {col.result.resolvedInputs.collection_efficiency_pct?.value ?? "—"}%
                </td>
              ))}
            </tr>
            <tr>
              <td className="py-2.5 pl-6 font-medium text-slate-600">Active Vehicles</td>
              {allColumns.map((col) => (
                <td key={col.id} className="px-4 py-2.5">
                  {col.result.resolvedInputs.active_vehicles?.value ?? "—"} vans
                </td>
              ))}
            </tr>

            {/* SECTION: OUTPUT METRICS */}
            <tr className="bg-slate-100/60 font-bold text-slate-800">
              <td colSpan={allColumns.length + 1} className="py-2 pl-6 text-[11px] uppercase tracking-wider">
                Projected Outcomes (Provenance: Calculated)
              </td>
            </tr>
            <tr className="font-semibold text-slate-900 bg-sky-50/20">
              <td className="py-3 pl-6">
                <div>Daily Food Recovered</div>
                <div className="text-[10px] font-normal text-slate-500">kg per day</div>
              </td>
              {allColumns.map((col) => {
                const val = Number(col.result.metrics.actual_recovered_food_kg?.value ?? 0);
                const delta = baseline && !col.isBaseline ? val - baselineRecovered : null;
                const deltaPct =
                  delta !== null && baselineRecovered > 0 ? (delta / baselineRecovered) * 100 : null;

                return (
                  <td key={col.id} className="px-4 py-3">
                    <div className="text-sm font-bold text-slate-950">{formatNumber(val, 1)} kg</div>
                    {delta !== null && (
                      <div
                        className={`flex items-center gap-1 text-[11px] font-medium ${
                          delta >= 0 ? "text-emerald-700" : "text-rose-700"
                        }`}
                      >
                        {delta >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        <span>
                          {delta >= 0 ? "+" : ""}
                          {formatNumber(delta, 1)} kg ({deltaPct !== null ? `${deltaPct.toFixed(1)}%` : ""})
                        </span>
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>
            <tr>
              <td className="py-3 pl-6 font-semibold text-slate-900">
                <div>Daily Meals Provided</div>
                <div className="text-[10px] font-normal text-slate-500">meals per day</div>
              </td>
              {allColumns.map((col) => {
                const val = Number(col.result.metrics.meals_provided_daily?.value ?? 0);
                const delta = baseline && !col.isBaseline ? val - baselineMeals : null;
                return (
                  <td key={col.id} className="px-4 py-3">
                    <div className="text-sm font-bold text-slate-950">{formatNumber(val)} meals</div>
                    {delta !== null && (
                      <div
                        className={`text-[11px] font-medium ${
                          delta >= 0 ? "text-emerald-700" : "text-rose-700"
                        }`}
                      >
                        {delta >= 0 ? "+" : ""}
                        {formatNumber(delta)} vs baseline
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>
            <tr>
              <td className="py-3 pl-6 font-medium text-slate-600">Fleet Utilization</td>
              {allColumns.map((col) => {
                const val = Number(col.result.metrics.fleet_utilization_pct?.value ?? 0);
                const isOver = val > 90;
                return (
                  <td key={col.id} className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-semibold ${
                        isOver
                          ? "bg-rose-100 text-rose-800"
                          : val > 75
                          ? "bg-amber-100 text-amber-800"
                          : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {val.toFixed(1)}%
                    </span>
                  </td>
                );
              })}
            </tr>

            {/* SECTION: BOTTLENECKS */}
            <tr className="bg-slate-100/60 font-bold text-slate-800">
              <td colSpan={allColumns.length + 1} className="py-2 pl-6 text-[11px] uppercase tracking-wider">
                Bottleneck Status
              </td>
            </tr>
            <tr>
              <td className="py-3 pl-6 font-medium text-slate-600">Active Bottlenecks</td>
              {allColumns.map((col) => {
                const count = col.result.bottlenecks.length;
                return (
                  <td key={col.id} className="px-4 py-3">
                    {count === 0 ? (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-700 font-medium">
                        <CheckCircle size={13} /> Feasible (No Bottlenecks)
                      </span>
                    ) : (
                      <div className="space-y-1">
                        {col.result.bottlenecks.map((b) => (
                          <div
                            key={b.id}
                            className="inline-flex items-center gap-1 rounded bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-800 border border-rose-200"
                          >
                            <AlertTriangle size={11} /> {b.label}
                          </div>
                        ))}
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>

            {/* ACTION ROW */}
            <tr>
              <td className="py-3 pl-6 font-medium text-slate-500">Actions</td>
              {allColumns.map((col) => (
                <td key={col.id} className="px-4 py-3">
                  {col.sourceScenario ? (
                    <button
                      type="button"
                      onClick={() => onSelectScenario(col.sourceScenario!)}
                      className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-[#123b5d] hover:bg-slate-50 transition-colors"
                    >
                      Load into Workbench
                    </button>
                  ) : (
                    <span className="text-xs text-slate-400">Active in editor</span>
                  )}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
