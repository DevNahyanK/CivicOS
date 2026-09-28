import { z } from "zod";

export const keyTradeoffSchema = z.object({
  title: z.string().trim().min(3, "Trade-off title must be at least 3 characters."),
  description: z.string().trim().min(10, "Trade-off description must be at least 10 characters."),
  impact: z.string().trim().min(5, "Trade-off impact must be at least 5 characters."),
});

export const priorityLevels = ["immediate", "medium_term", "long_term"] as const;
export type PriorityLevel = (typeof priorityLevels)[number];

export const policyRecommendationSchema = z.object({
  recommendation: z.string().trim().min(5, "Recommendation must be at least 5 characters."),
  target_actor: z.string().trim().min(2, "Target actor must be at least 2 characters."),
  priority: z.enum(priorityLevels).default("immediate"),
  rationale: z.string().trim().min(10, "Rationale must be at least 10 characters."),
});

export const simulationNarrativeOutputSchema = z.object({
  executive_summary: z.string().trim().min(20, "Executive summary must be at least 20 characters."),
  key_tradeoffs: z.array(keyTradeoffSchema).min(1, "At least one key trade-off is required."),
  bottleneck_assessment: z.string().trim().min(20, "Bottleneck assessment must be at least 20 characters."),
  policy_recommendations: z.array(policyRecommendationSchema).min(1, "At least one policy recommendation is required."),
});

export type KeyTradeoff = z.infer<typeof keyTradeoffSchema>;
export type PolicyRecommendation = z.infer<typeof policyRecommendationSchema>;
export type SimulationNarrativeOutput = z.infer<typeof simulationNarrativeOutputSchema>;
