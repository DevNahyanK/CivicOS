"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { problemIdSchema } from "@/lib/validation/problem";
import { getOwnedProblem } from "@/features/problems/repository";
import {
  createSolution,
  deleteSolution,
  getSolutionById,
  updateSolution,
} from "./repository";
import {
  createSolutionSchema,
  updateSolutionSchema,
  type CreateSolutionInput,
  type MilestoneStatus,
  type SolutionMilestone,
  type UpdateSolutionInput,
} from "@/lib/validation/solution";
import type { Solution } from "@/types/database";

export type SolutionActionState = {
  error?: string;
  success?: boolean;
  solution?: Solution | null;
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

export async function createSolutionAction(
  input: CreateSolutionInput
): Promise<SolutionActionState> {
  const validated = createSolutionSchema.safeParse(input);
  if (!validated.success) {
    return { error: validated.error.issues[0]?.message || "Invalid solution input." };
  }

  const { userId } = await requireUser();

  const { problem, error: problemError } = await getOwnedProblem(validated.data.problemId);
  if (problemError || !problem) {
    return { error: "Problem not found or inaccessible." };
  }

  if (problem.owner_id !== userId) {
    return { error: "You are not authorized to create solutions for this problem." };
  }

  const { solution, error } = await createSolution({
    problemId: validated.data.problemId,
    userId,
    scenarioId: validated.data.scenarioId ?? null,
    title: validated.data.title,
    description: validated.data.description ?? null,
    status: validated.data.status,
    estimatedCost: validated.data.estimatedCost ?? null,
    targetTimeline: validated.data.targetTimeline ?? null,
    milestones: validated.data.milestones,
  });

  if (error || !solution) {
    return { error: "Failed to persist solution." };
  }

  revalidatePath(`/problems/${validated.data.problemId}`);
  return { success: true, solution };
}

export async function updateSolutionAction(
  solutionId: string,
  problemId: string,
  input: UpdateSolutionInput
): Promise<SolutionActionState> {
  const validatedId = problemIdSchema.safeParse(problemId);
  if (!validatedId.success) {
    return { error: "Invalid problem identifier." };
  }

  const validated = updateSolutionSchema.safeParse(input);
  if (!validated.success) {
    return { error: validated.error.issues[0]?.message || "Invalid update input." };
  }

  const { userId } = await requireUser();

  const { problem, error: problemError } = await getOwnedProblem(validatedId.data);
  if (problemError || !problem || problem.owner_id !== userId) {
    return { error: "Unauthorized or problem not found." };
  }

  const { solution, error } = await updateSolution(solutionId, problemId, {
    ...(validated.data.scenarioId !== undefined ? { scenario_id: validated.data.scenarioId } : {}),
    ...(validated.data.title !== undefined ? { title: validated.data.title } : {}),
    ...(validated.data.description !== undefined ? { description: validated.data.description } : {}),
    ...(validated.data.status !== undefined ? { status: validated.data.status } : {}),
    ...(validated.data.estimatedCost !== undefined ? { estimated_cost: validated.data.estimatedCost } : {}),
    ...(validated.data.targetTimeline !== undefined ? { target_timeline: validated.data.targetTimeline } : {}),
    ...(validated.data.milestones !== undefined ? { milestones: validated.data.milestones } : {}),
  });

  if (error || !solution) {
    return { error: "Failed to update solution." };
  }

  revalidatePath(`/problems/${problemId}`);
  return { success: true, solution };
}

export async function deleteSolutionAction(
  solutionId: string,
  problemId: string
): Promise<SolutionActionState> {
  const validatedId = problemIdSchema.safeParse(problemId);
  if (!validatedId.success) {
    return { error: "Invalid problem identifier." };
  }

  const { userId } = await requireUser();

  const { problem, error: problemError } = await getOwnedProblem(validatedId.data);
  if (problemError || !problem || problem.owner_id !== userId) {
    return { error: "Unauthorized or problem not found." };
  }

  const { error } = await deleteSolution(solutionId, problemId);
  if (error) {
    return { error: "Failed to delete solution." };
  }

  revalidatePath(`/problems/${problemId}`);
  return { success: true };
}

export async function toggleMilestoneStatusAction(
  solutionId: string,
  problemId: string,
  milestoneId: string,
  nextStatus: MilestoneStatus
): Promise<SolutionActionState> {
  const { userId } = await requireUser();

  const { problem, error: problemError } = await getOwnedProblem(problemId);
  if (problemError || !problem || problem.owner_id !== userId) {
    return { error: "Unauthorized." };
  }

  const { solution: currentSolution } = await getSolutionById(solutionId);
  if (!currentSolution) {
    return { error: "Solution not found." };
  }

  const milestones = (Array.isArray(currentSolution.milestones)
    ? currentSolution.milestones
    : []) as SolutionMilestone[];

  const updatedMilestones = milestones.map((m) =>
    m.id === milestoneId ? { ...m, status: nextStatus } : m
  );

  const { solution, error } = await updateSolution(solutionId, problemId, {
    milestones: updatedMilestones,
  });

  if (error || !solution) {
    return { error: "Failed to update milestone status." };
  }

  revalidatePath(`/problems/${problemId}`);
  return { success: true, solution };
}
