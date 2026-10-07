"use client";

import { Check, Loader2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { applyInterviewGrade } from "@/app/interview/actions";
import { GRADES, type Grade } from "@/lib/srs";
import { cn } from "../ui";

const labels: Record<Grade, string> = { again: "Again", hard: "Hard", good: "Good", easy: "Easy" };

export function ApplyGrade({
  interviewId,
  suggested,
  applied,
  hasItem,
}: {
  interviewId: string;
  suggested: Grade;
  applied: Grade | null;
  hasItem: boolean;
}) {
  const [selected, setSelected] = useState<Grade>(applied ?? suggested);
  const [done, setDone] = useState<Grade | null>(applied);
  const [pending, startTransition] = useTransition();

  if (!hasItem) {
    return <p className="text-sm text-muted">The library item for this interview was deleted.</p>;
  }

  if (done) {
    return (
      <p className="flex items-start gap-2 text-sm font-medium text-success">
        <Check className="mt-0.5 size-4 shrink-0" />
        Recorded as &ldquo;{labels[done]}&rdquo;. Your review schedule is updated.
      </p>
    );
  }

  function apply() {
    startTransition(async () => {
      const res = await applyInterviewGrade(interviewId, selected);
      if (res.error) toast.error(res.error);
      else {
        setDone(selected);
        toast.success("Review schedule updated");
      }
    });
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-4 gap-1.5 rounded-xl bg-surface-muted p-1" role="radiogroup" aria-label="Grade">
        {GRADES.map((g) => (
          <button
            key={g}
            type="button"
            role="radio"
            aria-checked={selected === g}
            onClick={() => setSelected(g)}
            className={cn(
              "relative rounded-lg py-2 text-sm font-medium text-muted transition-colors hover:text-foreground",
              selected === g && "bg-surface text-foreground shadow-sm",
            )}
          >
            {labels[g]}
            {g === suggested && (
              <span className="absolute -top-1.5 right-1 rounded-full bg-accent px-1.5 text-[10px] font-semibold text-accent-foreground">
                AI
              </span>
            )}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={apply}
        disabled={pending}
        className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-accent px-3.5 text-sm font-medium text-accent-foreground shadow-sm hover:bg-accent-hover disabled:opacity-50"
      >
        {pending && <Loader2 className="size-4 animate-spin" />}
        Update my review schedule
      </button>
    </div>
  );
}
