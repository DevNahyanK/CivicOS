"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { problemIdSchema } from "@/lib/validation/problem";
import { getOwnedProblem } from "@/features/problems/repository";
import type { Json, Scenario } from "@/types/database";
import { createScenario, deleteScenario, setBaselineScenario } from "./repository";

export type ScenarioActionState = {
  error?: string;
  success?: boolean;
  scenario?: Scenario;
};

async function requireUser() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;
  if (error || !userId) {
    redirect("/login");
  }
  return { supabase, userId };
}

const saveScenarioSchema = z.object({
  name: z.string().trim().min(1, "Scenario name is required.").max(120, "Name must be 120 characters or fewer."),
  description: z.string().trim().max(500, "Description must be 500 characters or fewer.").optional(),
  modelId: z.string().trim().min(1, "Model ID is required."),
  isBaseline: z.boolean().default(false),
});

export async function saveScenarioAction(params: {
  problemId: string;
  name: string;
  description?: string;
  modelId: string;
  inputs: Record<string, number | boolean>;
  results: Record<string, unknown>;
  isBaseline?: boolean;
}): Promise<ScenarioActionState> {
  const parsedProblemId = problemIdSchema.safeParse(params.problemId);
  const parsedMeta = saveScenarioSchema.safeParse({
    name: params.name,
    description: params.description,
    modelId: params.modelId,
    isBaseline: params.isBaseline ?? false,
  });

  if (!parsedProblemId.success) {
    return { error: "Invalid problem identifier." };
  }
  if (!parsedMeta.success) {
    return { error: parsedMeta.error.issues[0]?.message ?? "Invalid scenario parameters." };
  }

  const { userId } = await requireUser();
  const { problem, error: problemError } = await getOwnedProblem(parsedProblemId.data);

  if (problemError || !problem || problem.owner_id !== userId) {
    return { error: "You are not authorized to save scenarios for this problem." };
  }

  const { scenario, error } = await createScenario({
    problemId: parsedProblemId.data,
    userId,
    name: parsedMeta.data.name,
    description: parsedMeta.data.description,
    modelId: parsedMeta.data.modelId,
    inputs: params.inputs as unknown as Json,
    results: params.results as unknown as Json,
    isBaseline: parsedMeta.data.isBaseline,
  });

  if (error || !scenario) {
    return {
      error:
        "Unable to persist scenario to database. Local scenario state will remain active in your session.",
    };
  }

  revalidatePath(`/problems/${params.problemId}`);
  return { success: true, scenario };
}

export async function deleteScenarioAction(
  problemId: string,
  scenarioId: string
): Promise<ScenarioActionState> {
  const parsedProblemId = problemIdSchema.safeParse(problemId);
  if (!parsedProblemId.success || !scenarioId) {
    return { error: "Invalid parameters." };
  }

  const { userId } = await requireUser();
  const { problem, error: problemError } = await getOwnedProblem(parsedProblemId.data);

  if (problemError || !problem || problem.owner_id !== userId) {
    return { error: "Unauthorized." };
  }

  const { error } = await deleteScenario(scenarioId, parsedProblemId.data);
  if (error) {
    return { error: "Failed to delete scenario from database." };
  }

  revalidatePath(`/problems/${problemId}`);
  return { success: true };
}

export async function setBaselineScenarioAction(
  problemId: string,
  scenarioId: string
): Promise<ScenarioActionState> {
  const parsedProblemId = problemIdSchema.safeParse(problemId);
  if (!parsedProblemId.success || !scenarioId) {
    return { error: "Invalid parameters." };
  }

  const { userId } = await requireUser();
  const { problem, error: problemError } = await getOwnedProblem(parsedProblemId.data);

  if (problemError || !problem || problem.owner_id !== userId) {
    return { error: "Unauthorized." };
  }

  const { error } = await setBaselineScenario(scenarioId, parsedProblemId.data);
  if (error) {
    return { error: "Failed to set baseline scenario." };
  }

  revalidatePath(`/problems/${problemId}`);
  return { success: true };
}
