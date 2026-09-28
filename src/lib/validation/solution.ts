import { z } from "zod";

export const solutionStatuses = [
  "draft",
  "planned",
  "in_progress",
  "implemented",
  "archived",
] as const;
export type SolutionStatus = (typeof solutionStatuses)[number];

export const milestoneStatuses = ["pending", "in_progress", "completed"] as const;
export type MilestoneStatus = (typeof milestoneStatuses)[number];

export const solutionMilestoneSchema = z.object({
  id: z.string().trim().min(1, "Milestone ID is required."),
  title: z.string().trim().min(3, "Milestone title must be at least 3 characters."),
  description: z.string().trim().optional(),
  duration: z.string().trim().optional(),
  target_completion: z.string().trim().optional(),
  target_actor: z.string().trim().optional(),
  status: z.enum(milestoneStatuses).default("pending"),
});

export const createSolutionSchema = z.object({
  problemId: z.string().uuid("Invalid problem identifier."),
  scenarioId: z.string().uuid("Invalid scenario identifier.").nullable().optional(),
  title: z
    .string()
    .trim()
    .min(3, "Solution title must be at least 3 characters.")
    .max(160, "Solution title must be at most 160 characters."),
  description: z.string().trim().optional(),
  status: z.enum(solutionStatuses).default("draft"),
  estimatedCost: z.string().trim().optional(),
  targetTimeline: z.string().trim().optional(),
  milestones: z.array(solutionMilestoneSchema).default([]),
});

export const updateSolutionSchema = z.object({
  scenarioId: z.string().uuid("Invalid scenario identifier.").nullable().optional(),
  title: z
    .string()
    .trim()
    .min(3, "Solution title must be at least 3 characters.")
    .max(160, "Solution title must be at most 160 characters.")
    .optional(),
  description: z.string().trim().optional(),
  status: z.enum(solutionStatuses).optional(),
  estimatedCost: z.string().trim().optional(),
  targetTimeline: z.string().trim().optional(),
  milestones: z.array(solutionMilestoneSchema).optional(),
});

export const aiRoadmapMilestoneDraftSchema = z.object({
  title: z.string().trim().min(3, "Milestone title must be at least 3 characters."),
  description: z.string().trim().min(10, "Milestone description must be at least 10 characters."),
  duration: z.string().trim().min(2, "Duration estimate is required."),
  target_actor: z.string().trim().min(2, "Responsible actor is required."),
  target_completion: z.string().trim().min(2, "Target completion timing is required."),
});

export const aiRoadmapDraftSchema = z.object({
  overview: z.string().trim().min(10, "Roadmap overview must be at least 10 characters."),
  milestones: z
    .array(aiRoadmapMilestoneDraftSchema)
    .min(3, "At least 3 milestone phases are required.")
    .max(6, "At most 6 milestone phases allowed."),
});

export type SolutionMilestone = z.infer<typeof solutionMilestoneSchema>;
export type CreateSolutionInput = z.infer<typeof createSolutionSchema>;
export type UpdateSolutionInput = z.infer<typeof updateSolutionSchema>;
export type AiRoadmapMilestoneDraft = z.infer<typeof aiRoadmapMilestoneDraftSchema>;
export type AiRoadmapDraft = z.infer<typeof aiRoadmapDraftSchema>;
