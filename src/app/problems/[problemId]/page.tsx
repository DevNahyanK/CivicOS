import Link from "next/link";
import { BrainCircuit, CalendarDays, ChevronLeft, Info, MapPin, Pencil, Sliders } from "lucide-react";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getOwnedProblem } from "@/features/problems/repository";
import { problemIdSchema } from "@/lib/validation/problem";
import { getProblemAnalysis } from "@/features/analysis/repository";
import { AnalysisView } from "@/features/analysis/analysis-view";
import { AnalyzeButton } from "@/features/analysis/analyze-button";
import { isGeminiConfigured } from "@/lib/ai/client";
import { getProblemScenarios } from "@/features/scenarios/repository";
import { SimulationWorkbench } from "@/features/simulation/simulation-workbench";

function locationLabel(
  context: Awaited<ReturnType<typeof getOwnedProblem>>["problem"] extends infer T
    ? T extends { location_context: infer C }
      ? C
      : never
    : never
) {
  return context &&
    typeof context === "object" &&
    !Array.isArray(context) &&
    "label" in context &&
    typeof context.label === "string"
    ? context.label
    : null;
}

function formatStatus(status: string) {
  return status.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default async function ProblemDetailPage({
  params,
}: {
  params: Promise<{ problemId: string }>;
}) {
  const { problemId } = await params;
  if (!problemIdSchema.safeParse(problemId).success) notFound();

  const { problem, error } = await getOwnedProblem(problemId);
  if (!problem && !error) notFound();
  if (error || !problem) throw new Error("Unable to load this problem.");

  const [{ analysis }, { scenarios }] = await Promise.all([
    getProblemAnalysis(problemId),
    getProblemScenarios(problemId),
  ]);

  const location = locationLabel(problem.location_context);
  const geminiReady = isGeminiConfigured();

  return (
    <div className="mx-auto max-w-4xl space-y-10">
      <div>
        <Link
          href="/problems"
          className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-900"
        >
          <ChevronLeft size={16} /> Back to Problems
        </Link>

        {/* Problem Card */}
        <section className="mt-5 rounded-xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
            <div>
              <Badge>{formatStatus(problem.status)}</Badge>
              <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900">
                {problem.title}
              </h1>
            </div>
            <Button asChild variant="outline">
              <Link href={`/problems/${problem.id}/edit`}>
                <Pencil size={16} /> Edit problem
              </Link>
            </Button>
          </div>

          <div className="mt-7 border-t border-slate-100 pt-7">
            <h2 className="text-sm font-semibold text-slate-800">Description</h2>
            <p className="mt-3 whitespace-pre-wrap leading-7 text-slate-600">
              {problem.description}
            </p>
          </div>

          <dl className="mt-8 grid gap-5 border-t border-slate-100 pt-7 sm:grid-cols-2">
            <div>
              <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <CalendarDays size={15} /> Created
              </dt>
              <dd className="mt-2 text-sm text-slate-700">
                {new Intl.DateTimeFormat("en", {
                  dateStyle: "medium",
                  timeStyle: "short",
                }).format(new Date(problem.created_at))}
              </dd>
            </div>
            <div>
              <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <CalendarDays size={15} /> Last updated
              </dt>
              <dd className="mt-2 text-sm text-slate-700">
                {new Intl.DateTimeFormat("en", {
                  dateStyle: "medium",
                  timeStyle: "short",
                }).format(new Date(problem.updated_at))}
              </dd>
            </div>
            {location && (
              <div className="sm:col-span-2">
                <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <MapPin size={15} /> Location context
                </dt>
                <dd className="mt-2 text-sm text-slate-700">{location}</dd>
              </div>
            )}
          </dl>
        </section>
      </div>

      {/* Navigation Quick Links */}
      <nav aria-label="Section shortcuts" className="flex items-center gap-3 border-y border-slate-200 py-3 text-xs font-semibold text-slate-600">
        <a href="#analysis-section" className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 hover:bg-slate-100 transition-colors">
          <BrainCircuit size={14} className="text-[#123b5d]" /> AI Problem Analysis
        </a>
        <span className="text-slate-300">•</span>
        <a href="#simulation-workbench" className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 hover:bg-slate-100 transition-colors">
          <Sliders size={14} className="text-[#123b5d]" /> Simulation & Scenarios Workbench
        </a>
      </nav>

      {/* SECTION 1: AI Problem Analyzer */}
      <section id="analysis-section" aria-label="AI Problem Analyzer" className="space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <BrainCircuit size={20} className="text-[#123b5d]" /> AI Problem Analysis
            </h2>
            <p className="text-xs text-slate-500">Root cause extraction, stakeholders, and qualitative civic boundaries</p>
          </div>
        </div>

        {analysis ? (
          <AnalysisView problemId={problem.id} analysis={analysis} />
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white p-7 sm:p-8 shadow-xs">
            <div className="flex items-start gap-4">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[#123b5d]/10 text-[#123b5d]">
                <BrainCircuit size={24} />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold tracking-tight text-slate-900">
                    AI Problem Analyzer
                  </h3>
                  <span className="rounded-md bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-700 border border-purple-200">
                    Phase 3
                  </span>
                </div>
                <p className="text-sm leading-6 text-slate-600">
                  Deconstruct this civic challenge using Google Gemini. The analyzer discovers root causes, maps ecosystem stakeholders, isolates civic constraints, and flags foundational assumptions with provenance tracking.
                </p>
              </div>
            </div>

            {!geminiReady && (
              <div className="mt-5 flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                <Info size={18} className="mt-0.5 shrink-0 text-amber-600" />
                <div>
                  <p className="font-semibold">Gemini API configuration recommended</p>
                  <p className="mt-1 text-xs text-amber-700 leading-relaxed">
                    Set <code className="font-mono bg-amber-100/80 px-1 py-0.5 rounded">GEMINI_API_KEY</code> in your <code className="font-mono bg-amber-100/80 px-1 py-0.5 rounded">.env.local</code> file to run real-time analysis against Google Gemini.
                  </p>
                </div>
              </div>
            )}

            <div className="mt-6 border-t border-slate-100 pt-6">
              <AnalyzeButton problemId={problem.id} />
            </div>
          </div>
        )}
      </section>

      {/* SECTION 2: Interactive Simulation & Scenarios Workbench */}
      <section id="simulation-workbench" aria-label="Simulation & Scenarios Workbench" className="space-y-6 pt-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Sliders size={20} className="text-[#123b5d]" /> Simulation & Scenarios Workbench
            </h2>
            <p className="text-xs text-slate-500">
              Deterministic calculations, scenario comparisons, and real-time bottleneck detection
            </p>
          </div>
          <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 border border-emerald-200">
            Phase 5 Live
          </span>
        </div>

        <SimulationWorkbench problemId={problem.id} initialScenarios={scenarios} />
      </section>
    </div>
  );
}
