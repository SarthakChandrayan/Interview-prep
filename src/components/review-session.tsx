"use client";

import { ArrowUpRight, Eye, MessagesSquare, PartyPopper, Pencil } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { reviewItem } from "@/actions/items";
import type { PlainItem } from "@/lib/data";
import { GRADES, formatInterval, previewIntervals, type Grade } from "@/lib/srs";
import { Markdown } from "./markdown";
import { Button, ButtonLink, Card, DifficultyBadge, EmptyState, Kbd, KindBadge, cn } from "./ui";

const gradeMeta: Record<Grade, { label: string; className: string }> = {
  again: { label: "Again", className: "hover:border-danger hover:bg-danger-soft [&_.g]:text-danger" },
  hard: { label: "Hard", className: "hover:border-warning hover:bg-warning-soft [&_.g]:text-warning" },
  good: { label: "Good", className: "hover:border-success hover:bg-success-soft [&_.g]:text-success" },
  easy: { label: "Easy", className: "hover:border-info hover:bg-info-soft [&_.g]:text-info" },
};

const prompts: Record<PlainItem["kind"], string> = {
  problem: "How would you solve it? Talk through the approach, complexity and edge cases before revealing.",
  concept: "Explain it out loud as if an interviewer just asked.",
  behavioral: "Tell the story in STAR form, out loud, in under two minutes.",
};

export function ReviewSession({
  items,
  remaining,
  aiEnabled,
}: {
  items: PlainItem[];
  remaining: number;
  aiEnabled: boolean;
}) {
  // The server re-renders the queue after each grade, so the current card is
  // always the first item. `done` hides graded cards until that refresh lands.
  const [done, setDone] = useState<Set<string>>(new Set());
  const [reviewed, setReviewed] = useState(0);
  const [pending, startTransition] = useTransition();

  const current = items.find((i) => !done.has(i.id));

  function grade(g: Grade) {
    if (!current || pending) return;
    const id = current.id;
    setDone((s) => new Set(s).add(id));
    startTransition(async () => {
      try {
        await reviewItem(id, g);
        setReviewed((n) => n + 1);
      } catch {
        setDone((s) => {
          const next = new Set(s);
          next.delete(id);
          return next;
        });
        toast.error("Couldn't save that review", { description: "Check your connection and try again." });
      }
    });
  }

  if (!current) {
    return (
      <Card className="mx-auto max-w-3xl">
        <EmptyState
          icon={<PartyPopper />}
          title={reviewed > 0 ? `Session complete: ${reviewed} reviewed` : "Nothing due right now"}
          description="Come back tomorrow. Short daily sessions beat cramming."
        >
          <ButtonLink href="/" variant="secondary">
            Back to dashboard
          </ButtonLink>
          <ButtonLink href="/interview">
            <MessagesSquare />
            Try a mock interview
          </ButtonLink>
        </EmptyState>
      </Card>
    );
  }

  const left = Math.max(0, remaining - done.size);
  const sessionTotal = reviewed + left;
  const pct = sessionTotal ? (reviewed / sessionTotal) * 100 : 0;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center gap-4 text-sm text-muted">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-muted" aria-hidden>
          <div className="h-full rounded-full bg-accent transition-all duration-300" style={{ width: `${pct}%` }} />
        </div>
        <span className="tabular-nums" aria-live="polite">
          {reviewed} done · {left} left
        </span>
      </div>
      <ReviewCard key={current.id} item={current} onGrade={grade} disabled={pending} aiEnabled={aiEnabled} />
    </div>
  );
}

function ReviewCard({
  item,
  onGrade,
  disabled,
  aiEnabled,
}: {
  item: PlainItem;
  onGrade: (g: Grade) => void;
  disabled: boolean;
  aiEnabled: boolean;
}) {
  const [revealed, setRevealed] = useState(false);
  // Mirrors `revealed` synchronously, so a grade key pressed right after
  // revealing isn't lost while the listener re-renders.
  const revealedRef = useRef(false);
  const onGradeRef = useRef(onGrade);
  const intervals = previewIntervals(item.srs);

  useEffect(() => {
    onGradeRef.current = onGrade;
  });

  function reveal() {
    revealedRef.current = true;
    setRevealed(true);
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement;
      if (t.closest("input, textarea, select, [contenteditable]") || e.metaKey || e.ctrlKey || e.altKey) return;
      // Let Space/Enter activate a focused button or link normally.
      if ((e.key === " " || e.key === "Enter") && t.closest("button, a")) return;
      if (!revealedRef.current && (e.key === " " || e.key === "Enter")) {
        e.preventDefault();
        reveal();
      } else if (revealedRef.current && ["1", "2", "3", "4"].includes(e.key)) {
        onGradeRef.current(GRADES[Number(e.key) - 1]);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <Card className="animate-fade-in overflow-hidden">
      <div className="space-y-4 p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <KindBadge kind={item.kind} />
          <DifficultyBadge difficulty={item.difficulty} />
          <span className="text-sm text-muted">{item.topic}</span>
          <div className="ml-auto flex gap-1">
            {item.url && (
              <ButtonLink href={item.url} target="_blank" rel="noreferrer" variant="ghost" size="sm">
                Open link
                <ArrowUpRight />
              </ButtonLink>
            )}
            {aiEnabled && (
              <ButtonLink href={`/interview?item=${item.id}`} variant="ghost" size="sm">
                <MessagesSquare />
                Practise with AI
              </ButtonLink>
            )}
          </div>
        </div>
        <h2 className="text-balance text-2xl font-semibold tracking-tight sm:text-[28px]">{item.title}</h2>
        <p className="text-[15px] text-muted">{prompts[item.kind]}</p>
      </div>

      {revealed ? (
        <div className="animate-fade-in border-t border-border bg-surface-muted/40">
          <div className="p-6 sm:px-8">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-subtle">Your notes</p>
            {item.notes ? (
              <Markdown>{item.notes}</Markdown>
            ) : (
              <p className="text-sm text-muted">
                No notes yet.{" "}
                <Link href={`/items/${item.id}/edit`} className="inline-flex items-center gap-1 font-medium text-accent hover:underline">
                  <Pencil className="size-3.5" />
                  Add some
                </Link>{" "}
                so future reviews have an answer to check against.
              </p>
            )}
          </div>
          <div className="border-t border-border p-4 sm:px-8 sm:py-5">
            <p className="mb-3 text-center text-xs text-muted">How well did you remember it?</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {GRADES.map((g, i) => (
                <button
                  key={g}
                  onClick={() => onGrade(g)}
                  disabled={disabled}
                  className={cn(
                    "group rounded-xl border border-border bg-surface px-3 py-3 text-left transition-colors disabled:opacity-50",
                    gradeMeta[g].className,
                  )}
                >
                  <span className="flex items-center justify-between">
                    <span className="g text-sm font-semibold">{gradeMeta[g].label}</span>
                    <Kbd>{i + 1}</Kbd>
                  </span>
                  <span className="mt-0.5 block text-xs text-muted">
                    {intervals[g] === 1 ? "Tomorrow" : `In ${formatInterval(intervals[g])}`}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="border-t border-border p-4 sm:px-8 sm:py-5">
          <Button onClick={reveal} size="lg" className="w-full">
            <Eye />
            Reveal notes
            <Kbd>Space</Kbd>
          </Button>
        </div>
      )}
    </Card>
  );
}
