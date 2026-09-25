"use client";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteProblemAction } from "./actions";
export function DeleteProblemButton({ problemId }: { problemId: string }) { return <form action={deleteProblemAction} className="mt-4" onSubmit={(event) => { if (!window.confirm("Delete this problem from your workspace?")) event.preventDefault(); }}><input type="hidden" name="id" value={problemId} /><Button type="submit" variant="outline" className="border-red-200 text-red-700 hover:bg-red-50"><Trash2 size={16} /> Delete problem</Button></form>; }
