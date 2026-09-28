import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Cpu,
  Microscope,
  Plus,
  Sliders,
} from "lucide-react";
import { getCurrentUserProblems } from "@/features/problems/repository";
import { foodRecoveryModelDefinition } from "@/simulation/models/food-recovery";
import { Button } from "@/components/ui/button";

export default async function SimulatorPage() {
  const { problems } = await getCurrentUserProblems();
  const model = foodRecoveryModelDefinition;

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* HEADER */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                <CheckCircle2 size={12} className="text-emerald-600" />
                Deterministic Engine v1.0.0
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                <Cpu size={12} /> Pure TypeScript Logic
              </span>
            </div>

            <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Deterministic Impact Simulator
            </h1>
            <p className="mt-1 text-xs text-slate-500 leading-relaxed max-w-2xl">
              CivicOS replaces probabilistic guesses with verifiable mathematical models. Explore active
              urban simulation contracts, configure logistics variables, and test municipal interventions.
            </p>
          </div>

          <Button asChild className="bg-[#123b5d] hover:bg-[#0e2f4a] text-white text-xs font-semibold shadow-xs">
            <Link href="/problems/new">
              <Plus size={14} /> New Challenge
            </Link>
          </Button>
        </div>
      </div>

      {/* ACTIVE MODEL SPECIFICATION CARD */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-50 text-emerald-700">
              <Microscope size={18} />
            </div>
            <div>
              <h2 className="font-bold text-sm text-slate-900">{model.name}</h2>
              <p className="text-[11px] text-slate-400 font-mono">ID: {model.id} &bull; v{model.version}</p>
            </div>
          </div>
          <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-800">
            Active Core Model
          </span>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">{model.description}</p>

        {/* MODEL CHARACTERISTICS GRID */}
        <div className="grid grid-cols-2 gap-3 pt-2 sm:grid-cols-4 text-xs">
          <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
            <span className="text-[10px] text-slate-400 font-semibold uppercase">Configurable Inputs</span>
            <p className="text-lg font-bold text-slate-900 mt-1">{model.inputs.length} Variables</p>
            <p className="text-[10px] text-slate-400">Sliders & boundaries</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
            <span className="text-[10px] text-slate-400 font-semibold uppercase">Evaluated Formulas</span>
            <p className="text-lg font-bold text-slate-900 mt-1">{model.formulas.length} Equations</p>
            <p className="text-[10px] text-slate-400">Zero arbitrary code</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
            <span className="text-[10px] text-slate-400 font-semibold uppercase">Bottleneck Rules</span>
            <p className="text-lg font-bold text-rose-700 mt-1">{model.bottleneckRules.length} Monitors</p>
            <p className="text-[10px] text-slate-400">Capacity & saturation</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
            <span className="text-[10px] text-slate-400 font-semibold uppercase">Output Metrics</span>
            <p className="text-lg font-bold text-[#123b5d] mt-1">{model.outputMetrics.length} KPIs</p>
            <p className="text-[10px] text-slate-400">Surplus, meals & fleet</p>
          </div>
        </div>
      </div>

      {/* LAUNCH WORKBENCH SECTION */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2">
            <Sliders size={14} className="text-[#123b5d]" /> Launch Simulation Workbench ({problems.length})
          </h2>
          <span className="text-[11px] text-slate-400">Select a problem to simulate live</span>
        </div>

        {problems.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-xs">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-[#123b5d]">
              <Sliders size={24} />
            </div>
            <h3 className="mt-4 font-bold text-slate-900 text-sm">No Challenges Configured</h3>
            <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              Create your first civic problem to test scenarios, monitor fleet capacity limits, and analyze trade-offs.
            </p>
            <Button asChild className="mt-5 bg-[#123b5d] hover:bg-[#0e2f4a] text-white text-xs">
              <Link href="/problems/new">
                <Plus size={14} /> Create Problem
              </Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {problems.map((p) => (
              <div
                key={p.id}
                className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-xs transition-shadow hover:shadow-sm"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-700">
                      {p.status.replace("_", " ")}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">Model: food_recovery</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900">{p.title}</h3>
                  <p className="line-clamp-2 text-xs text-slate-600 leading-relaxed">{p.description}</p>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">Interactive Controls</span>
                  <Button asChild size="sm" className="bg-[#123b5d] hover:bg-[#0e2f4a] text-white text-xs">
                    <Link href={`/problems/${p.id}#simulation-workbench`}>
                      Open Simulator <ArrowRight size={13} />
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
