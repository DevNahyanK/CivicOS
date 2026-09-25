import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) { return <textarea className={cn("flex min-h-28 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-[#123b5d] focus:ring-2 focus:ring-[#123b5d]/15", className)} {...props} />; }
