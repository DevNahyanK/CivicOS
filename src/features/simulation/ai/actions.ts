"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { problemIdSchema } from "@/lib/validation/problem";
import { getOwnedProblem } from "@/features/problems/repository";
import {
  DEFAULT_GEMINI_MODEL,
  getGeminiClient,
  isGeminiConfigured,
} from "@/lib/ai/client";
import {
  buildSimulationNarrativePrompt,
  SIMULATION_NARRATIVE_PROMPT_VERSION,
  SIMULATION_NARRATIVE_SYSTEM_INSTRUCTION,
} from "./prompts";
import {
  simulationNarrativeOutputSchema,
  type SimulationNarrativeOutput,
} from "@/lib/validation/simulation-narrative";
import { foodRecoveryModelDefinition } from "@/simulation/models/food-recovery";
import { SimulationEngine } from "@/simulation/core/engine";
import type { SimulationInputValues } from "@/simulation/types";
import { createAiRun, updateAiRun } from "@/features/analysis/repository";

export interface GenerateNarrativeParams {
  problemId: string;
  currentInputs: SimulationInputValues;
  baselineInputs?: SimulationInputValues | null;
  baselineName?: string | null;
}

export type NarrativeActionResult =
  | {
      success: true;
      data: SimulationNarrativeOutput;
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

export async function generateSimulationNarrativeAction(
  params: GenerateNarrativeParams
): Promise<NarrativeActionResult> {
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
      message: "You are not authorized to analyze simulations for this problem.",
    };
  }

  if (!isGeminiConfigured()) {
    return {
      success: false,
      error: "NOT_CONFIGURED",
      message:
        "Gemini API key is not configured. Please set GEMINI_API_KEY in your environment variables (.env.local) to enable AI Strategic Briefing generation.",
    };
  }

  // 100% Deterministic Engine Execution on the Server
  const currentResult = SimulationEngine.run({
    model: foodRecoveryModelDefinition,
    inputs: params.currentInputs,
  });

  const baselineResult = params.baselineInputs
    ? SimulationEngine.run({
        model: foodRecoveryModelDefinition,
        inputs: params.baselineInputs,
      })
    : null;

  const location = extractLocationLabel(problem.location_context);

  // Log AI Run for full provenance tracking
  const { runId } = await createAiRun({
    problemId: problem.id,
    operation: "simulation_narrative",
    model: DEFAULT_GEMINI_MODEL,
    promptVersion: SIMULATION_NARRATIVE_PROMPT_VERSION,
    requestJson: {
      problemId: problem.id,
      inputs: params.currentInputs,
      metricsSnapshot: {
        recovered_kg: currentResult.metrics.actual_recovered_food_kg?.value,
        surplus_kg: currentResult.metrics.daily_total_surplus_kg?.value,
        utilization_pct: currentResult.metrics.fleet_utilization_pct?.value,
      },
      baselineName: params.baselineName ?? null,
    },
  });

  if (runId) {
    await updateAiRun(runId, { status: "running" });
  }

  try {
    const ai = getGeminiClient();
    const prompt = buildSimulationNarrativePrompt({
      problem: {
        title: problem.title,
        description: problem.description,
        location,
      },
      currentResult,
      baselineResult,
      baselineName: params.baselineName,
    });

    const response = await ai.models.generateContent({
      model: DEFAULT_GEMINI_MODEL,
      contents: prompt,
      config: {
        systemInstruction: SIMULATION_NARRATIVE_SYSTEM_INSTRUCTION,
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
        message: "Failed to parse structured JSON from AI strategic briefing response.",
      };
    }

    const validatedOutput = simulationNarrativeOutputSchema.safeParse(parsedJson);
    if (!validatedOutput.success) {
      if (runId) {
        await updateAiRun(runId, {
          status: "failed",
          responseJson: {
            rawResponse: rawText,
            validationIssues: validatedOutput.error.issues.map((i) => i.message),
          },
        });
      }
      return {
        success: false,
        error: "PARSE_ERROR",
        message:
          validatedOutput.error.issues[0]?.message ||
          "AI narrative output did not conform to the expected strategic briefing schema.",
      };
    }

    if (runId) {
      await updateAiRun(runId, {
        status: "completed",
        responseJson: validatedOutput.data,
      });
    }

    return {
      success: true,
      data: validatedOutput.data,
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
