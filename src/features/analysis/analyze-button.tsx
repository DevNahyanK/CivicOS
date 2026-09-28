"use client";

import { useState, useTransition } from "react";
import { AlertCircle, Loader2, RefreshCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { analyzeProblemAction } from "./actions";

interface AnalyzeButtonProps {
  problemId: string;
  isReanalyze?: boolean;
}

export function AnalyzeButton({ problemId, isReanalyze = false }: AnalyzeButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = () => {
    setError(null);
    startTransition(async () => {
      const result = await analyzeProblemAction(problemId);
      if (result.error) {
        setError(result.error);
      }
    });
  };

  return (
    <div className="space-y-3">
      <Button
        onClick={handleAnalyze}
        disabled={isPending}
        variant={isReanalyze ? "outline" : "default"}
        className={isReanalyze ? "border-[#123b5d]/30 text-[#123b5d] hover:bg-[#e9f0f5]" : "bg-[#123b5d] hover:bg-[#0d2e49] text-white shadow-sm"}
      >
        {isPending ? (
          <>
            <Loader2 size={16} className="animate-spin text-current" />
            <span>Analyzing with Gemini AI…</span>
          </>
        ) : isReanalyze ? (
          <>
            <RefreshCw size={15} />
            <span>Re-analyze Problem</span>
          </>
        ) : (
          <>
            <Sparkles size={16} />
            <span>Analyze Problem with AI</span>
          </>
        )}
      </Button>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3.5 text-sm text-red-800"
        >
          <AlertCircle size={17} className="mt-0.5 shrink-0 text-red-600" />
          <div className="space-y-1">
            <p className="font-medium">Analysis couldn&apos;t be completed</p>
            <p className="text-xs leading-5 text-red-700">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}
