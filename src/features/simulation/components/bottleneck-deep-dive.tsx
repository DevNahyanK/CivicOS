"use client";

import {
  ArrowRight,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Sparkles,
  Truck,
  Users,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SimulationResult } from "@/simulation/types";

interface BottleneckDeepDiveProps {
  currentResult: SimulationResult;
  onApplyIntervention?: (key: string, newValue: number) => void;
}

export function BottleneckDeepDive({
  currentResult,
  onApplyIntervention,
}: BottleneckDeepDiveProps) {
  const bottlenecks = currentResult.bottlenecks;
  const constraints = currentResult.constraints;

  const currentVehicles = Number(currentResult.resolvedInputs.active_vehicles?.value ?? 3);
  const currentCapacity = Number(currentResult.resolvedInputs.vehicle_capacity_kg?.value ?? 350);
  const currentUtilization = Number(currentResult.metrics.fleet_utilization_pct?.value ?? 0);
  const currentRestaurants = Number(currentResult.resolvedInputs.participating_restaurants?.value ?? 60);

  const isFleetCritical = currentUtilization > 90;
  const isFleetStrained = currentUtilization >= 75 && currentUtilization <= 90;
  const isNetworkLow = currentRestaurants < 15;

  const hasAnyIssues = bottlenecks.length > 0 || constraints.some((c) => !c.satisfied) || isFleetStrained;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <ShieldAlert size={18} className="text-[#123b5d]" /> Bottleneck Deep-Dive & Interventions
          </h3>
          <p className="text-xs text-slate-500">
            Automated detection of operational choke points, capacity ceilings, and remedial policy actions
          </p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-md bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-800 border border-sky-200">
          <Sparkles size={13} /> Provenance: Calculated (Deterministic Engine)
        </span>
      </div>

      {/* Overall Health Status Banner */}
      {!hasAnyIssues ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-5">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-100 text-emerald-700">
              <CheckCircle2 size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-sm text-emerald-950">System Operating in Optimal Zone</h4>
                <span className="rounded bg-emerald-200/80 px-2 py-0.5 text-[10px] font-bold text-emerald-900 uppercase">
                  Healthy
                </span>
              </div>
              <p className="mt-1 text-xs text-emerald-800 leading-relaxed">
                Logistics capacity, collection throughput, and establishment density are balanced. Vehicle fleet utilization is currently at a sustainable {currentUtilization.toFixed(1)}%, avoiding overtime and uncollected food spoilage.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
            <p className="text-xs font-semibold text-slate-500">Fleet Status</p>
            <div className="mt-1 flex items-center gap-2">
              <span
                className={`text-lg font-bold ${
                  isFleetCritical ? "text-rose-600" : isFleetStrained ? "text-amber-600" : "text-emerald-600"
                }`}
              >
                {isFleetCritical ? "Critical Saturation" : isFleetStrained ? "Strained" : "Healthy"}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">{currentUtilization.toFixed(1)}% capacity load</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
            <p className="text-xs font-semibold text-slate-500">Network Density</p>
            <div className="mt-1 flex items-center gap-2">
              <span
                className={`text-lg font-bold ${isNetworkLow ? "text-amber-600" : "text-emerald-600"}`}
              >
                {isNetworkLow ? "Low Density" : "Viable Cluster"}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">{currentRestaurants} food outlets enrolled</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
            <p className="text-xs font-semibold text-slate-500">Active Bottlenecks</p>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-lg font-bold text-slate-900">
                {bottlenecks.length} Detected
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Requiring intervention</p>
          </div>
        </div>
      )}

      {/* DETAILED INTERVENTION CARDS */}
      <div className="space-y-4">
        {/* BOTTLENECK 1: FLEET SATURATION */}
        {(isFleetCritical || isFleetStrained) && (
          <div className="rounded-xl border border-rose-200 bg-white p-5 shadow-xs space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-rose-50 text-rose-600">
                  <Truck size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-slate-900">
                      Logistics Vehicle Fleet Bottleneck
                    </h4>
                    <span className="rounded bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-800 uppercase">
                      {isFleetCritical ? "High Severity" : "Medium Severity"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Collection demand is operating at {currentUtilization.toFixed(1)}% of total vehicle capacity ({currentVehicles * currentCapacity} kg/day). Daily surplus volume exceeds or nearly exhausts available cargo space.
                  </p>
                </div>
              </div>
            </div>

            {/* Actionable Interventions Box */}
            <div className="rounded-lg bg-slate-50 border border-slate-200/80 p-4 space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <Zap size={14} className="text-amber-500" /> Actionable Interventions:
              </p>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-md bg-white p-3 border border-slate-200 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">Option A: Deploy Additional Vans</span>
                    <span className="text-[10px] text-emerald-700 font-semibold">+350 kg/van</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Expands total payload capacity to relieve driver workload and prevent uncollected food.
                  </p>
                  {onApplyIntervention && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onApplyIntervention("active_vehicles", currentVehicles + 1)}
                      className="w-full text-xs h-7 border-slate-300 hover:bg-slate-100 text-[#123b5d]"
                    >
                      Apply +1 Vehicle ({currentVehicles + 1} Vans) <ArrowRight size={12} />
                    </Button>
                  )}
                </div>

                <div className="rounded-md bg-white p-3 border border-slate-200 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">Option B: Upgrade Van Payload</span>
                    <span className="text-[10px] text-emerald-700 font-semibold">+150 kg/van</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Replace light vans with medium refrigerated courier vehicles (e.g. 500 kg capacity).
                  </p>
                  {onApplyIntervention && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onApplyIntervention("vehicle_capacity_kg", Math.min(1000, currentCapacity + 150))}
                      className="w-full text-xs h-7 border-slate-300 hover:bg-slate-100 text-[#123b5d]"
                    >
                      Set Capacity to {Math.min(1000, currentCapacity + 150)} kg <ArrowRight size={12} />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* BOTTLENECK 2: LOW DONOR DENSITY */}
        {isNetworkLow && (
          <div className="rounded-xl border border-amber-200 bg-white p-5 shadow-xs space-y-4">
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-600">
                <Users size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm text-slate-900">
                    Low Donor Network Density
                  </h4>
                  <span className="rounded bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 uppercase">
                    Warning
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Only {currentRestaurants} food outlets are currently enrolled. With sparse geographical distribution, vehicle routing runs with low density, increasing fuel and time costs per kilogram recovered.
                </p>
              </div>
            </div>

            <div className="rounded-lg bg-slate-50 border border-slate-200/80 p-4 space-y-2 text-xs">
              <p className="font-bold text-slate-800">Recommended Policy Action:</p>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Launch a targeted merchant onboarding drive in commercial restaurant corridors. Target enrollment of at least 30 outlets to achieve cost-effective cluster routing.
              </p>
              {onApplyIntervention && (
                <div className="pt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onApplyIntervention("participating_restaurants", 35)}
                    className="text-xs h-7 border-slate-300 hover:bg-slate-100 text-[#123b5d]"
                  >
                    Simulate Target Cluster (35 Outlets) <ArrowRight size={12} />
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* GENERAL BEST-PRACTICE INTERVENTIONS */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Clock size={16} className="text-[#123b5d]" /> Operational Strategies for Urban Food Recovery
          </h4>
          <div className="mt-4 grid gap-3 sm:grid-cols-3 text-xs">
            <div className="rounded-lg border border-slate-150 bg-slate-50/50 p-3 space-y-1">
              <p className="font-bold text-slate-900">Multi-Shift Logistics</p>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Split pickups into afternoon bakery collections and late-night restaurant rounds to double vehicle asset utilization without buying new vans.
              </p>
            </div>
            <div className="rounded-lg border border-slate-150 bg-slate-50/50 p-3 space-y-1">
              <p className="font-bold text-slate-900">Decentralized Cold Hubs</p>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Install intermediate cold storage lockers in commercial districts so participating donors drop food off locally before consolidated trunk transport.
              </p>
            </div>
            <div className="rounded-lg border border-slate-150 bg-slate-50/50 p-3 space-y-1">
              <p className="font-bold text-slate-900">Dynamic Route Optimization</p>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Collect digital surplus notifications 2 hours in advance to skip low-yield locations and boost collection efficiency above 85%.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
