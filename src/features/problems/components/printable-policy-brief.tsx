"use client";

import { useMemo, useState } from "react";
import { Eye, MapPin, Printer, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Problem, ProblemAnalysis, Scenario, Solution } from "@/types/database";
import type { ProblemAnalysisOutput } from "@/lib/validation/analysis";
import type { SolutionMilestone } from "@/lib/validation/solution";
import { SimulationEngine } from "@/simulation/core/engine";
import { foodRecoveryModelDefinition } from "@/simulation/models/food-recovery";
import type { SimulationInputValues } from "@/simulation/types";

interface PrintablePolicyBriefProps {
  problem: Problem;
  analysis: ProblemAnalysis | null;
  scenarios: Scenario[];
  solutions: Solution[];
  location: string | null;
}

export function PrintablePolicyBrief({
  problem,
  analysis,
  scenarios,
  solutions,
  location,
}: PrintablePolicyBriefProps) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Parse Phase 3 structured analysis if available
  const parsedAnalysis = useMemo(() => {
    if (!analysis?.structured_output || typeof analysis.structured_output !== "object") {
      return null;
    }
    return analysis.structured_output as unknown as ProblemAnalysisOutput;
  }, [analysis]);

  // Find baseline or primary scenario
  const primaryScenario = useMemo(() => {
    return scenarios.find((s) => s.is_baseline) ?? scenarios[0] ?? null;
  }, [scenarios]);

  // Deterministically evaluate primary scenario results
  const primaryMetrics = useMemo(() => {
    const rawInputs = (primaryScenario &&
    typeof primaryScenario.inputs === "object" &&
    primaryScenario.inputs !== null
      ? primaryScenario.inputs
      : {}) as SimulationInputValues;

    return SimulationEngine.run({
      model: foodRecoveryModelDefinition,
      inputs: rawInputs,
    });
  }, [primaryScenario]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      {/* TRIGGER BUTTONS */}
      <div className="flex items-center gap-2">
        <Button
          onClick={() => setIsPreviewOpen(true)}
          variant="outline"
          size="sm"
          className="text-xs font-semibold text-slate-700 hover:bg-slate-100 print:hidden"
        >
          <Eye size={14} /> Preview Brief
        </Button>
        <Button
          onClick={handlePrint}
          size="sm"
          className="bg-[#123b5d] hover:bg-[#0e2f4a] text-white text-xs font-semibold shadow-xs print:hidden"
        >
          <Printer size={14} /> Export Policy Brief (PDF)
        </Button>
      </div>

      {/* SCREEN PREVIEW MODAL */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-4 backdrop-blur-xs overflow-y-auto print:hidden">
          <div className="w-full max-w-4xl rounded-2xl border border-slate-200 bg-white p-6 sm:p-10 shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-6">
              <div className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#123b5d] text-white font-bold text-sm">
                  C
                </span>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Policy Dossier Preview</h3>
                  <p className="text-xs text-slate-500">Ready for municipal export or print-to-PDF</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={handlePrint}
                  size="sm"
                  className="bg-[#123b5d] hover:bg-[#0e2f4a] text-white text-xs"
                >
                  <Printer size={13} /> Print / Save as PDF
                </Button>
                <button
                  type="button"
                  onClick={() => setIsPreviewOpen(false)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* EMBEDDED DOSSIER CONTENT */}
            <DossierContent
              problem={problem}
              analysis={analysis}
              parsedAnalysis={parsedAnalysis}
              primaryScenario={primaryScenario}
              primaryMetrics={primaryMetrics}
              solutions={solutions}
              location={location}
            />
          </div>
        </div>
      )}

      {/* PRINT-ONLY CONTAINER (visible ONLY during window.print()) */}
      <div id="print-dossier-root" className="hidden print:block print:w-full print:bg-white print:text-black">
        <DossierContent
          problem={problem}
          analysis={analysis}
          parsedAnalysis={parsedAnalysis}
          primaryScenario={primaryScenario}
          primaryMetrics={primaryMetrics}
          solutions={solutions}
          location={location}
        />
      </div>
    </>
  );
}

interface DossierContentProps {
  problem: Problem;
  analysis: ProblemAnalysis | null;
  parsedAnalysis: ProblemAnalysisOutput | null;
  primaryScenario: Scenario | null;
  primaryMetrics: ReturnType<typeof SimulationEngine.run>;
  solutions: Solution[];
  location: string | null;
}

function DossierContent({
  problem,
  parsedAnalysis,
  primaryScenario,
  primaryMetrics,
  solutions,
  location,
}: DossierContentProps) {
  const surplusKg = Number(primaryMetrics.metrics.daily_total_surplus_kg?.value ?? 0);
  const recoveredKg = Number(primaryMetrics.metrics.actual_recovered_food_kg?.value ?? 0);
  const mealsCount = Number(primaryMetrics.metrics.meals_provided_daily?.value ?? 0);
  const fleetSaturation = Number(primaryMetrics.metrics.fleet_utilization_pct?.value ?? 0);
  const activeVehicles = Number(primaryMetrics.resolvedInputs.active_vehicles?.value ?? 3);

  return (
    <div className="space-y-8 font-sans text-slate-900 leading-normal">
      {/* DOSSIER OFFICIAL HEADER */}
      <div className="border-b-2 border-slate-900 pb-5">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-[#123b5d]">
              CivicOS Municipal Intelligence &bull; Policy Dossier
            </span>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
              {problem.title}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-600">
              {location && (
                <span className="flex items-center gap-1 font-medium">
                  <MapPin size={13} /> {location}
                </span>
              )}
              <span>&bull;</span>
              <span>
                Status: <strong className="uppercase">{problem.status.replace("_", " ")}</strong>
              </span>
              <span>&bull;</span>
              <span>
                Export Date: <strong>{new Date().toLocaleDateString("en-US", { dateStyle: "long" })}</strong>
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="font-mono text-xs font-bold text-slate-400">
              DOC-ID: CIVIC-{problem.id.slice(0, 8).toUpperCase()}
            </span>
            <p className="text-[10px] uppercase font-bold text-emerald-700 mt-1">Verified Evaluation</p>
          </div>
        </div>
      </div>

      {/* SECTION 1: PROBLEM SCOPE */}
      <section className="space-y-3">
        <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
          1. Problem Scope & Background
        </h2>
        <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
          {problem.description}
        </p>

        {parsedAnalysis && (
          <div className="mt-4 rounded-lg bg-slate-50 border border-slate-200 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-slate-900">AI Problem Analysis Synthesis</span>
              <span className="rounded bg-indigo-100 px-2 py-0.5 text-[9px] font-bold text-indigo-800 uppercase">
                Provenance: AI Generated (Gemini)
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed italic">
              &ldquo;{parsedAnalysis.summary}&rdquo;
            </p>

            {/* Root Causes Grid */}
            <div className="grid gap-3 pt-2 sm:grid-cols-2">
              {parsedAnalysis.rootCauses?.slice(0, 4).map((rc, idx) => (
                <div key={idx} className="rounded bg-white p-2.5 border border-slate-200 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{rc.title}</span>
                    <span className="text-[9px] font-semibold text-slate-500 uppercase">{rc.category}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">{rc.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* SECTION 2: DETERMINISTIC SIMULATION TARGETS */}
      <section className="space-y-3">
        <div className="flex items-center justify-between border-b border-slate-200 pb-1">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-900">
            2. Verified Simulation Targets & Capacity Limits
          </h2>
          <span className="rounded bg-emerald-100 px-2 py-0.5 text-[9px] font-bold text-emerald-800 uppercase">
            Provenance: 100% Calculated
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 text-xs">
          <div className="rounded-lg border border-slate-200 p-3 bg-white">
            <span className="text-[10px] text-slate-500 font-semibold uppercase">Daily Food Surplus</span>
            <p className="mt-1 text-lg font-bold text-slate-900">{Math.round(surplusKg).toLocaleString()} kg/day</p>
            <p className="text-[10px] text-slate-400">Total unsold volume</p>
          </div>
          <div className="rounded-lg border border-slate-200 p-3 bg-white">
            <span className="text-[10px] text-slate-500 font-semibold uppercase">Recovered Food</span>
            <p className="mt-1 text-lg font-bold text-emerald-700">{Math.round(recoveredKg).toLocaleString()} kg/day</p>
            <p className="text-[10px] text-slate-400">Diverted from landfill</p>
          </div>
          <div className="rounded-lg border border-slate-200 p-3 bg-white">
            <span className="text-[10px] text-slate-500 font-semibold uppercase">Daily Meals Yield</span>
            <p className="mt-1 text-lg font-bold text-[#123b5d]">{Math.round(mealsCount).toLocaleString()} meals</p>
            <p className="text-[10px] text-slate-400">Community distribution</p>
          </div>
          <div className="rounded-lg border border-slate-200 p-3 bg-white">
            <span className="text-[10px] text-slate-500 font-semibold uppercase">Fleet Saturation</span>
            <p className="mt-1 text-lg font-bold text-slate-900">{Math.round(fleetSaturation)}%</p>
            <p className="text-[10px] text-slate-400">{activeVehicles} active vans</p>
          </div>
        </div>

        {primaryScenario && (
          <p className="text-[11px] text-slate-500">
            Reference Model: <strong>{primaryScenario.name}</strong> ({primaryScenario.is_baseline ? "Designated Baseline" : "Scenario Model"}). Evaluated deterministically with 0% AI hallucination.
          </p>
        )}
      </section>

      {/* SECTION 3: INTERVENTIONS & ACTION PLANS */}
      <section className="space-y-3">
        <div className="flex items-center justify-between border-b border-slate-200 pb-1">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-900">
            3. Intervention Action Plans & Operational Milestones
          </h2>
          <span className="text-[10px] text-slate-500 font-medium">
            {solutions.length} Plans Active
          </span>
        </div>

        {solutions.length === 0 ? (
          <p className="text-xs text-slate-500 italic">No formal interventions formulated yet.</p>
        ) : (
          <div className="space-y-4">
            {solutions.map((sol, sIdx) => {
              const solMilestones = (Array.isArray(sol.milestones) ? sol.milestones : []) as SolutionMilestone[];
              const completedCount = solMilestones.filter((m) => m.status === "completed").length;

              return (
                <div key={sol.id} className="rounded-lg border border-slate-200 p-4 bg-white space-y-3 text-xs">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-700">
                        {sol.status.replace("_", " ")}
                      </span>
                      <h4 className="mt-1 font-bold text-sm text-slate-900">
                        {sIdx + 1}. {sol.title}
                      </h4>
                      {sol.description && (
                        <p className="text-slate-600 text-xs mt-0.5">{sol.description}</p>
                      )}
                    </div>
                    <div className="text-right text-[11px] text-slate-500">
                      {sol.estimated_cost && <p>Budget: <strong>{sol.estimated_cost}</strong></p>}
                      {sol.target_timeline && <p>Timeline: <strong>{sol.target_timeline}</strong></p>}
                      <p className="font-semibold text-emerald-700">
                        {completedCount} / {solMilestones.length} Phases Complete
                      </p>
                    </div>
                  </div>

                  {/* Phased Roadmap Table */}
                  {solMilestones.length > 0 && (
                    <div className="border-t border-slate-100 pt-2">
                      <table className="w-full text-left text-[11px]">
                        <thead>
                          <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                            <th className="pb-1">Phase</th>
                            <th className="pb-1">Accountable Entity</th>
                            <th className="pb-1">Duration</th>
                            <th className="pb-1 text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {solMilestones.map((m, mIdx) => (
                            <tr key={m.id || mIdx}>
                              <td className="py-1 font-medium text-slate-900">{m.title}</td>
                              <td className="py-1 text-slate-600">{m.target_actor || "Operations Team"}</td>
                              <td className="py-1 text-slate-600">{m.duration || "TBD"}</td>
                              <td className="py-1 text-right font-bold uppercase text-[9px]">
                                {m.status === "completed" ? (
                                  <span className="text-emerald-700">Completed</span>
                                ) : m.status === "in_progress" ? (
                                  <span className="text-amber-700">In Progress</span>
                                ) : (
                                  <span className="text-slate-400">Pending</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* SECTION 4: FORMAL CERTIFICATION & AUDIT SIGNATURES */}
      <section className="pt-6 border-t-2 border-slate-900 space-y-4">
        <div className="rounded-lg bg-slate-50 p-4 border border-slate-200 text-[11px] text-slate-600 space-y-1">
          <p className="font-bold text-slate-900 uppercase">Provenance & Methodological Disclosure</p>
          <p className="leading-relaxed">
            This executive policy brief is generated by CivicOS. All numerical KPIs and capacity saturation metrics are 100% derived from deterministic TypeScript simulation contracts. Qualitative ecosystem analysis and roadmap phases are generated via Google Gemini under strict constraint boundaries. This document is intended as an operational decision-support dossier for municipal directors and community partners.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-8 pt-8 text-xs text-slate-700">
          <div className="space-y-8">
            <div className="border-b border-slate-400 pb-1">
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Prepared By</span>
              <span className="font-semibold text-slate-900">Lead Civic Operations Analyst</span>
            </div>
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>Signature: __________________________</span>
              <span>Date: ____________</span>
            </div>
          </div>

          <div className="space-y-8">
            <div className="border-b border-slate-400 pb-1">
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Approved for Implementation By</span>
              <span className="font-semibold text-slate-900">Authorized Municipal / NGO Executive</span>
            </div>
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>Signature: __________________________</span>
              <span>Date: ____________</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
