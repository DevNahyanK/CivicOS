import Link from "next/link";
import { ArrowRight, BarChart3, FileText, Lightbulb, LineChart, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Problem } from "@/types/database";

interface OverviewDashboardProps {
  problems: Problem[];
  error: boolean;
  solutionsCount?: number;
  scenariosCount?: number;
}

export function OverviewDashboard({
  problems,
  error,
  solutionsCount = 0,
  scenariosCount = 0,
}: OverviewDashboardProps) {
  const statistics = [
    {
      label: "Problems Tracked",
      value: error ? "—" : String(problems.length),
      icon: FileText,
      note: "Active civic challenges",
      href: "/problems",
    },
    {
      label: "Solutions Formulated",
      value: error ? "—" : String(solutionsCount),
      icon: Lightbulb,
      note: "Intervention action plans",
      href: "/solutions",
    },
    {
      label: "Scenarios Simulated",
      value: error ? "—" : String(scenariosCount),
      icon: LineChart,
      note: "Calibrated model states",
      href: "/scenarios",
    },
    {
      label: "Global City Impact",
      value: error ? "—" : "Active",
      icon: BarChart3,
      note: "Calculated diversion targets",
      href: "/impact",
    },
  ];

  return (
    <div className="space-y-8">
      {/* HERO BANNER */}
      <section className="rounded-xl border border-slate-200 bg-white px-6 py-8 sm:px-8 shadow-xs">
        <Badge className="bg-[#e9f0f5] text-[#123b5d] font-semibold">
          Civic Planning & Operations Platform
        </Badge>
        <h1 className="mt-4 max-w-2xl text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
          Turn City Problems Into Tested Solutions.
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
          Analyze complex problems, discover root causes, design interventions, simulate deterministic outcomes,
          and track operational milestones with complete provenance transparency.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Button asChild className="bg-[#123b5d] hover:bg-[#0e2f4a] text-white">
            <Link href="/problems/new">
              <Plus size={16} /> Create New Problem
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/impact">
              <BarChart3 size={15} /> View City Impact
            </Link>
          </Button>
        </div>
      </section>

      {/* WORKSPACE STATS GRID */}
      <section aria-label="Workspace statistics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statistics.map(({ label, value, icon: Icon, note, href }) => (
          <Link
            key={label}
            href={href}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs transition-shadow hover:shadow-sm block group"
          >
            <div className="flex items-start justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
              <Icon size={18} className="text-slate-400 group-hover:text-[#123b5d] transition-colors" aria-hidden="true" />
            </div>
            <p className="mt-4 text-3xl font-bold tracking-tight text-slate-900">{value}</p>
            <p className="mt-1 text-xs text-slate-400">{note}</p>
          </Link>
        ))}
      </section>

      {/* RECENT PROBLEMS SECTION */}
      <section className="rounded-xl border border-slate-200 bg-white shadow-xs">
        <div className="flex flex-col justify-between gap-3 border-b border-slate-200 p-6 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-base font-bold text-slate-900">Recent Problems</h2>
            <p className="mt-0.5 text-xs text-slate-500">Your active municipal challenges and simulation workbenches.</p>
          </div>
          <Button asChild variant="outline" size="sm" className="text-xs text-[#123b5d]">
            <Link href="/problems">
              View all <ArrowRight size={14} />
            </Link>
          </Button>
        </div>

        {error ? (
          <div role="alert" className="p-6 text-sm text-slate-600">
            Recent problems are temporarily unavailable. Please try again shortly.
          </div>
        ) : problems.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <p className="font-bold text-slate-900 text-sm">No problems created yet</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Create your first problem to begin building a private civic workspace with AI analysis and simulations.
            </p>
            <Button asChild size="sm" className="mt-3 bg-[#123b5d] text-white">
              <Link href="/problems/new">
                <Plus size={14} /> Create Problem
              </Link>
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {problems.slice(0, 5).map((problem) => (
              <Link
                href={`/problems/${problem.id}`}
                key={problem.id}
                className="flex flex-col gap-3 px-6 py-4 transition-colors hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <h3 className="font-semibold text-sm text-slate-900">{problem.title}</h3>
                  <p className="mt-0.5 text-xs text-slate-400">
                    Updated {new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(problem.updated_at))}
                  </p>
                </div>
                <Badge className="self-start sm:self-auto capitalize">
                  {problem.status.replaceAll("_", " ")}
                </Badge>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
