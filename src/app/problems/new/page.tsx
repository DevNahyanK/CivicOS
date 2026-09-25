import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { ProblemForm } from "@/features/problems/problem-form";
export default function CreateProblemPage() { return <div className="mx-auto max-w-3xl"><Link href="/problems" className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-900"><ChevronLeft size={16} /> Back to Problems</Link><div className="mb-7 mt-6"><p className="text-sm font-medium text-[#123b5d]">Problem creation</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Create a new problem</h1><p className="mt-2 text-slate-600">Start with a clear description. You can refine your problem details anytime.</p></div><ProblemForm /></div>; }
