"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { problemIdSchema } from "@/lib/validation/problem";
import { getOwnedProblem } from "@/features/problems/repository";
import { getProblemScenarios } from "@/features/scenarios/repository";
import {
  DEFAULT_GEMINI_MODEL,
  getGeminiClient,
  isGeminiConfigured,
} from "@/lib/ai/client";
import {
  buildSolutionRoadmapPrompt,
  SOLUTION_ROADMAP_PROMPT_VERSION,
  SOLUTION_ROADMAP_SYSTEM_INSTRUCTION,
} from "./prompts";
import {
  aiRoadmapDraftSchema,
  type AiRoadmapDraft,
} from "@/lib/validation/solution";
import { createAiRun, updateAiRun } from "@/features/analysis/repository";
import { SimulationEngine } from "@/simulation/core/engine";
import { foodRecoveryModelDefinition } from "@/simulation/models/food-recovery";
import type { SimulationInputValues } from "@/simulation/types";

export interface DraftRoadmapParams {
  problemId: string;
  scenarioId?: string | null;
}

export type DraftRoadmapActionResult =
  | {
      success: true;
      data: AiRoadmapDraft;
      generatedAt: string;
    }
  | {
      success: false;
      error: "NOT_CONFIGURED" | "UNAUTHORIZED" | "NOT_FOUND" | "EXECUTION_ERROR" | "PARSE_ERROR";
      message: string;
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

function extractLocationLabel(context: unknown): string | null {
  if (
    context &&
    typeof context === "object" &&
    !Array.isArray(context) &&
    "label" in context &&
    typeof (context as { label: unknown }).label === "string"
  ) {
    return (context as { label: string }).label;
  }
  return null;
}

function cleanJsonString(rawText: string): string {
  let cleaned = rawText.trim();
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.replace(/^```json\s*/i, "").replace(/\s*```$/, "");
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```\s*/, "").replace(/\s*```$/, "");
  }
  return cleaned.trim();
}

export async function draftOperationalRoadmapAction(
  params: DraftRoadmapParams
): Promise<DraftRoadmapActionResult> {
  const parsedId = problemIdSchema.safeParse(params.problemId);
  if (!parsedId.success) {
    return {
      success: false,
      error: "NOT_FOUND",
      message: "Invalid problem identifier.",
    };
  }

  const { userId } = await requireUser();

  const { problem, error: problemError } = await getOwnedProblem(parsedId.data);
  if (problemError || !problem) {
    return {
      success: false,
      error: "NOT_FOUND",
      message: "Problem not found or inaccessible.",
    };
  }

  if (problem.owner_id !== userId) {
    return {
      success: false,
      error: "UNAUTHORIZED",
      message: "You are not authorized to design interventions for this problem.",
    };
  }

  if (!isGeminiConfigured()) {
    return {
      success: false,
      error: "NOT_CONFIGURED",
      message:
        "Gemini API key is not configured. Please set GEMINI_API_KEY in your environment variables (.env.local) to enable AI Operational Roadmap drafting.",
    };
  }

  let scenarioContext: {
    name: string;
    description?: string | null;
    targetMetrics?: Record<string, { label: string; value: number | string; unit?: string }>;
    resolvedInputs?: Record<string, { label: string; value: number | string; unit?: string }>;
  } | null = null;

  if (params.scenarioId) {
    const { scenarios } = await getProblemScenarios(problem.id);
    const foundScenario = scenarios.find((s) => s.id === params.scenarioId);
    if (foundScenario) {
      const rawInputs = (typeof foundScenario.inputs === "object" && foundScenario.inputs !== null
        ? foundScenario.inputs
        : {}) as SimulationInputValues;

      // Deterministically run the simulation engine for ground-truth targets
      const simResult = SimulationEngine.run({
        model: foodRecoveryModelDefinition,
        inputs: rawInputs,
      });

      scenarioContext = {
        name: foundScenario.name,
        description: foundScenario.description,
        targetMetrics: {
          recovered: {
            label: "Daily Recovered Food",
            value: Math.round(Number(simResult.metrics.actual_recovered_food_kg?.value ?? 0)),
            unit: "kg/day",
          },
          meals: {
            label: "Daily Meals Provided",
            value: Math.round(Number(simResult.metrics.meals_provided_daily?.value ?? 0)),
            unit: "meals/day",
          },
          utilization: {
            label: "Fleet Capacity Saturation",
            value: Math.round(Number(simResult.metrics.fleet_utilization_pct?.value ?? 0)),
            unit: "%",
          },
        },
        resolvedInputs: {
          vehicles: {
            label: "Active Vehicles Required",
            value: Number(simResult.resolvedInputs.active_vehicles?.value ?? 3),
            unit: "vans",
          },
          restaurants: {
            label: "Enrolled Establishments",
            value: Number(simResult.resolvedInputs.participating_restaurants?.value ?? 60),
            unit: "donors",
          },
        },
      };
    }
  }

  const location = extractLocationLabel(problem.location_context);

  const { runId } = await createAiRun({
    problemId: problem.id,
    operation: "solution_roadmap",
    model: DEFAULT_GEMINI_MODEL,
    promptVersion: SOLUTION_ROADMAP_PROMPT_VERSION,
    requestJson: {
      problemId: problem.id,
      scenarioId: params.scenarioId ?? null,
      scenarioName: scenarioContext?.name ?? null,
    },
  });

  if (runId) {
    await updateAiRun(runId, { status: "running" });
  }

  try {
    const ai = getGeminiClient();
    const prompt = buildSolutionRoadmapPrompt({
      problem: {
        title: problem.title,
        description: problem.description,
        location,
      },
      scenario: scenarioContext,
    });

    const response = await ai.models.generateContent({
      model: DEFAULT_GEMINI_MODEL,
      contents: prompt,
      config: {
        systemInstruction: SOLUTION_ROADMAP_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
      },
    });

    const rawText = response.text || "";
    if (!rawText) {
      if (runId) {
        await updateAiRun(runId, {
          status: "failed",
          responseJson: { error: "Empty response from Gemini API" },
        });
      }
      return {
        success: false,
        error: "EXECUTION_ERROR",
        message: "Gemini returned an empty response. Please try again.",
      };
    }

    const cleanedJson = cleanJsonString(rawText);
    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(cleanedJson);
    } catch {
      if (runId) {
        await updateAiRun(runId, {
          status: "failed",
          responseJson: { rawResponse: rawText, error: "JSON parse failure" },
        });
      }
      return {
        success: false,
        error: "PARSE_ERROR",
        message: "Failed to parse structured JSON from AI roadmap response.",
      };
    }

    const validated = aiRoadmapDraftSchema.safeParse(parsedJson);
    if (!validated.success) {
      if (runId) {
        await updateAiRun(runId, {
          status: "failed",
          responseJson: {
            rawResponse: rawText,
            validationIssues: validated.error.issues.map((i) => i.message),
          },
        });
      }
      return {
        success: false,
        error: "PARSE_ERROR",
        message:
          validated.error.issues[0]?.message ||
          "AI roadmap output did not conform to the expected milestones schema.",
      };
    }

    if (runId) {
      await updateAiRun(runId, {
        status: "completed",
        responseJson: validated.data,
      });
    }

    return {
      success: true,
      data: validated.data,
      generatedAt: new Date().toISOString(),
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unexpected AI generation failure";
    if (runId) {
      await updateAiRun(runId, {
        status: "failed",
        responseJson: { error: errorMessage },
      });
    }

    return {
      success: false,
      error: "EXECUTION_ERROR",
      message: errorMessage,
    };
  }
}
