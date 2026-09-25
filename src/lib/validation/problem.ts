import { z } from "zod";
export const problemStatuses = ["draft", "in_analysis", "ready_for_design", "archived"] as const;
export const problemSchema = z.object({ title: z.string().trim().min(3, "Use at least 3 characters for the title.").max(160, "Use 160 characters or fewer."), description: z.string().trim().min(10, "Describe the problem in at least 10 characters.").max(5000, "Use 5,000 characters or fewer."), status: z.enum(problemStatuses), location: z.string().trim().max(240, "Use 240 characters or fewer.").optional().or(z.literal("")) });
export const problemIdSchema = z.string().uuid("Invalid problem identifier.");
export type ProblemFormValues = z.infer<typeof problemSchema>;
export function locationToJson(location: string | undefined) { const label = location?.trim(); return label ? { label } : null; }
