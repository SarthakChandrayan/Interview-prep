import type { ReactNode } from "react";
import type { Difficulty, Kind } from "@/lib/constants";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 ${className}`}
    >
      {children}
    </div>
  );
}

export function PageHeader({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      {children}
    </div>
  );
}

const kindStyles: Record<Kind, string> = {
  problem: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300",
  concept: "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300",
  behavioral: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
};

const difficultyStyles: Record<Difficulty, string> = {
  easy: "text-emerald-700 dark:text-emerald-400",
  medium: "text-amber-700 dark:text-amber-400",
  hard: "text-rose-700 dark:text-rose-400",
};

export function KindBadge({ kind }: { kind: Kind }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${kindStyles[kind]}`}>
      {kind}
    </span>
  );
}

export function DifficultyLabel({ difficulty }: { difficulty: Difficulty | null }) {
  if (!difficulty) return null;
  return <span className={`text-xs font-medium capitalize ${difficultyStyles[difficulty]}`}>{difficulty}</span>;
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-800 ${className}`} />;
}

export const buttonStyles = {
  primary:
    "rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50",
  secondary:
    "rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-800",
  danger:
    "rounded-md border border-rose-300 px-4 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-400 dark:hover:bg-rose-950",
};

export const inputStyles =
  "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-950";
