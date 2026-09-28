import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Json, Scenario } from "@/types/database";

export async function getProblemScenarios(problemId: string): Promise<{
  scenarios: Scenario[];
  error: boolean;
}> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("scenarios")
      .select("*")
      .eq("problem_id", problemId)
      .order("is_baseline", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      return { scenarios: [], error: true };
    }
    return { scenarios: data ?? [], error: false };
  } catch {
    return { scenarios: [], error: true };
  }
}

export async function createScenario(params: {
  problemId: string;
  userId: string;
  name: string;
  description?: string | null;
  modelId: string;
  inputs: Json;
  results: Json;
  isBaseline?: boolean;
}): Promise<{ scenario: Scenario | null; error: boolean }> {
  try {
    const supabase = await createClient();

    // If marked as baseline, unset any existing baseline for this problem
    if (params.isBaseline) {
      await supabase
        .from("scenarios")
        .update({ is_baseline: false })
        .eq("problem_id", params.problemId)
        .eq("is_baseline", true);
    }

    const { data, error } = await supabase
      .from("scenarios")
      .insert({
        problem_id: params.problemId,
        user_id: params.userId,
        name: params.name,
        description: params.description ?? null,
        model_id: params.modelId,
        inputs: params.inputs,
        results: params.results,
        is_baseline: Boolean(params.isBaseline),
      })
      .select("*")
      .single();

    return { scenario: data, error: Boolean(error) };
  } catch {
    return { scenario: null, error: true };
  }
}

export async function deleteScenario(
  scenarioId: string,
  problemId: string
): Promise<{ error: boolean }> {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("scenarios")
      .delete()
      .eq("id", scenarioId)
      .eq("problem_id", problemId);

    return { error: Boolean(error) };
  } catch {
    return { error: true };
  }
}

export async function setBaselineScenario(
  scenarioId: string,
  problemId: string
): Promise<{ error: boolean }> {
  try {
    const supabase = await createClient();
    // Unset current baselines
    await supabase
      .from("scenarios")
      .update({ is_baseline: false })
      .eq("problem_id", problemId);

    // Set new baseline
    const { error } = await supabase
      .from("scenarios")
      .update({ is_baseline: true })
      .eq("id", scenarioId)
      .eq("problem_id", problemId);

    return { error: Boolean(error) };
  } catch {
    return { error: true };
  }
}
