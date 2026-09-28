import Link from "next/link";
import { ArrowRight, Briefcase, Plus } from "lucide-react";
import { getCurrentUserProblems } from "@/features/problems/repository";
import { Button } from "@/components/ui/button";

export default async function SolutionsPage() {
  const { problems } = await getCurrentUserProblems();

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Solution Designer & Interventions
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Formulate operational action plans, link verified simulation targets, and track implementation milestones.
          </p>
        </div>

        <Button asChild className="bg-[#123b5d] hover:bg-[#0e2f4a] text-white">
          <Link href="/problems/new">
            <Plus size={16} /> New Problem
          </Link>
        </Button>
      </div>

      {problems.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-xs">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-[#123b5d]">
            <Briefcase size={24} />
          </div>
          <h3 className="mt-4 font-bold text-slate-900 text-sm">No Active Problems</h3>
          <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            Create or explore a civic problem first to begin designing data-driven solutions and operational roadmaps.
          </p>
          <Button asChild className="mt-5 bg-[#123b5d] hover:bg-[#0e2f4a] text-white text-xs">
            <Link href="/problems/new">
              <Plus size={14} /> Create Problem
            </Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Active Challenges ({problems.length})
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {problems.map((p) => (
              <div
                key={p.id}
                className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-xs transition-shadow hover:shadow-sm"
              >
                <div className="space-y-2">
                  <span className="inline-block rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-700">
                    {p.status.replace("_", " ")}
                  </span>
                  <h3 className="text-base font-bold text-slate-900">{p.title}</h3>
                  <p className="line-clamp-2 text-xs text-slate-600 leading-relaxed">
                    {p.description}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">Solution Workbench</span>
                  <Button asChild size="sm" variant="outline" className="text-xs text-[#123b5d] hover:bg-slate-50">
                    <Link href={`/problems/${p.id}#solutions-section`}>
                      Open Designer <ArrowRight size={13} />
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
