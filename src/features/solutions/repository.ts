import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Json, Solution, SolutionStatus } from "@/types/database";

// In-memory defensive fallback store for offline / unapplied migration resilience
const fallbackSolutionsStore = new Map<string, Solution[]>();

export async function getProblemSolutions(problemId: string): Promise<{
  solutions: Solution[];
  error: boolean;
  isFallback?: boolean;
}> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("solutions")
      .select("*")
      .eq("problem_id", problemId)
      .order("created_at", { ascending: false });

    if (error) {
      // Gracefully fall back to in-memory store
      const fallbacks = fallbackSolutionsStore.get(problemId) ?? [];
      return { solutions: fallbacks, error: false, isFallback: true };
    }

    return { solutions: data ?? [], error: false };
  } catch {
    const fallbacks = fallbackSolutionsStore.get(problemId) ?? [];
    return { solutions: fallbacks, error: false, isFallback: true };
  }
}

export async function getSolutionById(solutionId: string): Promise<{
  solution: Solution | null;
  error: boolean;
}> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("solutions")
      .select("*")
      .eq("id", solutionId)
      .maybeSingle();

    if (error || !data) {
      // Check in-memory stores
      for (const list of fallbackSolutionsStore.values()) {
        const found = list.find((s) => s.id === solutionId);
        if (found) return { solution: found, error: false };
      }
      return { solution: null, error: Boolean(error) };
    }

    return { solution: data, error: false };
  } catch {
    for (const list of fallbackSolutionsStore.values()) {
      const found = list.find((s) => s.id === solutionId);
      if (found) return { solution: found, error: false };
    }
    return { solution: null, error: true };
  }
}

export async function createSolution(params: {
  problemId: string;
  userId: string;
  scenarioId?: string | null;
  title: string;
  description?: string | null;
  status?: SolutionStatus;
  estimatedCost?: string | null;
  targetTimeline?: string | null;
  milestones: Json;
}): Promise<{ solution: Solution | null; error: boolean; isFallback?: boolean }> {
  const newSolution: Solution = {
    id: crypto.randomUUID(),
    problem_id: params.problemId,
    scenario_id: params.scenarioId ?? null,
    user_id: params.userId,
    title: params.title,
    description: params.description ?? null,
    status: params.status ?? "draft",
    estimated_cost: params.estimatedCost ?? null,
    target_timeline: params.targetTimeline ?? null,
    milestones: params.milestones,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("solutions")
      .insert({
        problem_id: params.problemId,
        scenario_id: params.scenarioId ?? null,
        user_id: params.userId,
        title: params.title,
        description: params.description ?? null,
        status: params.status ?? "draft",
        estimated_cost: params.estimatedCost ?? null,
        target_timeline: params.targetTimeline ?? null,
        milestones: params.milestones,
      })
      .select("*")
      .single();

    if (error || !data) {
      // Cache in fallback store
      const list = fallbackSolutionsStore.get(params.problemId) ?? [];
      fallbackSolutionsStore.set(params.problemId, [newSolution, ...list]);
      return { solution: newSolution, error: false, isFallback: true };
    }

    return { solution: data, error: false };
  } catch {
    const list = fallbackSolutionsStore.get(params.problemId) ?? [];
    fallbackSolutionsStore.set(params.problemId, [newSolution, ...list]);
    return { solution: newSolution, error: false, isFallback: true };
  }
}

export type SolutionUpdateInput = {
  scenario_id?: string | null;
  title?: string;
  description?: string | null;
  status?: SolutionStatus;
  estimated_cost?: string | null;
  target_timeline?: string | null;
  milestones?: Json;
};

export async function updateSolution(
  solutionId: string,
  problemId: string,
  updates: SolutionUpdateInput
): Promise<{ solution: Solution | null; error: boolean; isFallback?: boolean }> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("solutions")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", solutionId)
      .eq("problem_id", problemId)
      .select("*")
      .single();

    if (error || !data) {
      // Update in fallback store
      const list = fallbackSolutionsStore.get(problemId) ?? [];
      const index = list.findIndex((s) => s.id === solutionId);
      if (index >= 0) {
        const updated = {
          ...list[index],
          ...updates,
          updated_at: new Date().toISOString(),
        } as Solution;
        list[index] = updated;
        fallbackSolutionsStore.set(problemId, [...list]);
        return { solution: updated, error: false, isFallback: true };
      }
      return { solution: null, error: true };
    }

    return { solution: data, error: false };
  } catch {
    const list = fallbackSolutionsStore.get(problemId) ?? [];
    const index = list.findIndex((s) => s.id === solutionId);
    if (index >= 0) {
      const updated = {
        ...list[index],
        ...updates,
        updated_at: new Date().toISOString(),
      } as Solution;
      list[index] = updated;
      fallbackSolutionsStore.set(problemId, [...list]);
      return { solution: updated, error: false, isFallback: true };
    }
    return { solution: null, error: true };
  }
}

export async function deleteSolution(
  solutionId: string,
  problemId: string
): Promise<{ error: boolean }> {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("solutions")
      .delete()
      .eq("id", solutionId)
      .eq("problem_id", problemId);

    // Also remove from fallback store
    const list = fallbackSolutionsStore.get(problemId) ?? [];
    fallbackSolutionsStore.set(
      problemId,
      list.filter((s) => s.id !== solutionId)
    );

    return { error: Boolean(error) };
  } catch {
    const list = fallbackSolutionsStore.get(problemId) ?? [];
    fallbackSolutionsStore.set(
      problemId,
      list.filter((s) => s.id !== solutionId)
    );
    return { error: false };
  }
}
