import { cn } from "./ui";

export function scoreTone(score: number) {
  if (score >= 4) return "text-success";
  if (score >= 3) return "text-warning";
  return "text-danger";
}

export function ScoreBadge({ score }: { score: number }) {
  const bg = score >= 4 ? "bg-success-soft" : score >= 3 ? "bg-warning-soft" : "bg-danger-soft";
  return (
    <span className={cn("rounded-md px-1.5 py-0.5 text-xs font-semibold tabular-nums", bg, scoreTone(score))}>
      {score}/5
    </span>
  );
}

/** Circular score out of 5. */
export function ScoreRing({ score, size = 96 }: { score: number; size?: number }) {
  const r = 42;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} role="img" aria-label={`Score ${score} out of 5`}>
      <svg viewBox="0 0 100 100" className="size-full -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" strokeWidth="9" className="stroke-surface-muted" />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - score / 5)}
          className={cn("stroke-current transition-[stroke-dashoffset] duration-700", scoreTone(score))}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <span className="text-2xl font-semibold tabular-nums">
          {score}
          <span className="text-sm font-normal text-subtle">/5</span>
        </span>
      </div>
    </div>
  );
}
