"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Plus, X } from "lucide-react";
import { useState } from "react";
import { navigation } from "@/config/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LogoutButton } from "./logout-button";

function NavLinks({ close }: { close?: () => void }) {
  const pathname = usePathname();
  return <nav aria-label="Main navigation" className="space-y-1">{navigation.map(({ label, href, icon: Icon }) => {
    const active = href === "/" ? pathname === href : pathname.startsWith(href);
    return <Link key={href} onClick={close} href={href} className={cn("flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors", active ? "bg-[#e9f0f5] text-[#123b5d]" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900")}><Icon size={18} aria-hidden="true" />{label}</Link>;
  })}</nav>;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  if (pathname === "/login" || pathname === "/signup") return <>{children}</>;
  return <div className="min-h-screen bg-slate-50">
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-200 bg-white lg:flex"><div className="flex h-[72px] items-center gap-3 border-b border-slate-200 px-6"><div className="grid h-8 w-8 place-items-center rounded-lg bg-[#123b5d] text-sm font-bold text-white">C</div><span className="text-lg font-bold tracking-tight text-slate-900">CivicOS</span></div><div className="flex-1 px-3 py-6"><NavLinks /></div><div className="border-t border-slate-200 p-4"><LogoutButton /><p className="mt-4 text-xs font-medium uppercase tracking-wider text-slate-400">Phase 2</p><p className="mt-1 text-xs leading-5 text-slate-500">Secure workspace foundation</p></div></aside>
    {open && <div className="fixed inset-0 z-40 bg-slate-950/30 lg:hidden" onClick={() => setOpen(false)} aria-hidden="true" />}
    <aside className={cn("fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-white shadow-xl transition-transform lg:hidden", open ? "translate-x-0" : "-translate-x-full")} aria-label="Mobile navigation"><div className="flex h-[72px] items-center justify-between border-b px-5"><span className="text-lg font-bold">CivicOS</span><Button aria-label="Close navigation" variant="ghost" size="sm" onClick={() => setOpen(false)}><X size={18} /></Button></div><div className="flex-1 p-4"><NavLinks close={() => setOpen(false)} /></div><div className="border-t p-4"><LogoutButton /></div></aside>
    <div className="lg:pl-64"><header className="sticky top-0 z-20 flex h-[72px] items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8"><div className="flex items-center gap-3"><Button variant="ghost" size="sm" className="lg:hidden" aria-label="Open navigation" onClick={() => setOpen(true)}><Menu size={20} /></Button><div><p className="text-sm font-semibold text-slate-900">CivicOS Workspace</p><p className="hidden text-xs text-slate-500 sm:block">Plan, test, and evaluate civic interventions.</p></div></div><Button asChild size="sm"><Link href="/problems/new"><Plus size={16} /> <span className="hidden sm:inline">Create New Problem</span><span className="sm:hidden">Create</span></Link></Button></header><main className="mx-auto w-full max-w-7xl px-4 py-7 sm:px-6 lg:px-8">{children}</main></div>
  </div>;
}
