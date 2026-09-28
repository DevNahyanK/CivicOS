"use client";

import { useMemo, useSyncExternalStore } from "react";
import Link from "next/link";
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
import {
  ArrowRight,
  BarChart3,
  Briefcase,
  Building2,
  CheckCircle2,
  Leaf,
  LineChart,
  Plus,
  Truck,
  Utensils,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export interface ProblemImpactSummary {
  problemId: string;
  problemTitle: string;
  problemStatus: string;
  location?: string | null;
  scenarioCount: number;
  baselineScenarioName?: string | null;
  dailySurplusKg: number;
  dailyRecoveredKg: number;
  annualRecoveredTons: number;
  dailyMeals: number;
  annualMeals: number;
  fleetUtilizationPct: number;
  activeVehicles: number;
  solutionsCount: number;
  completedMilestones: number;
  totalMilestones: number;
}

interface ImpactDashboardProps {
  summaries: ProblemImpactSummary[];
}

const emptySubscribe = () => () => {};

export function ImpactDashboard({ summaries }: ImpactDashboardProps) {
  const isMounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  // Aggregate global city-wide impact metrics deterministically
  const totals = useMemo(() => {
    let totalDailyRecoveredKg = 0;
    let totalAnnualRecoveredTons = 0;
    let totalDailyMeals = 0;
    let totalAnnualMeals = 0;
    let totalVehicles = 0;
    let totalSolutions = 0;
    let totalMilestones = 0;
    let completedMilestones = 0;

    for (const s of summaries) {
      totalDailyRecoveredKg += s.dailyRecoveredKg;
      totalAnnualRecoveredTons += s.annualRecoveredTons;
      totalDailyMeals += s.dailyMeals;
      totalAnnualMeals += s.annualMeals;
      totalVehicles += s.activeVehicles;
      totalSolutions += s.solutionsCount;
      totalMilestones += s.totalMilestones;
      completedMilestones += s.completedMilestones;
    }

    const milestoneCompletionRate =
      totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;

    return {
      totalDailyRecoveredKg,
      totalAnnualRecoveredTons: Math.round(totalAnnualRecoveredTons * 10) / 10,
      totalDailyMeals,
      totalAnnualMeals,
      totalVehicles,
      totalSolutions,
      totalMilestones,
      completedMilestones,
      milestoneCompletionRate,
    };
  }, [summaries]);

  // Chart data: Problem-by-problem comparative impact
  const chartData = useMemo(() => {
    return summaries.map((s) => ({
      name: s.problemTitle.length > 20 ? `${s.problemTitle.slice(0, 18)}…` : s.problemTitle,
      fullName: s.problemTitle,
      surplusKg: Math.round(s.dailySurplusKg),
      recoveredKg: Math.round(s.dailyRecoveredKg),
      meals: Math.round(s.dailyMeals),
      vehicles: s.activeVehicles,
    }));
  }, [summaries]);

  return (
    <div className="space-y-8">
      {/* HEADER & PROVENANCE DISCLOSURE */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                <CheckCircle2 size={12} className="text-emerald-600" />
                Aggregated Metrics: 100% Calculated
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 border border-indigo-200/80 px-2.5 py-0.5 text-xs font-bold text-indigo-700">
                <Zap size={12} className="text-indigo-600" />
                City-Wide Performance Rollup
              </span>
            </div>

            <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Global Impact Dashboard & City Metrics
            </h1>
            <p className="mt-1 text-xs text-slate-500 leading-relaxed max-w-2xl">
              Holistic measurement across all active civic challenges, verified simulation models, and intervention
              action plans. All figures are deterministically aggregated from saved database scenarios.
            </p>
          </div>

          <Button asChild className="bg-[#123b5d] hover:bg-[#0e2f4a] text-white text-xs font-semibold shadow-xs">
            <Link href="/problems/new">
              <Plus size={14} /> New Civic Problem
            </Link>
          </Button>
        </div>

        {/* 4 GLOBAL KPI TILES */}
        <div className="mt-6 grid grid-cols-2 gap-4 border-t border-slate-100 pt-6 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold">Annual Food Diverted</span>
              <Leaf size={16} className="text-emerald-600" />
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {totals.totalAnnualRecoveredTons.toLocaleString()} <span className="text-xs font-normal text-slate-500">tons/yr</span>
            </p>
            <p className="mt-1 text-[11px] text-slate-400">
              {Math.round(totals.totalDailyRecoveredKg).toLocaleString()} kg/day projected
            </p>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold">Annual Meals Delivered</span>
              <Utensils size={16} className="text-[#123b5d]" />
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {totals.totalAnnualMeals.toLocaleString()} <span className="text-xs font-normal text-slate-500">meals/yr</span>
            </p>
            <p className="mt-1 text-[11px] text-slate-400">
              {Math.round(totals.totalDailyMeals).toLocaleString()} meals/day active
            </p>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold">Active Fleet Capacity</span>
              <Truck size={16} className="text-sky-600" />
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {totals.totalVehicles} <span className="text-xs font-normal text-slate-500">vehicles</span>
            </p>
            <p className="mt-1 text-[11px] text-slate-400">Across {summaries.length} civic programs</p>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold">Action Plan Execution</span>
              <Briefcase size={16} className="text-amber-600" />
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-2xl font-bold text-slate-900">{totals.milestoneCompletionRate}%</span>
              <div className="h-2 flex-1 rounded-full bg-slate-200 overflow-hidden">
                <div
                  className="h-full bg-emerald-600 transition-all duration-300"
                  style={{ width: `${totals.milestoneCompletionRate}%` }}
                />
              </div>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              {totals.completedMilestones} of {totals.totalMilestones} milestones completed
            </p>
          </div>
        </div>
      </div>

      {/* RECHARTS SECTION: PROGRAM COMPARISON */}
      {summaries.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <BarChart3 size={16} className="text-[#123b5d]" /> Daily Food Surplus vs Recovered Volume (kg/day)
              </h2>
              <p className="text-xs text-slate-500">
                Contrast available unsold edible surplus against projected collected volume per challenge
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-500">
              {summaries.length} Programs Monitored
            </span>
          </div>

          <div className="h-[300px] w-full pt-2">
            {!isMounted ? (
              <div className="h-full w-full flex items-center justify-center bg-slate-50 rounded-lg text-xs text-slate-400">
                Loading city impact visualization…
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 15, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#475569" }} axisLine={{ stroke: "#cbd5e1" }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#475569" }} axisLine={{ stroke: "#cbd5e1" }} tickLine={false} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-lg text-xs space-y-1 z-50">
                            <p className="font-bold text-slate-900 border-b pb-1">{label}</p>
                            {payload.map((item, idx) => (
                              <div key={idx} className="flex items-center justify-between gap-4">
                                <span className="text-slate-600">{item.name}:</span>
                                <span className="font-mono font-bold text-slate-900">{Number(item.value).toLocaleString()} kg</span>
                              </div>
                            ))}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                  <Bar dataKey="surplusKg" name="Commercial Surplus (kg/day)" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="recoveredKg" name="Recovered Edible Food (kg/day)" fill="#059669" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}

      {/* DETAILED PROGRAM CARDS / BREAKDOWN */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2">
            <Building2 size={14} className="text-[#123b5d]" /> Municipal Problem Breakdown ({summaries.length})
          </h2>
          <span className="text-[11px] text-slate-400">Direct links to simulation workbenches</span>
        </div>

        {summaries.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-xs">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-[#123b5d]">
              <LineChart size={24} />
            </div>
            <h3 className="mt-4 font-bold text-slate-900 text-sm">No Active Programs Detected</h3>
            <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              Create your first problem and save simulation scenarios to populate the global city impact dashboard.
            </p>
            <Button asChild className="mt-5 bg-[#123b5d] hover:bg-[#0e2f4a] text-white text-xs">
              <Link href="/problems/new">
                <Plus size={14} /> Create Problem
              </Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {summaries.map((item) => (
              <div
                key={item.problemId}
                className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-xs transition-shadow hover:shadow-sm"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-700">
                      {item.problemStatus.replace("_", " ")}
                    </span>
                    {item.location && (
                      <span className="text-[11px] font-medium text-slate-400 truncate max-w-[140px]">
                        {item.location}
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="font-bold text-base text-slate-900">{item.problemTitle}</h3>
                    <p className="mt-1 text-xs text-slate-500">
                      {item.scenarioCount > 0 ? (
                        <>
                          Active Scenario: <strong>{item.baselineScenarioName ?? "Custom Model"}</strong>
                        </>
                      ) : (
                        "Default baseline configuration"
                      )}
                    </p>
                  </div>

                  {/* MINI METRICS ROW */}
                  <div className="grid grid-cols-3 gap-2 rounded-lg bg-slate-50 p-2.5 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400">Recovered</span>
                      <p className="font-bold text-emerald-700">
                        {Math.round(item.dailyRecoveredKg).toLocaleString()} kg/d
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400">Meals</span>
                      <p className="font-bold text-slate-900">
                        {Math.round(item.dailyMeals).toLocaleString()} /d
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400">Solutions</span>
                      <p className="font-bold text-[#123b5d]">
                        {item.solutionsCount} active
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-medium text-slate-500">
                    Fleet: {item.activeVehicles} vans ({Math.round(item.fleetUtilizationPct)}% load)
                  </span>

                  <Button asChild size="sm" variant="outline" className="text-xs text-[#123b5d] hover:bg-slate-50">
                    <Link href={`/problems/${item.problemId}#simulation-workbench`}>
                      Workbench <ArrowRight size={12} />
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
