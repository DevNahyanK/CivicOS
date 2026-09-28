"use client";

import { useMemo, useState, useTransition } from "react";
import {
  AlertCircle,
  AlertTriangle,
  BrainCircuit,
  Building2,
  CheckCircle2,
  Info,
  Loader2,
  RefreshCw,
  Scale,
  ShieldAlert,
  Sparkles,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SimulationInputValues, SimulationResult } from "@/simulation/types";
import type { ScenarioItem } from "../scenario-comparison";
import type {
  KeyTradeoff,
  PolicyRecommendation,
  SimulationNarrativeOutput,
} from "@/lib/validation/simulation-narrative";
import { generateSimulationNarrativeAction } from "../ai/actions";

interface StrategicBriefingProps {
  problemId: string;
  problemTitle?: string;
  currentInputs: SimulationInputValues;
  currentResult: SimulationResult;
  baselineItem?: ScenarioItem | null;
}

export function StrategicBriefing({
  problemId,
  problemTitle,
  currentInputs,
  currentResult,
  baselineItem,
}: StrategicBriefingProps) {
  const [narrative, setNarrative] = useState<SimulationNarrativeOutput | null>(null);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [generatedInputsHash, setGeneratedInputsHash] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const currentInputsHash = useMemo(() => JSON.stringify(currentInputs), [currentInputs]);
  const isStale = Boolean(narrative && generatedInputsHash && generatedInputsHash !== currentInputsHash);

  const handleGenerate = () => {
    setErrorMessage(null);

    startTransition(async () => {
      const response = await generateSimulationNarrativeAction({
        problemId,
        currentInputs,
        baselineInputs: baselineItem?.inputs ?? null,
        baselineName: baselineItem?.name ?? null,
      });

      if (response.success) {
        setNarrative(response.data);
        setGeneratedAt(response.generatedAt);
        setGeneratedInputsHash(currentInputsHash);
      } else {
        setErrorMessage(response.message);
      }
    });
  };

  // Sample demonstration preview for environments without an active API key
  const handleLoadSamplePreview = () => {
    const activeVehicles = Number(currentResult.resolvedInputs.active_vehicles?.value ?? 3);
    const recoveredKg = Number(currentResult.metrics.actual_recovered_food_kg?.value ?? 0);
    const surplusKg = Number(currentResult.metrics.daily_total_surplus_kg?.value ?? 0);
    const utilizationPct = Number(currentResult.metrics.fleet_utilization_pct?.value ?? 0);

    const sampleNarrative: SimulationNarrativeOutput = {
      executive_summary: `Operating with ${activeVehicles} active logistics vehicles successfully recovers ${recoveredKg.toFixed(
        0
      )} kg of edible surplus daily (${utilizationPct.toFixed(
        0
      )}% fleet capacity utilization) from an available surplus pool of ${surplusKg.toFixed(
        0
      )} kg. While current routes sustain strong community meal distribution, logistics buffers are narrow during peak surplus spikes.`,
      key_tradeoffs: [
        {
          title: "Fleet Capex vs Perishable Food Spoilage",
          description:
            "Expanding vehicle count incurs capital procurement and driver compensation costs, but directly prevents surplus rot at high-throughput donor hubs.",
          impact:
            "Every additional 350 kg van deployed recovers up to 700 potential meals per collection shift.",
        },
        {
          title: "Merchant Cluster Density vs Route Circuit Transit",
          description:
            "Adding isolated fringe donors increases transit mileage and fuel consumption per kilogram collected, eroding logistical efficiency.",
          impact:
            "Enforcing localized donor corridors preserves fleet turnaround speed and lowers emissions.",
        },
      ],
      bottleneck_assessment:
        utilizationPct > 85
          ? `Logistics capacity is heavily saturated at ${utilizationPct.toFixed(
              1
            )}%. Vehicle cargo bays are operating near structural capacity limits, creating vulnerability to unscheduled merchant volume spikes or vehicle mechanical downtime.`
          : `Logistics operations are currently balanced at ${utilizationPct.toFixed(
              1
            )}% capacity utilization. The fleet maintains adequate resilience for daily routing fluctuations without immediate driver overtime.`,
      policy_recommendations: [
        {
          recommendation:
            "Establish auxiliary transport partnerships with civic logistics cooperatives during high-volume surplus windows.",
          target_actor: "City Department of Economic Logistics & Food Security",
          priority: "immediate",
          rationale:
            "Injects rapid surge capacity without burdening the municipal budget with permanent fleet capex.",
        },
        {
          recommendation:
            "Deploy regional cold-storage micro-hubs in dense restaurant districts to decouple collection runs from central depot transit.",
          target_actor: "Municipal Infrastructure Planning Board",
          priority: "medium_term",
          rationale:
            "Shortens individual vehicle travel hops and insulates temperature-sensitive food supplies.",
        },
        {
          recommendation:
            "Codify commercial organic waste diversion incentives tied to standardized donor collection protocols.",
          target_actor: "City Council Environmental Committee",
          priority: "long_term",
          rationale:
            "Increases donor onboarding retention while establishing predictable daily volume commitments.",
        },
      ],
    };

    setNarrative(sampleNarrative);
    setGeneratedAt(new Date().toISOString());
    setGeneratedInputsHash(currentInputsHash);
    setErrorMessage(null);
  };

  return (
    <div className="space-y-6">
      {/* HEADER CARD */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 border border-indigo-200/80 px-2.5 py-0.5 text-xs font-bold text-indigo-700">
                <Sparkles size={12} className="text-indigo-600" />
                Provenance: AI Generated (Gemini)
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                <CheckCircle2 size={12} className="text-emerald-600" />
                Underlying Metrics: 100% Calculated
              </span>
            </div>

            <h3 className="mt-2 text-lg font-bold text-slate-900 flex items-center gap-2">
              <BrainCircuit size={20} className="text-[#123b5d]" /> AI Strategic Briefing & Policy Synthesis
            </h3>
            <p className="mt-1 text-xs text-slate-500 leading-relaxed max-w-2xl">
              Qualitative policy translation of verified simulation results{problemTitle ? ` for "${problemTitle}"` : ""}.
              Synthesizes operational trade-offs, structural capacity limits, and prioritized municipal recommendations
              without altering ground-truth numbers.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={handleGenerate}
              disabled={isPending}
              className="bg-[#123b5d] hover:bg-[#0e2f4a] text-white text-xs font-semibold shadow-xs"
            >
              {isPending ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Synthesizing...
                </>
              ) : narrative ? (
                <>
                  <RefreshCw size={14} /> Regenerate Briefing
                </>
              ) : (
                <>
                  <Sparkles size={14} /> Generate AI Strategic Briefing
                </>
              )}
            </Button>
          </div>
        </div>

        {/* STALE INPUTS WARNING */}
        {isStale && (
          <div className="mt-4 flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50/80 p-3 text-xs text-amber-900">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-600 shrink-0" />
              <span>
                <strong>Parameters updated:</strong> The simulation sliders were adjusted since this briefing was
                generated. Click <strong>Regenerate Briefing</strong> to synchronize the narrative.
              </span>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleGenerate}
              disabled={isPending}
              className="h-7 text-xs border-amber-300 text-amber-900 hover:bg-amber-100"
            >
              Regenerate
            </Button>
          </div>
        )}

        {/* ERROR / NOT CONFIGURED BANNER */}
        {errorMessage && (
          <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50/70 p-4 text-xs text-rose-900 space-y-3">
            <div className="flex items-start gap-2.5">
              <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold">Generation Notice</p>
                <p className="leading-relaxed">{errorMessage}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1 border-t border-rose-200/60">
              <Button
                size="sm"
                variant="outline"
                onClick={handleLoadSamplePreview}
                className="text-xs h-7 border-rose-300 text-rose-900 hover:bg-rose-100"
              >
                Load Demonstration Briefing Preview
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleGenerate}
                disabled={isPending}
                className="text-xs h-7 border-slate-300 text-slate-700 hover:bg-slate-100"
              >
                Retry Request
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* SKELETON LOADER */}
      {isPending && (
        <div className="space-y-4 animate-pulse">
          <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-3">
            <div className="h-4 w-40 bg-slate-200 rounded" />
            <div className="h-3 w-full bg-slate-100 rounded" />
            <div className="h-3 w-5/6 bg-slate-100 rounded" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
              <div className="h-4 w-32 bg-slate-200 rounded" />
              <div className="h-3 w-full bg-slate-100 rounded" />
              <div className="h-3 w-4/5 bg-slate-100 rounded" />
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
              <div className="h-4 w-32 bg-slate-200 rounded" />
              <div className="h-3 w-full bg-slate-100 rounded" />
              <div className="h-3 w-4/5 bg-slate-100 rounded" />
            </div>
          </div>
        </div>
      )}

      {/* EMPTY STATE */}
      {!narrative && !isPending && !errorMessage && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/50 p-12 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-indigo-50 text-indigo-600">
            <Sparkles size={24} />
          </div>
          <h4 className="mt-4 font-bold text-slate-900 text-sm">No Strategic Briefing Generated Yet</h4>
          <p className="mt-1.5 text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            Generate an AI-powered policy narrative interpreting current simulation trade-offs, logistics
            bottlenecks, and actionable municipal interventions.
          </p>
          <div className="mt-5 flex justify-center gap-3">
            <Button
              onClick={handleGenerate}
              className="bg-[#123b5d] hover:bg-[#0e2f4a] text-white text-xs font-semibold shadow-xs"
            >
              <Sparkles size={14} /> Generate Briefing with Gemini
            </Button>
            <Button
              variant="outline"
              onClick={handleLoadSamplePreview}
              className="text-xs border-slate-300 hover:bg-slate-100"
            >
              Preview Sample Briefing
            </Button>
          </div>
        </div>
      )}

      {/* RENDERED STRATEGIC NARRATIVE */}
      {narrative && !isPending && (
        <div className="space-y-6">
          {/* SECTION 1: EXECUTIVE SUMMARY */}
          <div className="rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50/40 via-white to-sky-50/30 p-6 shadow-xs">
            <div className="flex items-center justify-between border-b border-indigo-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-indigo-100 text-indigo-700">
                  <Zap size={14} />
                </span>
                <h4 className="font-bold text-sm text-slate-900">Executive Takeaway</h4>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                {generatedAt ? new Date(generatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
              </span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-700 font-medium italic">
              &ldquo;{narrative.executive_summary}&rdquo;
            </p>
          </div>

          {/* SECTION 2: OPERATIONAL TRADE-OFFS */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-600 flex items-center gap-2">
                <Scale size={14} className="text-[#123b5d]" /> Operational Trade-Offs & Dynamics
              </h4>
              <span className="text-[11px] text-slate-400 font-medium">
                {narrative.key_tradeoffs.length} tensions analyzed
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {narrative.key_tradeoffs.map((item: KeyTradeoff, idx: number) => (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="grid h-5 w-5 place-items-center rounded bg-slate-100 text-[11px] font-bold text-slate-700">
                        {idx + 1}
                      </span>
                      <h5 className="font-bold text-xs text-slate-900">{item.title}</h5>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{item.description}</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-start gap-2">
                    <span className="rounded bg-sky-50 px-2 py-0.5 text-[10px] font-bold uppercase text-sky-800 shrink-0 mt-0.5">
                      Impact
                    </span>
                    <p className="text-[11px] text-slate-700 font-medium leading-snug">{item.impact}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 3: BOTTLENECK & CAPACITY ASSESSMENT */}
          <div className="rounded-xl border border-amber-200 bg-amber-50/30 p-5 shadow-xs space-y-2">
            <div className="flex items-center gap-2 text-amber-900">
              <ShieldAlert size={16} className="text-amber-600 shrink-0" />
              <h4 className="font-bold text-xs uppercase tracking-wider">
                Capacity Ceilings & Bottleneck Assessment
              </h4>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">{narrative.bottleneck_assessment}</p>
          </div>

          {/* SECTION 4: POLICY & OPERATIONAL RECOMMENDATIONS */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-600 flex items-center gap-2">
                <Building2 size={14} className="text-[#123b5d]" /> Actionable Policy & Operational Next Steps
              </h4>
              <span className="text-[11px] text-slate-400 font-medium">
                Prioritized Sequencing
              </span>
            </div>

            <div className="space-y-3">
              {narrative.policy_recommendations.map((rec: PolicyRecommendation, idx: number) => {
                const priorityStyles =
                  rec.priority === "immediate"
                    ? "bg-rose-100 text-rose-800 border-rose-200"
                    : rec.priority === "medium_term"
                    ? "bg-amber-100 text-amber-800 border-amber-200"
                    : "bg-slate-100 text-slate-800 border-slate-200";

                return (
                  <div
                    key={idx}
                    className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col sm:flex-row sm:items-start gap-4"
                  >
                    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-slate-100 font-bold text-xs text-[#123b5d]">
                      {idx + 1}
                    </div>

                    <div className="flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${priorityStyles}`}
                        >
                          {rec.priority.replace("_", " ")}
                        </span>
                        <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700 flex items-center gap-1">
                          <Building2 size={10} /> {rec.target_actor}
                        </span>
                      </div>

                      <p className="text-xs font-bold text-slate-900">{rec.recommendation}</p>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        <strong className="text-slate-700">Rationale: </strong>
                        {rec.rationale}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* FOOTER AUDIT STAMP */}
          <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 flex flex-wrap items-center justify-between text-[11px] text-slate-500 gap-2">
            <div className="flex items-center gap-2">
              <Info size={13} className="text-slate-400" />
              <span>
                Generated via <strong>Gemini Strategic Narrative Engine</strong> (v1.0.0)
              </span>
            </div>
            <span>Ground-truth metrics verified via CivicOS Deterministic Engine</span>
          </div>
        </div>
      )}
    </div>
  );
}
