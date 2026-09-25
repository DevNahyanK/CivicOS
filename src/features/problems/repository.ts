import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Problem } from "@/types/database";
export async function getCurrentUserProblems(): Promise<{ problems: Problem[]; error: boolean }> { const supabase = await createClient(); const { data, error } = await supabase.from("problems").select("*").is("deleted_at", null).order("updated_at", { ascending: false }); return { problems: data ?? [], error: Boolean(error) }; }
export async function getOwnedProblem(problemId: string): Promise<{ problem: Problem | null; error: boolean }> { const supabase = await createClient(); const { data, error } = await supabase.from("problems").select("*").eq("id", problemId).is("deleted_at", null).maybeSingle(); return { problem: data, error: Boolean(error) }; }
