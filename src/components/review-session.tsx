"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { reviewItem } from "@/app/actions";
import type { PlainItem } from "@/lib/data";
import { GRADES, formatInterval, previewIntervals, type Grade } from "@/lib/srs";
import { Card, DifficultyLabel, KindBadge, buttonStyles } from "./ui";

const gradeStyles: Record<Grade, string> = {
  again: "border-rose-300 text-rose-700 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-400 dark:hover:bg-rose-950",
  hard: "border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-900 dark:text-amber-400 dark:hover:bg-amber-950",
  good: "border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-900 dark:text-emerald-400 dark:hover:bg-emerald-950",
  easy: "border-sky-300 text-sky-700 hover:bg-sky-50 dark:border-sky-900 dark:text-sky-400 dark:hover:bg-sky-950",
};

const prompts: Record<PlainItem["kind"], string> = {
  problem: "How would you solve it? Talk through the approach and complexity before revealing.",
  concept: "Explain it out loud as if the interviewer just asked.",
  behavioral: "Tell the story in STAR form, out loud, in under two minutes.",
};

export function ReviewSession({ items, remaining }: { items: PlainItem[]; remaining: number }) {
  // The server re-renders the queue after each grade, so the current card is
  // always the first item. `done` hides the graded card until the refresh lands.
  const [done, setDone] = useState<Set<string>>(new Set());
  const [reviewed, setReviewed] = useState(0);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const current = items.find((i) => !done.has(i.id));

  function grade(g: Grade) {
    if (!current || pending) return;
    const id = current.id;
    setError(null);
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
        setError("Couldn't save that review. Try again.");
      }
    });
  }

  if (!current) {
    return (
      <Card className="py-12 text-center">
        <p className="text-4xl">🎉</p>
        <h2 className="mt-3 text-lg font-semibold">
          {reviewed > 0 ? `Session done: ${reviewed} reviewed` : "Nothing due right now"}
        </h2>
        <p className="mt-1 text-sm text-zinc-500">Come back tomorrow. Consistency beats cramming.</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/" className={buttonStyles.secondary}>
            Dashboard
          </Link>
          <Link href="/items/new" className={buttonStyles.primary}>
            Add more items
          </Link>
        </div>
      </Card>
    );
  }

  const left = Math.max(0, remaining - done.size);

  return (
    <div className="space-y-3">
      <div className="flex justify-between text-sm text-zinc-500">
        <span>{left} due</span>
        <span>{reviewed} reviewed this session</span>
      </div>
      {error && <p className="text-sm text-rose-600">{error}</p>}
      <ReviewCard key={current.id} item={current} onGrade={grade} disabled={pending} />
    </div>
  );
}

function ReviewCard({
  item,
  onGrade,
  disabled,
}: {
  item: PlainItem;
  onGrade: (g: Grade) => void;
  disabled: boolean;
}) {
  const [revealed, setRevealed] = useState(false);
  const intervals = previewIntervals(item.srs);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (!revealed && (e.key === " " || e.key === "Enter")) {
        e.preventDefault();
        setRevealed(true);
      } else if (revealed && ["1", "2", "3", "4"].includes(e.key)) {
        onGrade(GRADES[Number(e.key) - 1]);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [revealed, onGrade]);

  return (
    <Card className="space-y-6 p-6 sm:p-8">
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <KindBadge kind={item.kind} />
          <span className="text-sm text-zinc-500">{item.topic}</span>
          <DifficultyLabel difficulty={item.difficulty} />
        </div>
        <h2 className="text-xl font-semibold sm:text-2xl">{item.title}</h2>
        {item.url && (
          <a href={item.url} target="_blank" rel="noreferrer" className="text-sm text-indigo-600 hover:underline dark:text-indigo-400">
            Open link ↗
          </a>
        )}
        <p className="text-sm text-zinc-500">{prompts[item.kind]}</p>
      </div>

      {revealed ? (
        <>
          <div className="rounded-lg bg-zinc-50 p-4 dark:bg-zinc-950">
            {item.notes ? (
              <p className="whitespace-pre-wrap font-mono text-sm leading-relaxed">{item.notes}</p>
            ) : (
              <p className="text-sm text-zinc-500">
                No notes yet.{" "}
                <Link href={`/items/${item.id}/edit`} className="text-indigo-600 hover:underline dark:text-indigo-400">
                  Add some
                </Link>{" "}
                so future reviews have an answer to check against.
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {GRADES.map((g, i) => (
              <button
                key={g}
                onClick={() => onGrade(g)}
                disabled={disabled}
                className={`rounded-lg border px-3 py-2.5 text-sm font-medium disabled:opacity-50 ${gradeStyles[g]}`}
              >
                <span className="capitalize">{g}</span>
                <span className="block text-xs font-normal opacity-75">
                  {formatInterval(intervals[g])} · {i + 1}
                </span>
              </button>
            ))}
          </div>
        </>
      ) : (
        <button onClick={() => setRevealed(true)} className={`${buttonStyles.primary} w-full py-3`}>
          Reveal notes <span className="opacity-75">(space)</span>
        </button>
      )}
    </Card>
  );
}
