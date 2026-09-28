"use client";

import { useId, useMemo, useState, useTransition } from "react";
import {
  AlertCircle,
  Briefcase,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  DollarSign,
  Layers,
  ListChecks,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
  TrendingUp,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Problem, Scenario, Solution } from "@/types/database";
import type {
  MilestoneStatus,
  SolutionMilestone,
  SolutionStatus,
} from "@/lib/validation/solution";
import {
  createSolutionAction,
  deleteSolutionAction,
  toggleMilestoneStatusAction,
} from "../actions";
import { draftOperationalRoadmapAction } from "../ai/actions";

interface SolutionDesignerProps {
  problem: Problem;
  scenarios: Scenario[];
  initialSolutions?: Solution[];
}

export function SolutionDesigner({
  problem,
  scenarios,
  initialSolutions = [],
}: SolutionDesignerProps) {
  const [solutions, setSolutions] = useState<Solution[]>(initialSolutions);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [estimatedCost, setEstimatedCost] = useState("");
  const [targetTimeline, setTargetTimeline] = useState("");
  const [status, setStatus] = useState<SolutionStatus>("planned");
  const [milestones, setMilestones] = useState<SolutionMilestone[]>([]);
  const [expandedSolutionId, setExpandedSolutionId] = useState<string | null>(
    initialSolutions[0]?.id ?? null
  );

  // AI Roadmap state
  const [isAiDrafting, setIsAiDrafting] = useState(false);
  const [aiDraftError, setAiDraftError] = useState<string | null>(null);
  const [aiRoadmapOverview, setAiRoadmapOverview] = useState<string | null>(null);

  // Form IDs
  const titleId = useId();
  const descId = useId();
  const costId = useId();
  const timelineId = useId();
  const scenarioSelectId = useId();

  // Async transitions
  const [isSaving, startSaveTransition] = useTransition();
  const [saveError, setSaveError] = useState<string | null>(null);

  // Target metrics for selected scenario
  const selectedScenario = useMemo(() => {
    return scenarios.find((s) => s.id === selectedScenarioId) ?? null;
  }, [scenarios, selectedScenarioId]);

  const scenarioMetrics = useMemo(() => {
    if (!selectedScenario || !selectedScenario.results || typeof selectedScenario.results !== "object") {
      return null;
    }
    const res = selectedScenario.results as {
      metrics?: Record<string, { value: number; unit?: string }>;
      resolvedInputs?: Record<string, { value: number; unit?: string }>;
    };
    return {
      recovered: res.metrics?.actual_recovered_food_kg?.value ?? 0,
      meals: res.metrics?.meals_provided_daily?.value ?? 0,
      vehicles: res.resolvedInputs?.active_vehicles?.value ?? 3,
      utilization: res.metrics?.fleet_utilization_pct?.value ?? 0,
    };
  }, [selectedScenario]);

  // Overall milestone statistics
  const stats = useMemo(() => {
    let totalMilestones = 0;
    let completedMilestones = 0;

    for (const sol of solutions) {
      const list = (Array.isArray(sol.milestones) ? sol.milestones : []) as SolutionMilestone[];
      totalMilestones += list.length;
      completedMilestones += list.filter((m) => m.status === "completed").length;
    }

    return {
      totalSolutions: solutions.length,
      totalMilestones,
      completedMilestones,
      completionRate:
        totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0,
    };
  }, [solutions]);

  // AI Roadmap generation handler
  const handleDraftRoadmapWithAi = async () => {
    setIsAiDrafting(true);
    setAiDraftError(null);

    const response = await draftOperationalRoadmapAction({
      problemId: problem.id,
      scenarioId: selectedScenarioId || null,
    });

    if (response.success) {
      setAiRoadmapOverview(response.data.overview);
      const generatedMilestones: SolutionMilestone[] = response.data.milestones.map((m, idx) => ({
        id: `ms-${Date.now()}-${idx}`,
        title: m.title,
        description: m.description,
        duration: m.duration,
        target_actor: m.target_actor,
        target_completion: m.target_completion,
        status: "pending",
      }));
      setMilestones(generatedMilestones);
      setIsAiDrafting(false);
    } else {
      setAiDraftError(response.message);
      setIsAiDrafting(false);
    }
  };

  // Demonstration preview fallback
  const handleLoadSampleRoadmap = () => {
    setAiRoadmapOverview(
      "A 3-phase municipal logistics rollout to deploy additional transport capacity and enforce localized merchant pickup agreements."
    );
    setMilestones([
      {
        id: `ms-${Date.now()}-1`,
        title: "Phase 1: Commercial Donor Onboarding & Service Level Agreements",
        description: "Enrol 25 target restaurants and bakeries with standardized cold-chain collection protocols.",
        duration: "Weeks 1-4",
        target_actor: "Business Improvement District",
        target_completion: "Month 1",
        status: "pending",
      },
      {
        id: `ms-${Date.now()}-2`,
        title: "Phase 2: Auxiliary Fleet Procurement & Route Calibration",
        description: "Acquire secondary refrigerated vehicle and calibrate driver collection corridors.",
        duration: "Weeks 5-8",
        target_actor: "City Department of Logistics",
        target_completion: "Month 2",
        status: "pending",
      },
      {
        id: `ms-${Date.now()}-3`,
        title: "Phase 3: Central Food Hub Redistribution Operations",
        description: "Commence scheduled daily deliveries to community dining centers and food pantries.",
        duration: "Weeks 9-12",
        target_actor: "Food Bank Alliance",
        target_completion: "Month 3",
        status: "pending",
      },
    ]);
    setAiDraftError(null);
  };

  // Add manual milestone
  const handleAddManualMilestone = () => {
    setMilestones((prev) => [
      ...prev,
      {
        id: `ms-${Date.now()}-${prev.length}`,
        title: `Operational Phase ${prev.length + 1}`,
        description: "Define actionable operational steps and deliverables.",
        duration: "2 weeks",
        target_actor: "Implementation Team",
        target_completion: "TBD",
        status: "pending",
      },
    ]);
  };

  // Update a milestone in the draft form
  const handleUpdateDraftMilestone = (
    id: string,
    field: keyof SolutionMilestone,
    val: string
  ) => {
    setMilestones((prev) =>
      prev.map((m) => (m.id === id ? { ...m, [field]: val } : m))
    );
  };

  // Remove a milestone in the draft form
  const handleRemoveDraftMilestone = (id: string) => {
    setMilestones((prev) => prev.filter((m) => m.id !== id));
  };

  // Submit new solution
  const handleSaveSolution = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSaveError(null);
    startSaveTransition(async () => {
      const result = await createSolutionAction({
        problemId: problem.id,
        scenarioId: selectedScenarioId || null,
        title: title.trim(),
        description: description.trim() || undefined,
        status,
        estimatedCost: estimatedCost.trim() || undefined,
        targetTimeline: targetTimeline.trim() || undefined,
        milestones,
      });

      if (result.success && result.solution) {
        setSolutions((prev) => [result.solution!, ...prev]);
        setIsCreateOpen(false);
        // Reset form
        setTitle("");
        setDescription("");
        setEstimatedCost("");
        setTargetTimeline("");
        setSelectedScenarioId("");
        setMilestones([]);
        setAiRoadmapOverview(null);
      } else {
        setSaveError(result.error || "Failed to save solution.");
      }
    });
  };

  // Delete solution
  const handleDeleteSolution = async (solutionId: string) => {
    if (!confirm("Are you sure you want to delete this intervention action plan?")) return;
    const res = await deleteSolutionAction(solutionId, problem.id);
    if (res.success) {
      setSolutions((prev) => prev.filter((s) => s.id !== solutionId));
    }
  };

  // Toggle milestone status
  const handleToggleMilestone = async (
    solutionId: string,
    milestoneId: string,
    currentStatus: MilestoneStatus
  ) => {
    const nextStatus: MilestoneStatus =
      currentStatus === "pending"
        ? "in_progress"
        : currentStatus === "in_progress"
        ? "completed"
        : "pending";

    // Optimistic UI update
    setSolutions((prev) =>
      prev.map((sol) => {
        if (sol.id !== solutionId) return sol;
        const list = (Array.isArray(sol.milestones) ? sol.milestones : []) as SolutionMilestone[];
        return {
          ...sol,
          milestones: list.map((m) => (m.id === milestoneId ? { ...m, status: nextStatus } : m)),
        };
      })
    );

    await toggleMilestoneStatusAction(solutionId, problem.id, milestoneId, nextStatus);
  };

  return (
    <div className="space-y-6">
      {/* HEADER CARD */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                <CheckCircle2 size={12} className="text-emerald-600" />
                Impact Targets: 100% Calculated
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 border border-indigo-200/80 px-2.5 py-0.5 text-xs font-bold text-indigo-700">
                <Sparkles size={12} className="text-indigo-600" />
                Roadmap Assistant: AI Generated (Gemini)
              </span>
            </div>

            <h3 className="mt-2 text-lg font-bold text-slate-900 flex items-center gap-2">
              <Briefcase size={20} className="text-[#123b5d]" /> Solution Designer & Action Plans
            </h3>
            <p className="mt-1 text-xs text-slate-500 leading-relaxed max-w-2xl">
              Turn simulated policy options into funded municipal interventions. Bind solutions to verified
              simulation targets, track operational milestones, and draft phased roadmaps.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => setIsCreateOpen(true)}
              className="bg-[#123b5d] hover:bg-[#0e2f4a] text-white text-xs font-semibold shadow-xs"
            >
              <Plus size={14} /> Design New Solution
            </Button>
          </div>
        </div>

        {/* SUMMARY STATS BAR */}
        <div className="mt-6 grid grid-cols-2 gap-4 border-t border-slate-100 pt-5 sm:grid-cols-4">
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-[11px] font-semibold text-slate-500">Active Solutions</p>
            <p className="mt-1 text-xl font-bold text-slate-900">{stats.totalSolutions}</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-[11px] font-semibold text-slate-500">Total Milestones</p>
            <p className="mt-1 text-xl font-bold text-slate-900">{stats.totalMilestones}</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-[11px] font-semibold text-slate-500">Completed Phases</p>
            <p className="mt-1 text-xl font-bold text-emerald-700">
              {stats.completedMilestones} / {stats.totalMilestones}
            </p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-[11px] font-semibold text-slate-500">Roadmap Progress</p>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-xl font-bold text-[#123b5d]">{stats.completionRate}%</span>
              <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                <div
                  className="h-full bg-emerald-600 transition-all duration-300"
                  style={{ width: `${stats.completionRate}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CREATE SOLUTION MODAL / FORM */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-xl my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Design Civic Intervention Plan</h3>
                <p className="text-xs text-slate-500">
                  Formulate a structured action plan linked to verified simulation goals.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveSolution} className="mt-4 space-y-4">
              {/* Solution Title */}
              <div>
                <label htmlFor={titleId} className="text-xs font-semibold text-slate-800">
                  Intervention Title <span className="text-rose-500">*</span>
                </label>
                <Input
                  id={titleId}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. City Center Refrigerated Courier Fleet & Merchant Collective"
                  required
                  className="mt-1.5"
                />
              </div>

              {/* Description */}
              <div>
                <label htmlFor={descId} className="text-xs font-semibold text-slate-800">
                  Objective & Strategic Rationale
                </label>
                <textarea
                  id={descId}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="Describe the operational strategy, policy mechanism, and target communities..."
                  className="mt-1.5 w-full rounded-md border border-slate-300 px-3 py-2 text-xs focus:border-[#123b5d] focus:outline-none"
                />
              </div>

              {/* 2-column: Link to Simulation Scenario + Status */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor={scenarioSelectId} className="text-xs font-semibold text-slate-800">
                    Linked Simulation Scenario
                  </label>
                  <select
                    id={scenarioSelectId}
                    value={selectedScenarioId}
                    onChange={(e) => setSelectedScenarioId(e.target.value)}
                    className="mt-1.5 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs focus:border-[#123b5d] focus:outline-none"
                  >
                    <option value="">-- None (General Policy) --</option>
                    {scenarios.map((sc) => (
                      <option key={sc.id} value={sc.id}>
                        {sc.name} {sc.is_baseline ? "(Baseline)" : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-800">Implementation Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as SolutionStatus)}
                    className="mt-1.5 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs focus:border-[#123b5d] focus:outline-none"
                  >
                    <option value="draft">Draft Formulation</option>
                    <option value="planned">Planned & Approved</option>
                    <option value="in_progress">In Progress (Active)</option>
                    <option value="implemented">Implemented</option>
                  </select>
                </div>
              </div>

              {/* IMMUTABLE TARGETS FROM LINKED SCENARIO */}
              {selectedScenario && scenarioMetrics && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                      <TrendingUp size={14} className="text-emerald-700" /> Linked Scenario Targets
                    </span>
                    <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 uppercase">
                      Provenance: Calculated
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 text-xs">
                    <div className="bg-white/80 rounded p-2 border border-emerald-100">
                      <p className="text-[10px] text-slate-500">Target Recovery</p>
                      <p className="font-bold text-slate-900">{Math.round(scenarioMetrics.recovered)} kg/day</p>
                    </div>
                    <div className="bg-white/80 rounded p-2 border border-emerald-100">
                      <p className="text-[10px] text-slate-500">Meals Yield</p>
                      <p className="font-bold text-slate-900">{Math.round(scenarioMetrics.meals)} meals/day</p>
                    </div>
                    <div className="bg-white/80 rounded p-2 border border-emerald-100">
                      <p className="text-[10px] text-slate-500">Fleet Required</p>
                      <p className="font-bold text-slate-900">{scenarioMetrics.vehicles} vans</p>
                    </div>
                    <div className="bg-white/80 rounded p-2 border border-emerald-100">
                      <p className="text-[10px] text-slate-500">Fleet Load</p>
                      <p className="font-bold text-slate-900">{Math.round(scenarioMetrics.utilization)}%</p>
                    </div>
                  </div>
                </div>
              )}

              {/* 2-column: Estimated Budget + Timeline */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor={costId} className="text-xs font-semibold text-slate-800">
                    Estimated Budget / Capex
                  </label>
                  <Input
                    id={costId}
                    value={estimatedCost}
                    onChange={(e) => setEstimatedCost(e.target.value)}
                    placeholder="e.g. $42,000 / year"
                    className="mt-1.5"
                  />
                </div>

                <div>
                  <label htmlFor={timelineId} className="text-xs font-semibold text-slate-800">
                    Target Execution Horizon
                  </label>
                  <Input
                    id={timelineId}
                    value={targetTimeline}
                    onChange={(e) => setTargetTimeline(e.target.value)}
                    placeholder="e.g. 6 Months (Q3-Q4)"
                    className="mt-1.5"
                  />
                </div>
              </div>

              {/* MILESTONES & AI ASSISTANT SECTION */}
              <div className="border-t border-slate-100 pt-4 space-y-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <ListChecks size={14} className="text-[#123b5d]" /> Operational Milestones & Phasing
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Track sequenced deliverables, accountable departments, and rollout phases.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={handleDraftRoadmapWithAi}
                      disabled={isAiDrafting}
                      className="h-7 text-xs border-indigo-200 bg-indigo-50/50 text-indigo-900 hover:bg-indigo-100"
                    >
                      {isAiDrafting ? (
                        <>
                          <Loader2 size={12} className="animate-spin" /> Drafting...
                        </>
                      ) : (
                        <>
                          <Sparkles size={12} className="text-indigo-600" /> Draft with Gemini
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={handleAddManualMilestone}
                      className="h-7 text-xs border-slate-300 hover:bg-slate-100"
                    >
                      <Plus size={12} /> Add Phase
                    </Button>
                  </div>
                </div>

                {/* AI ERROR OR NOT CONFIGURED BANNER */}
                {aiDraftError && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 space-y-2">
                    <div className="flex items-start gap-2">
                      <AlertCircle size={14} className="text-amber-600 shrink-0 mt-0.5" />
                      <span>{aiDraftError}</span>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={handleLoadSampleRoadmap}
                      className="h-6 text-[11px] border-amber-300 text-amber-900 hover:bg-amber-100"
                    >
                      Load Demonstration Roadmap Preview
                    </Button>
                  </div>
                )}

                {/* AI ROADMAP OVERVIEW CALLOUT */}
                {aiRoadmapOverview && (
                  <div className="rounded-lg bg-indigo-50/60 border border-indigo-100 p-3 text-xs text-indigo-950">
                    <div className="flex items-center gap-1.5 font-bold mb-1">
                      <Sparkles size={12} className="text-indigo-600" /> AI Strategic Synthesis
                    </div>
                    <p className="leading-relaxed text-indigo-900">{aiRoadmapOverview}</p>
                  </div>
                )}

                {/* MILESTONES LIST IN FORM */}
                <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                  {milestones.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-slate-200 p-4 text-center text-xs text-slate-400">
                      No milestones added yet. Click <strong>Draft with Gemini</strong> or <strong>Add Phase</strong>.
                    </div>
                  ) : (
                    milestones.map((ms, idx) => (
                      <div
                        key={ms.id}
                        className="rounded-lg border border-slate-200 bg-slate-50/60 p-3 space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="grid h-5 w-5 place-items-center rounded bg-slate-200 text-[10px] font-bold text-slate-700">
                            {idx + 1}
                          </span>
                          <Input
                            value={ms.title}
                            onChange={(e) => handleUpdateDraftMilestone(ms.id, "title", e.target.value)}
                            placeholder="Milestone Title"
                            className="h-7 text-xs bg-white flex-1"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveDraftMilestone(ms.id)}
                            className="text-slate-400 hover:text-rose-600 p-1"
                            title="Remove milestone"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <Input
                            value={ms.duration ?? ""}
                            onChange={(e) => handleUpdateDraftMilestone(ms.id, "duration", e.target.value)}
                            placeholder="Duration (e.g. 3 weeks)"
                            className="h-6 text-[11px] bg-white"
                          />
                          <Input
                            value={ms.target_actor ?? ""}
                            onChange={(e) => handleUpdateDraftMilestone(ms.id, "target_actor", e.target.value)}
                            placeholder="Lead Department"
                            className="h-6 text-[11px] bg-white"
                          />
                          <Input
                            value={ms.target_completion ?? ""}
                            onChange={(e) => handleUpdateDraftMilestone(ms.id, "target_completion", e.target.value)}
                            placeholder="Completion (e.g. Month 1)"
                            className="h-6 text-[11px] bg-white"
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {saveError && (
                <p role="alert" className="text-xs font-semibold text-rose-600 bg-rose-50 p-2.5 rounded-lg border border-rose-200">
                  {saveError}
                </p>
              )}

              {/* ACTIONS */}
              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateOpen(false)}
                  disabled={isSaving}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="bg-[#123b5d] hover:bg-[#0e2f4a] text-white text-xs font-semibold"
                >
                  {isSaving ? (
                    <>
                      <Loader2 size={14} className="animate-spin" /> Saving Plan...
                    </>
                  ) : (
                    "Save Intervention Plan"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SOLUTIONS LIST */}
      {solutions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-xs">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-[#123b5d]">
            <Briefcase size={24} />
          </div>
          <h4 className="mt-4 font-bold text-slate-900 text-sm">No Action Plans Formulated Yet</h4>
          <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            Convert simulated scenarios into concrete intervention plans. Link targets, structure milestones,
            and organize operational roadmaps for city leadership.
          </p>
          <Button
            onClick={() => setIsCreateOpen(true)}
            className="mt-5 bg-[#123b5d] hover:bg-[#0e2f4a] text-white text-xs font-semibold shadow-xs"
          >
            <Plus size={14} /> Design First Intervention
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {solutions.map((sol) => {
            const isExpanded = expandedSolutionId === sol.id;
            const solMilestones = (Array.isArray(sol.milestones) ? sol.milestones : []) as SolutionMilestone[];
            const completedCount = solMilestones.filter((m) => m.status === "completed").length;
            const progressPct =
              solMilestones.length > 0 ? Math.round((completedCount / solMilestones.length) * 100) : 0;

            const linkedScenario = scenarios.find((s) => s.id === sol.scenario_id);
            const scenarioData = linkedScenario?.results as {
              metrics?: Record<string, { value: number; unit?: string }>;
            } | null;
            const targetRecovered = scenarioData?.metrics?.actual_recovered_food_kg?.value;
            const targetMeals = scenarioData?.metrics?.meals_provided_daily?.value;

            const statusColors: Record<SolutionStatus, string> = {
              draft: "bg-slate-100 text-slate-700 border-slate-200",
              planned: "bg-blue-100 text-blue-800 border-blue-200",
              in_progress: "bg-amber-100 text-amber-800 border-amber-200",
              implemented: "bg-emerald-100 text-emerald-800 border-emerald-200",
              archived: "bg-slate-200 text-slate-600 border-slate-300",
            };

            return (
              <div
                key={sol.id}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs transition-shadow hover:shadow-sm"
              >
                {/* CARD HEADER */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          statusColors[sol.status] ?? statusColors.draft
                        }`}
                      >
                        {sol.status.replace("_", " ")}
                      </span>

                      {linkedScenario && (
                        <span className="inline-flex items-center gap-1 rounded bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                          <Layers size={11} /> Linked Scenario: {linkedScenario.name}
                        </span>
                      )}

                      {targetRecovered !== undefined && (
                        <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                          <TrendingUp size={11} className="text-emerald-600" /> Target:{" "}
                          {Math.round(targetRecovered)} kg/day (
                          {targetMeals ? `${Math.round(targetMeals)} meals` : ""}
                          )
                        </span>
                      )}
                    </div>

                    <h4 className="font-bold text-base text-slate-900">{sol.title}</h4>
                    {sol.description && (
                      <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
                        {sol.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 self-start">
                    <button
                      type="button"
                      onClick={() => setExpandedSolutionId(isExpanded ? null : sol.id)}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      {isExpanded ? (
                        <>
                          Hide Phases <ChevronDown size={14} />
                        </>
                      ) : (
                        <>
                          View Roadmap ({solMilestones.length}) <ChevronRight size={14} />
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteSolution(sol.id)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                      title="Delete action plan"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* PROGRESS & METADATA BAR */}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-3 text-xs text-slate-500">
                  <div className="flex flex-wrap items-center gap-4">
                    {sol.estimated_cost && (
                      <span className="flex items-center gap-1 font-medium text-slate-700">
                        <DollarSign size={13} className="text-slate-400" />
                        {sol.estimated_cost}
                      </span>
                    )}
                    {sol.target_timeline && (
                      <span className="flex items-center gap-1 font-medium text-slate-700">
                        <Calendar size={13} className="text-slate-400" />
                        {sol.target_timeline}
                      </span>
                    )}
                    <span className="font-medium text-slate-700">
                      {completedCount} of {solMilestones.length} milestones completed
                    </span>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-48">
                    <span className="font-mono text-[11px] font-bold text-slate-700">{progressPct}%</span>
                    <div className="h-2 flex-1 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full bg-emerald-600 transition-all duration-300"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* EXPANDED MILESTONES ROADMAP */}
                {isExpanded && (
                  <div className="mt-4 rounded-xl bg-slate-50/70 border border-slate-200/80 p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                        <ListChecks size={14} className="text-[#123b5d]" /> Phased Execution Checklist
                      </span>
                      <span className="text-[11px] text-slate-400">Click icon to advance status</span>
                    </div>

                    {solMilestones.length === 0 ? (
                      <p className="text-xs text-slate-400 italic py-2">No operational phases defined.</p>
                    ) : (
                      <div className="space-y-2">
                        {solMilestones.map((m, idx) => {
                          const statusIcon =
                            m.status === "completed" ? (
                              <CheckCircle2 size={16} className="text-emerald-600" />
                            ) : m.status === "in_progress" ? (
                              <Clock size={16} className="text-amber-600" />
                            ) : (
                              <div className="h-4 w-4 rounded-full border-2 border-slate-300" />
                            );

                          return (
                            <div
                              key={m.id || idx}
                              className={`flex items-start gap-3 rounded-lg border bg-white p-3 text-xs transition-colors ${
                                m.status === "completed"
                                  ? "border-emerald-200 bg-emerald-50/20"
                                  : "border-slate-200"
                              }`}
                            >
                              <button
                                type="button"
                                onClick={() => handleToggleMilestone(sol.id, m.id, m.status)}
                                className="mt-0.5 shrink-0 hover:scale-110 transition-transform"
                                title={`Status: ${m.status}. Click to cycle.`}
                              >
                                {statusIcon}
                              </button>

                              <div className="flex-1 space-y-1">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <h5
                                    className={`font-bold ${
                                      m.status === "completed"
                                        ? "text-slate-500 line-through"
                                        : "text-slate-900"
                                    }`}
                                  >
                                    {m.title}
                                  </h5>

                                  <div className="flex items-center gap-2 text-[10px] text-slate-500">
                                    {m.target_actor && (
                                      <span className="rounded bg-slate-100 px-1.5 py-0.5 font-semibold text-slate-700 flex items-center gap-1">
                                        <Building2 size={10} /> {m.target_actor}
                                      </span>
                                    )}
                                    {m.duration && <span>Duration: {m.duration}</span>}
                                    {m.target_completion && (
                                      <span className="font-semibold text-slate-700">
                                        Target: {m.target_completion}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {m.description && (
                                  <p className="text-[11px] text-slate-600 leading-relaxed">
                                    {m.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
