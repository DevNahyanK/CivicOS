import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "@radix-ui/react-slot";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
const variants = cva("inline-flex items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123b5d] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50", { variants: { variant: { default: "bg-[#123b5d] text-white hover:bg-[#0d2e49]", outline: "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50", ghost: "text-slate-600 hover:bg-slate-100" }, size: { default: "h-10 px-4", sm: "h-8 px-3 text-xs", lg: "h-11 px-5" } }, defaultVariants: { variant: "default", size: "default" } });
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof variants> { asChild?: boolean }
export function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) { const Component = asChild ? Slot : "button"; return <Component className={cn(variants({ variant, size }), className)} {...props} />; }
