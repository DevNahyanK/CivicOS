import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { updateSession } from "@/lib/supabase/proxy";
const publicPaths = new Set(["/login", "/signup", "/auth/confirm"]);
export async function proxy(request: NextRequest) {
  if (!isSupabaseConfigured()) return new NextResponse("CivicOS requires Supabase configuration. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local.", { status: 503, headers: { "Cache-Control": "no-store" } });
  const { response, userId } = await updateSession(request);
  const { pathname } = request.nextUrl;
  const isPublic = publicPaths.has(pathname);
  if (!userId && !isPublic) { const url = request.nextUrl.clone(); url.pathname = "/login"; url.searchParams.set("redirectedFrom", pathname); return NextResponse.redirect(url); }
  if (userId && (pathname === "/login" || pathname === "/signup")) { const url = request.nextUrl.clone(); url.pathname = "/"; url.search = ""; return NextResponse.redirect(url); }
  return response;
}
export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"] };
