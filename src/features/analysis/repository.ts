import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { AiRun, Json, ProblemAnalysis, ProblemInput } from "@/types/database";
import type { ReviewStatus } from "@/lib/validation/analysis";

export async function getProblemAnalysis(problemId: string): Promise<{
  analysis: ProblemAnalysis | null;
  error: boolean;
}> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("problem_analyses")
    .select("*")
    .eq("problem_id", problemId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return { analysis: data, error: Boolean(error) };
}

export async function getProblemAiRuns(problemId: string): Promise<{
  runs: AiRun[];
  error: boolean;
}> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ai_runs")
    .select("*")
    .eq("problem_id", problemId)
    .order("created_at", { ascending: false });

  return { runs: data ?? [], error: Boolean(error) };
}

export async function createAiRun(params: {
  problemId: string;
  operation: string;
  model: string;
  promptVersion: string;
  requestJson: Json;
}): Promise<{ runId: string | null; error: boolean }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ai_runs")
    .insert({
      problem_id: params.problemId,
      operation: params.operation,
      model: params.model,
      prompt_version: params.promptVersion,
      request_json: params.requestJson,
      status: "pending",
    })
    .select("id")
    .single();

  return { runId: data?.id ?? null, error: Boolean(error) };
}

export async function updateAiRun(
  id: string,
  params: {
    status: "pending" | "running" | "completed" | "failed" | "cancelled";
    responseJson?: Json | null;
    inputTokens?: number | null;
    outputTokens?: number | null;
  }
): Promise<{ error: boolean }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("ai_runs")
    .update({
      status: params.status,
      response_json: params.responseJson,
      input_tokens: params.inputTokens ?? null,
      output_tokens: params.outputTokens ?? null,
    })
    .eq("id", id);

  return { error: Boolean(error) };
}

export async function saveProblemAnalysis(params: {
  problemId: string;
  aiRunId?: string | null;
  summary: string;
  structuredOutput: Json;
  reviewStatus?: ReviewStatus;
}): Promise<{ analysis: ProblemAnalysis | null; error: boolean }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("problem_analyses")
    .insert({
      problem_id: params.problemId,
      ai_run_id: params.aiRunId ?? null,
      summary: params.summary,
      structured_output: params.structuredOutput,
      review_status: params.reviewStatus ?? "draft",
    })
    .select("*")
    .single();

  return { analysis: data, error: Boolean(error) };
}

export async function updateAnalysisReviewStatus(
  analysisId: string,
  reviewStatus: ReviewStatus
): Promise<{ error: boolean }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("problem_analyses")
    .update({
      review_status: reviewStatus,
    })
    .eq("id", analysisId);

  return { error: Boolean(error) };
}

export async function saveProblemInputs(
  inputs: Array<{
    problemId: string;
    key: string;
    valueJson: Json;
    unit?: string | null;
    sourceNote?: string | null;
    provenance: "user_input" | "calculated" | "ai_suggestion" | "assumption";
  }>
): Promise<{ error: boolean }> {
  if (inputs.length === 0) return { error: false };
  const supabase = await createClient();
  const { error } = await supabase.from("problem_inputs").insert(
    inputs.map((inp) => ({
      problem_id: inp.problemId,
      key: inp.key,
      value_json: inp.valueJson,
      unit: inp.unit ?? null,
      source_note: inp.sourceNote ?? null,
      provenance: inp.provenance,
    }))
  );

  return { error: Boolean(error) };
}

export async function getProblemInputs(problemId: string): Promise<{
  inputs: ProblemInput[];
  error: boolean;
}> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("problem_inputs")
    .select("*")
    .eq("problem_id", problemId)
    .order("created_at", { ascending: true });

  return { inputs: data ?? [], error: Boolean(error) };
}
