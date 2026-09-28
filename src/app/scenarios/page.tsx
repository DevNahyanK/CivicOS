import Link from "next/link";
import {
  ArrowRight,
  BookmarkCheck,
  CheckCircle2,
  FileText,
  Layers,
  LineChart,
  Plus,
} from "lucide-react";
import { getCurrentUserProblems } from "@/features/problems/repository";
import { getProblemScenarios } from "@/features/scenarios/repository";
import { Button } from "@/components/ui/button";
import type { Scenario } from "@/types/database";

interface ScenarioWithProblem {
  scenario: Scenario;
  problemId: string;
  problemTitle: string;
}

export default async function ScenariosPage() {
  const { problems } = await getCurrentUserProblems();

  // Aggregate all saved scenarios across all user problems
  const allScenarios: ScenarioWithProblem[] = [];

  await Promise.all(
    problems.map(async (problem) => {
      const { scenarios } = await getProblemScenarios(problem.id);
      for (const sc of scenarios) {
        allScenarios.push({
          scenario: sc,
          problemId: problem.id,
          problemTitle: problem.title,
        });
      }
    })
  );

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* HEADER */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                <CheckCircle2 size={12} className="text-emerald-600" />
                Deterministic Scenarios
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                <Layers size={12} /> {allScenarios.length} Saved Configurations
              </span>
            </div>

            <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Saved Scenarios & Policy Alternatives
            </h1>
            <p className="mt-1 text-xs text-slate-500 leading-relaxed max-w-2xl">
              Compare calibrated simulation states across your civic challenges. Evaluate baseline models,
              fleet scaling experiments, and operational trade-offs side by side.
            </p>
          </div>

          <Button asChild className="bg-[#123b5d] hover:bg-[#0e2f4a] text-white text-xs font-semibold shadow-xs">
            <Link href="/problems">
              <Plus size={14} /> Explore Problems
            </Link>
          </Button>
        </div>
      </div>

      {/* SCENARIOS LIST */}
      {allScenarios.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-xs">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-[#123b5d]">
            <LineChart size={24} />
          </div>
          <h3 className="mt-4 font-bold text-slate-900 text-sm">No Scenarios Saved Yet</h3>
          <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            Open the simulation workbench on any civic challenge to adjust logistics parameters, test capacity limits,
            and save named scenarios.
          </p>
          <Button asChild className="mt-5 bg-[#123b5d] hover:bg-[#0e2f4a] text-white text-xs">
            <Link href="/problems">
              <FileText size={14} /> View Problems
            </Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Saved Policy Models ({allScenarios.length})
            </h2>
            <span className="text-[11px] text-slate-400">Deterministic calculations</span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {allScenarios.map(({ scenario: sc, problemId, problemTitle }) => {
              const res = sc.results as {
                metrics?: Record<string, { value: number; unit?: string }>;
                resolvedInputs?: Record<string, { value: number; unit?: string }>;
              } | null;

              const recoveredKg = res?.metrics?.actual_recovered_food_kg?.value ?? 0;
              const meals = res?.metrics?.meals_provided_daily?.value ?? 0;
              const vehicles = res?.resolvedInputs?.active_vehicles?.value ?? 3;
              const utilization = res?.metrics?.fleet_utilization_pct?.value ?? 0;

              return (
                <div
                  key={sc.id}
                  className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-xs transition-shadow hover:shadow-sm"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[11px] font-medium text-slate-500 truncate max-w-[200px]">
                        Challenge: <strong>{problemTitle}</strong>
                      </span>
                      {sc.is_baseline && (
                        <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-800 flex items-center gap-1">
                          <BookmarkCheck size={11} /> Baseline
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="font-bold text-base text-slate-900">{sc.name}</h3>
                      {sc.description && (
                        <p className="mt-0.5 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                          {sc.description}
                        </p>
                      )}
                    </div>

                    {/* METRICS ROW */}
                    <div className="grid grid-cols-3 gap-2 rounded-lg bg-slate-50 p-2.5 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400">Recovery</span>
                        <p className="font-bold text-emerald-700">
                          {Math.round(recoveredKg).toLocaleString()} kg/d
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400">Meals</span>
                        <p className="font-bold text-slate-900">
                          {Math.round(meals).toLocaleString()} /d
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400">Fleet Load</span>
                        <p className="font-bold text-slate-900">
                          {Math.round(utilization)}% ({vehicles} vans)
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 font-mono">
                      {new Date(sc.created_at).toLocaleDateString()}
                    </span>

                    <Button asChild size="sm" variant="outline" className="text-xs text-[#123b5d] hover:bg-slate-50">
                      <Link href={`/problems/${problemId}#simulation-workbench`}>
                        Workbench <ArrowRight size={12} />
                      </Link>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
