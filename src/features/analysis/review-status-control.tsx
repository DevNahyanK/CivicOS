"use client";

import { useState, useTransition } from "react";
import { Check, CheckCheck, Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ReviewStatus } from "@/lib/validation/analysis";
import { updateAnalysisReviewStatusAction } from "./actions";

interface ReviewStatusControlProps {
  problemId: string;
  analysisId: string;
  currentStatus: ReviewStatus;
}

export function ReviewStatusControl({
  problemId,
  analysisId,
  currentStatus,
}: ReviewStatusControlProps) {
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<ReviewStatus>(currentStatus);

  const handleUpdate = (newStatus: ReviewStatus) => {
    startTransition(async () => {
      const res = await updateAnalysisReviewStatusAction(problemId, analysisId, newStatus);
      if (res.success) {
        setStatus(newStatus);
      }
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium text-slate-500">Human Review:</span>
      {status !== "accepted" ? (
        <Button
          size="sm"
          variant="outline"
          disabled={isPending}
          onClick={() => handleUpdate("accepted")}
          className="h-8 border-emerald-300 text-emerald-800 hover:bg-emerald-50 hover:text-emerald-900"
        >
          {isPending ? <Loader2 size={13} className="animate-spin" /> : <CheckCheck size={14} />}
          <span>Accept Analysis</span>
        </Button>
      ) : null}

      {status !== "reviewed" && status !== "accepted" ? (
        <Button
          size="sm"
          variant="outline"
          disabled={isPending}
          onClick={() => handleUpdate("reviewed")}
          className="h-8 border-slate-300 text-slate-700 hover:bg-slate-50"
        >
          {isPending ? <Loader2 size={13} className="animate-spin" /> : <Check size={14} />}
          <span>Mark Reviewed</span>
        </Button>
      ) : null}

      {status !== "draft" ? (
        <Button
          size="sm"
          variant="ghost"
          disabled={isPending}
          onClick={() => handleUpdate("draft")}
          className="h-8 text-xs text-slate-500 hover:text-slate-800"
        >
          <RotateCcw size={12} />
          <span>Reset to Draft</span>
        </Button>
      ) : null}
    </div>
  );
}
