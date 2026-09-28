import {
  AlertTriangle,
  BrainCircuit,
  Building2,
  CheckCircle2,
  FileCheck2,
  HelpCircle,
  Layers,
  Sparkles,
  Users,
} from "lucide-react";
import type { ProblemAnalysis } from "@/types/database";
import {
  problemAnalysisOutputSchema,
  type ProblemAnalysisOutput,
  type ReviewStatus,
} from "@/lib/validation/analysis";
import { AnalyzeButton } from "./analyze-button";
import { ReviewStatusControl } from "./review-status-control";

interface AnalysisViewProps {
  problemId: string;
  analysis: ProblemAnalysis;
}

function parseStructuredOutput(data: unknown): ProblemAnalysisOutput | null {
  const result = problemAnalysisOutputSchema.safeParse(data);
  return result.success ? result.data : null;
}

function formatCategory(cat: string): string {
  return cat.replaceAll("_", " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

export function AnalysisView({ problemId, analysis }: AnalysisViewProps) {
  const structured = parseStructuredOutput(analysis.structured_output);
  const currentStatus = (analysis.review_status as ReviewStatus) || "draft";

  if (!structured) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
        <p className="font-semibold">Analysis data format unrecognized</p>
        <p className="mt-1 text-amber-700">
          The analysis output could not be formatted. You can re-run the AI analyzer to generate a fresh breakdown.
        </p>
        <div className="mt-4">
          <AnalyzeButton problemId={problemId} isReanalyze />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner & Metadata */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-[#123b5d]/10 px-2.5 py-1 text-xs font-semibold text-[#123b5d]">
                <BrainCircuit size={14} /> AI Problem Analyzer
              </span>
              <span className="inline-flex items-center gap-1 rounded-md bg-purple-50 px-2.5 py-1 text-xs font-medium text-purple-700 border border-purple-200">
                <Sparkles size={13} /> Provenance: AI Suggestion
              </span>
              {currentStatus === "accepted" ? (
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
                  <CheckCircle2 size={13} /> Accepted Analysis
                </span>
              ) : currentStatus === "reviewed" ? (
                <span className="inline-flex items-center gap-1 rounded-md bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700 border border-sky-200">
                  <FileCheck2 size={13} /> Reviewed
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                  Draft Analysis
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
              Civic Challenge Assessment
            </h2>
            <p className="text-xs text-slate-400">
              Generated {new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(analysis.created_at))} • Subject to human verification
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <AnalyzeButton problemId={problemId} isReanalyze />
          </div>
        </div>

        {/* Executive Summary */}
        <div className="mt-6 rounded-lg bg-slate-50 border border-slate-200/80 p-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Executive Summary
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-700">
            {structured.summary}
          </p>
        </div>

        {/* Human-in-the-loop review actions */}
        <div className="mt-5 border-t border-slate-100 pt-4">
          <ReviewStatusControl
            problemId={problemId}
            analysisId={analysis.id}
            currentStatus={currentStatus}
          />
        </div>
      </div>

      {/* Grid: Root Causes & Stakeholders */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Root Causes */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-rose-50 text-rose-600">
              <Layers size={17} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Identified Root Causes</h3>
              <p className="text-xs text-slate-500">Underlying structural and systemic factors</p>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            {structured.rootCauses.map((rc, i) => (
              <div
                key={i}
                className="rounded-lg border border-slate-150 bg-slate-50/60 p-4 transition-colors hover:bg-slate-50"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-sm text-slate-900">
                    {i + 1}. {rc.title}
                  </span>
                  <span className="shrink-0 rounded bg-slate-200/80 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                    {formatCategory(rc.category)}
                  </span>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-slate-600">
                  {rc.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Key Stakeholders */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-blue-50 text-blue-600">
              <Users size={17} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Key Stakeholders</h3>
              <p className="text-xs text-slate-500">Institutions, groups, and responsible actors</p>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            {structured.stakeholders.map((sh, i) => (
              <div
                key={i}
                className="rounded-lg border border-slate-150 bg-slate-50/60 p-4 transition-colors hover:bg-slate-50"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-semibold text-sm text-slate-900">{sh.group}</h4>
                    <p className="text-xs font-medium text-slate-500">{sh.role}</p>
                  </div>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-slate-600">
                  <strong className="text-slate-700">Ecosystem impact:</strong> {sh.impact}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Grid: Affected Population & Constraints */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Affected Population */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-50 text-emerald-600">
              <Building2 size={17} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Affected Population</h3>
              <p className="text-xs text-slate-500">Citizens and communities directly impacted</p>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            {structured.affectedPopulation.map((ap, i) => (
              <div
                key={i}
                className="rounded-lg border border-slate-150 bg-slate-50/60 p-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-semibold text-sm text-slate-900">{ap.group}</h4>
                  {ap.estimatedScale && (
                    <span className="rounded bg-emerald-100/70 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                      {ap.estimatedScale}
                    </span>
                  )}
                </div>
                <p className="mt-2 text-xs leading-relaxed text-slate-600">
                  {ap.impactDescription}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Civic Constraints */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-amber-50 text-amber-600">
              <AlertTriangle size={17} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Civic Constraints</h3>
              <p className="text-xs text-slate-500">Legal, fiscal, and operational boundaries</p>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            {structured.constraints.length === 0 ? (
              <p className="text-xs text-slate-400">No constraints specified.</p>
            ) : (
              structured.constraints.map((c, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-slate-150 bg-slate-50/60 p-4"
                >
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-amber-100/70 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                      {formatCategory(c.category)}
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-slate-600">
                    {c.description}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* Key Assumptions */}
      {structured.keyAssumptions.length > 0 && (
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-50 text-indigo-600">
              <HelpCircle size={17} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Key Analytical Assumptions</h3>
              <p className="text-xs text-slate-500">
                Foundational hypotheses that must be checked with empirical data before simulation
              </p>
            </div>
          </div>

          <ul className="mt-4 space-y-2.5">
            {structured.keyAssumptions.map((assumption, i) => (
              <li
                key={i}
                className="flex items-start gap-2.5 text-xs text-slate-700 leading-relaxed"
              >
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#123b5d] shrink-0" />
                <span>{assumption}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
