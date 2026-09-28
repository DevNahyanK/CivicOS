import { z } from "zod";

export const reviewStatuses = ["draft", "reviewed", "accepted", "rejected"] as const;
export type ReviewStatus = (typeof reviewStatuses)[number];

export const rootCauseSchema = z.object({
  title: z.string().trim().min(3, "Root cause title must be at least 3 characters."),
  description: z.string().trim().min(10, "Root cause description must be at least 10 characters."),
  category: z.string().trim().default("general"),
});

export const stakeholderSchema = z.object({
  group: z.string().trim().min(2, "Stakeholder group name is required."),
  role: z.string().trim().min(3, "Stakeholder role description is required."),
  impact: z.string().trim().min(5, "Stakeholder impact description is required."),
});

export const affectedPopulationSchema = z.object({
  group: z.string().trim().min(2, "Affected population group is required."),
  estimatedScale: z.string().trim().optional(),
  impactDescription: z.string().trim().min(5, "Impact description is required."),
});

export const constraintSchema = z.object({
  category: z.string().trim().min(2, "Constraint category is required."),
  description: z.string().trim().min(5, "Constraint description is required."),
});

export const problemAnalysisOutputSchema = z.object({
  summary: z.string().trim().min(20, "Summary must be at least 20 characters."),
  rootCauses: z.array(rootCauseSchema).min(1, "At least one root cause is required."),
  stakeholders: z.array(stakeholderSchema).min(1, "At least one stakeholder is required."),
  affectedPopulation: z.array(affectedPopulationSchema).min(1, "At least one affected group is required."),
  constraints: z.array(constraintSchema).default([]),
  keyAssumptions: z.array(z.string().trim()).default([]),
});

export type RootCause = z.infer<typeof rootCauseSchema>;
export type Stakeholder = z.infer<typeof stakeholderSchema>;
export type AffectedPopulation = z.infer<typeof affectedPopulationSchema>;
export type Constraint = z.infer<typeof constraintSchema>;
export type ProblemAnalysisOutput = z.infer<typeof problemAnalysisOutputSchema>;

export const reviewStatusSchema = z.enum(reviewStatuses);
