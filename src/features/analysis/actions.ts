"use server";

import { revalidatePath } from "next/cache";
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
  buildProblemAnalyzerPrompt,
  PROBLEM_ANALYZER_PROMPT_VERSION,
  PROBLEM_ANALYZER_SYSTEM_INSTRUCTION,
} from "@/lib/ai/prompts/problem-analyzer";
import {
  problemAnalysisOutputSchema,
  reviewStatusSchema,
  type ReviewStatus,
} from "@/lib/validation/analysis";
import {
  createAiRun,
  saveProblemAnalysis,
  saveProblemInputs,
  updateAiRun,
  updateAnalysisReviewStatus,
} from "./repository";

export type AnalysisActionState = {
  error?: string;
  success?: boolean;
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

export async function analyzeProblemAction(
  problemId: string
): Promise<AnalysisActionState> {
  const parsedId = problemIdSchema.safeParse(problemId);
  if (!parsedId.success) {
    return { error: "Invalid problem identifier." };
  }

  const { supabase, userId } = await requireUser();

  const { problem, error: problemError } = await getOwnedProblem(parsedId.data);
  if (problemError || !problem) {
    return { error: "Problem not found or inaccessible." };
  }

  if (problem.owner_id !== userId) {
    return { error: "You are not authorized to analyze this problem." };
  }

  if (!isGeminiConfigured()) {
    return {
      error:
        "Gemini API key is not configured. Please set GEMINI_API_KEY in your environment variables (.env.local) to enable AI Problem Analysis.",
    };
  }

  const location = extractLocationLabel(problem.location_context);
  const requestPayload = {
    problemId: problem.id,
    title: problem.title,
    description: problem.description,
    location,
  };

  const { runId, error: runCreateError } = await createAiRun({
    problemId: problem.id,
    operation: "problem_analysis",
    model: DEFAULT_GEMINI_MODEL,
    promptVersion: PROBLEM_ANALYZER_PROMPT_VERSION,
    requestJson: requestPayload,
  });

  if (runCreateError || !runId) {
    return { error: "Failed to initialize AI analysis session in the workspace." };
  }

  await updateAiRun(runId, { status: "running" });

  try {
    const ai = getGeminiClient();
    const prompt = buildProblemAnalyzerPrompt({
      title: problem.title,
      description: problem.description,
      location,
    });

    const response = await ai.models.generateContent({
      model: DEFAULT_GEMINI_MODEL,
      contents: prompt,
      config: {
        systemInstruction: PROBLEM_ANALYZER_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
      },
    });

    const rawText = response.text || "";
    if (!rawText) {
      await updateAiRun(runId, {
        status: "failed",
        responseJson: { error: "Empty response from Gemini API" },
      });
      return { error: "Gemini returned an empty response. Please try again." };
    }

    const cleanedJson = cleanJsonString(rawText);
    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(cleanedJson);
    } catch {
      await updateAiRun(runId, {
        status: "failed",
        responseJson: { rawResponse: rawText, error: "JSON parse failure" },
      });
      return { error: "Failed to parse structured JSON from AI response." };
    }

    const validatedOutput = problemAnalysisOutputSchema.safeParse(parsedJson);
    if (!validatedOutput.success) {
      await updateAiRun(runId, {
        status: "failed",
        responseJson: {
          rawResponse: rawText,
          validationIssues: validatedOutput.error.issues.map((i) => i.message),
        },
      });
      return {
        error:
          validatedOutput.error.issues[0]?.message ||
          "AI output did not match the required analysis schema.",
      };
    }

    const analysisData = validatedOutput.data;
    const promptTokens = response.usageMetadata?.promptTokenCount ?? null;
    const candidatesTokens = response.usageMetadata?.candidatesTokenCount ?? null;

    await updateAiRun(runId, {
      status: "completed",
      responseJson: analysisData,
      inputTokens: promptTokens,
      outputTokens: candidatesTokens,
    });

    const { error: saveAnalysisError } = await saveProblemAnalysis({
      problemId: problem.id,
      aiRunId: runId,
      summary: analysisData.summary,
      structuredOutput: analysisData,
      reviewStatus: "draft",
    });

    if (saveAnalysisError) {
      return { error: "Analysis completed but could not be saved to workspace." };
    }

    // Persist discovered key items as problem inputs with provenance 'ai_suggestion'
    const inputsToSave = [
      ...analysisData.rootCauses.map((rc, idx) => ({
        problemId: problem.id,
        key: `root_cause_${idx + 1}`,
        valueJson: { title: rc.title, description: rc.description, category: rc.category },
        unit: null,
        sourceNote: "Extracted during AI Problem Analysis",
        provenance: "ai_suggestion" as const,
      })),
      ...analysisData.constraints.map((c, idx) => ({
        problemId: problem.id,
        key: `constraint_${idx + 1}`,
        valueJson: { category: c.category, description: c.description },
        unit: null,
        sourceNote: "Identified during AI Problem Analysis",
        provenance: "ai_suggestion" as const,
      })),
    ];

    await saveProblemInputs(inputsToSave);

    // If problem is currently draft, update it to in_analysis
    if (problem.status === "draft") {
      await supabase
        .from("problems")
        .update({ status: "in_analysis" })
        .eq("id", problem.id);
    }

    revalidatePath("/");
    revalidatePath("/problems");
    revalidatePath(`/problems/${problem.id}`);

    return { success: true };
  } catch (err: unknown) {
    const errorMessage =
      err instanceof Error ? err.message : "An unexpected error occurred during AI analysis.";

    await updateAiRun(runId, {
      status: "failed",
      responseJson: { error: errorMessage },
    });

    return { error: `AI Analysis failed: ${errorMessage}` };
  }
}

export async function updateAnalysisReviewStatusAction(
  problemId: string,
  analysisId: string,
  status: ReviewStatus
): Promise<AnalysisActionState> {
  const parsedProblemId = problemIdSchema.safeParse(problemId);
  const parsedStatus = reviewStatusSchema.safeParse(status);

  if (!parsedProblemId.success || !parsedStatus.success) {
    return { error: "Invalid parameters." };
  }

  const { userId } = await requireUser();
  const { problem, error: problemError } = await getOwnedProblem(parsedProblemId.data);

  if (problemError || !problem || problem.owner_id !== userId) {
    return { error: "Unauthorized access to problem analysis." };
  }

  const { error } = await updateAnalysisReviewStatus(analysisId, parsedStatus.data);
  if (error) {
    return { error: "Failed to update review status." };
  }

  revalidatePath(`/problems/${problemId}`);
  return { success: true };
}
