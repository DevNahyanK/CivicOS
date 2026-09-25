"use server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
export type AuthActionState = { error?: string; success?: string };
const credentialsSchema = z.object({ email: z.string().trim().email("Enter a valid email address."), password: z.string().min(8, "Password must be at least 8 characters.").max(72, "Password must be 72 characters or fewer.") });
function credentials(formData: FormData) { return credentialsSchema.safeParse({ email: formData.get("email"), password: formData.get("password") }); }
export async function loginAction(_: AuthActionState, formData: FormData): Promise<AuthActionState> { const parsed = credentials(formData); if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check your email and password." }; const supabase = await createClient(); const { error } = await supabase.auth.signInWithPassword(parsed.data); if (error) return { error: "Unable to sign in with those credentials." }; const target = String(formData.get("redirectedFrom") ?? "/"); redirect(target.startsWith("/") && !target.startsWith("//") ? target : "/"); }
export async function signupAction(_: AuthActionState, formData: FormData): Promise<AuthActionState> { const parsed = credentials(formData); if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check your email and password." }; const origin = (await headers()).get("origin"); if (!origin) return { error: "Unable to determine this site address. Please try again." }; const supabase = await createClient(); const { data, error } = await supabase.auth.signUp({ email: parsed.data.email, password: parsed.data.password, options: { emailRedirectTo: `${origin}/auth/confirm` } }); if (error) return { error: "Unable to create your account. Please try again." }; if (data.session) redirect("/"); return { success: "Check your email to confirm your account, then return here to sign in." }; }
export async function logoutAction() { const supabase = await createClient(); await supabase.auth.signOut(); redirect("/login"); }
