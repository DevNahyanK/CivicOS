import { AuthForm } from "@/features/auth/auth-form";
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ redirectedFrom?: string }> }) { const { redirectedFrom } = await searchParams; return <AuthForm mode="login" redirectedFrom={redirectedFrom} />; }
