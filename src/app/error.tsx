"use client";
import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) { useEffect(() => { console.error(error); }, [error]); return <div className="grid min-h-[420px] place-items-center"><div className="max-w-md rounded-xl border border-slate-200 bg-white p-8 text-center"><AlertTriangle className="mx-auto text-amber-600" /><h1 className="mt-4 text-xl font-bold">Something went wrong</h1><p className="mt-2 text-sm leading-6 text-slate-600">The page could not be displayed. Please try again.</p><Button className="mt-5" onClick={reset}>Try again</Button></div></div>; }
