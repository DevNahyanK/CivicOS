"use client";

import { useSyncExternalStore } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BarChart3, Gauge, Sparkles, TrendingUp } from "lucide-react";
import type { SimulationResult } from "@/simulation/types";
import type { ScenarioItem } from "../scenario-comparison";

interface VisualAnalyticsProps {
  currentResult: SimulationResult;
  savedScenarios: ScenarioItem[];
}

interface ChartDataPoint {
  name: string;
  recoveredFoodKg: number;
  totalSurplusKg: number;
  fleetCapacityKg: number;
  utilizationPct: number;
  isBaseline: boolean;
  isLive: boolean;
}

interface TooltipPayloadItem {
  name: string;
  value: number;
  color: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-lg text-xs space-y-1.5 z-50">
        <p className="font-bold text-slate-900 border-b border-slate-100 pb-1">{label}</p>
        {payload.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
              {item.name}:
            </span>
            <span className="font-mono font-bold text-slate-900">
              {Number(item.value).toLocaleString("en-US", { maximumFractionDigits: 1 })} kg
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

const emptySubscribe = () => () => {};

export function VisualAnalytics({
  currentResult,
  savedScenarios,
}: VisualAnalyticsProps) {
  const isMounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  // Prepare chart dataset: Baseline, saved scenarios, and current live configuration
  const chartData: ChartDataPoint[] = [
    ...savedScenarios.map((s) => {
      const recovered = Number(s.result.metrics.actual_recovered_food_kg?.value ?? 0);
      const surplus = Number(s.result.metrics.daily_total_surplus_kg?.value ?? 0);
      const capacity = Number(s.result.intermediateCalculations.total_fleet_capacity_kg ?? 0);
      const utilization = Number(s.result.metrics.fleet_utilization_pct?.value ?? 0);
      return {
        name: s.name,
        recoveredFoodKg: Math.round(recovered * 10) / 10,
        totalSurplusKg: Math.round(surplus * 10) / 10,
        fleetCapacityKg: Math.round(capacity * 10) / 10,
        utilizationPct: Math.round(utilization * 10) / 10,
        isBaseline: s.isBaseline,
        isLive: false,
      };
    }),
    {
      name: "Current Live",
      recoveredFoodKg: Math.round(Number(currentResult.metrics.actual_recovered_food_kg?.value ?? 0) * 10) / 10,
      totalSurplusKg: Math.round(Number(currentResult.metrics.daily_total_surplus_kg?.value ?? 0) * 10) / 10,
      fleetCapacityKg: Math.round(Number(currentResult.intermediateCalculations.total_fleet_capacity_kg ?? 0) * 10) / 10,
      utilizationPct: Math.round(Number(currentResult.metrics.fleet_utilization_pct?.value ?? 0) * 10) / 10,
      isBaseline: false,
      isLive: true,
    },
  ];

  // Capacity breakdown figures
  const currentUtilization = Number(currentResult.metrics.fleet_utilization_pct?.value ?? 0);
  const currentCapacity = Number(currentResult.intermediateCalculations.total_fleet_capacity_kg ?? 0);
  const potentialSurplus = Number(currentResult.intermediateCalculations.potential_collected_kg ?? 0);
  const uncollectedSurplus = Math.max(0, potentialSurplus - currentCapacity);

  const isCritical = currentUtilization > 90;
  const isStrained = currentUtilization >= 75 && currentUtilization <= 90;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 size={18} className="text-[#123b5d]" /> Visual Impact & Capacity Analytics
          </h3>
          <p className="text-xs text-slate-500">
            Comparative scenario volume, logistics capacity threshold, and saturation analysis
          </p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-md bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-800 border border-sky-200">
          <Sparkles size={13} /> Provenance: Calculated (Deterministic Engine)
        </span>
      </div>

      {/* Grid: Bar Chart (Left) + Capacity Saturation Gauge (Right) */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* CHART: SCENARIO COMPARISON */}
        <div className="lg:col-span-8 rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h4 className="font-bold text-sm text-slate-900">Food Recovery vs Fleet Capacity (kg/day)</h4>
              <p className="text-[11px] text-slate-500">
                Comparing available surplus, actual collected volume, and logistics transport limits
              </p>
            </div>
            <div className="flex items-center gap-1 text-xs font-medium text-slate-500">
              <TrendingUp size={14} className="text-emerald-600" />
              <span>{chartData.length} Configurations</span>
            </div>
          </div>

          <div className="mt-4 h-[320px] w-full">
            {!isMounted ? (
              <div className="h-full w-full flex items-center justify-center bg-slate-50 rounded-lg text-xs text-slate-400">
                Loading interactive chart…
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 15, right: 15, left: -10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: "#475569" }}
                    axisLine={{ stroke: "#cbd5e1" }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#475569" }}
                    axisLine={false}
                    tickLine={false}
                    unit=" kg"
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    wrapperStyle={{ fontSize: 11, paddingBottom: 10 }}
                  />
                  <Bar
                    dataKey="totalSurplusKg"
                    name="Commercial Surplus (kg)"
                    fill="#cbd5e1"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={45}
                  />
                  <Bar
                    dataKey="recoveredFoodKg"
                    name="Recovered Food (kg)"
                    fill="#123b5d"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={45}
                  />
                  <Bar
                    dataKey="fleetCapacityKg"
                    name="Fleet Capacity (kg)"
                    fill="#0ea5e9"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={45}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* CAPACITY & SATURATION BREAKDOWN GAUGE */}
        <div className="lg:col-span-4 rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h4 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
              <Gauge size={16} className="text-[#123b5d]" /> Fleet Saturation Breakdown
            </h4>
            <p className="text-[11px] text-slate-500">Real-time load distribution of current setup</p>
          </div>

          {/* Current Utilization Display */}
          <div className="rounded-lg bg-slate-50 p-4 border border-slate-150">
            <div className="flex items-baseline justify-between">
              <span className="text-xs font-semibold text-slate-500">Current Fleet Load:</span>
              <span
                className={`text-2xl font-black ${
                  isCritical
                    ? "text-rose-600"
                    : isStrained
                    ? "text-amber-600"
                    : "text-emerald-700"
                }`}
              >
                {currentUtilization.toFixed(1)}%
              </span>
            </div>

            {/* Segmented Color Track */}
            <div className="mt-3 relative h-3 w-full rounded-full bg-slate-200 overflow-hidden flex">
              <div className="h-full bg-emerald-500" style={{ width: "75%" }} title="Safe Zone (<75%)" />
              <div className="h-full bg-amber-400" style={{ width: "15%" }} title="Strained Zone (75%-90%)" />
              <div className="h-full bg-rose-500" style={{ width: "10%" }} title="Critical Bottleneck (>90%)" />
            </div>

            {/* Marker Indicator */}
            <div className="mt-1 relative h-4 w-full">
              <div
                className="absolute top-0 -translate-x-1/2 flex flex-col items-center"
                style={{ left: `${Math.min(currentUtilization, 100)}%` }}
              >
                <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[6px] border-b-slate-900" />
                <span className="text-[9px] font-bold text-slate-900">Live</span>
              </div>
            </div>

            {/* Legend Zones */}
            <div className="mt-3 grid grid-cols-3 gap-1 text-[10px] text-center font-medium">
              <div className="rounded bg-emerald-50 text-emerald-800 p-1 border border-emerald-200">
                Safe &lt;75%
              </div>
              <div className="rounded bg-amber-50 text-amber-800 p-1 border border-amber-200">
                Strained 75-90%
              </div>
              <div className="rounded bg-rose-50 text-rose-800 p-1 border border-rose-200">
                Bottleneck &gt;90%
              </div>
            </div>
          </div>

          {/* Operational Metrics List */}
          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between items-center py-1 border-b border-slate-100">
              <span className="text-slate-500">Fleet Transport Capacity:</span>
              <span className="font-mono font-bold text-slate-900">
                {currentCapacity.toLocaleString()} kg/day
              </span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-100">
              <span className="text-slate-500">Potential Collectible Surplus:</span>
              <span className="font-mono font-bold text-slate-900">
                {Math.round(potentialSurplus).toLocaleString()} kg/day
              </span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-500">Uncollected Spillover (Lost):</span>
              <span
                className={`font-mono font-bold ${
                  uncollectedSurplus > 0 ? "text-rose-600" : "text-emerald-700"
                }`}
              >
                {Math.round(uncollectedSurplus).toLocaleString()} kg/day
              </span>
            </div>
          </div>

          {uncollectedSurplus > 0 && (
            <div className="rounded-lg bg-rose-50 p-3 text-[11px] text-rose-800 border border-rose-200 leading-relaxed">
              <strong>Capacity Deficit:</strong> {Math.round(uncollectedSurplus).toLocaleString()} kg of edible food cannot be recovered daily due to vehicle fleet limits.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
