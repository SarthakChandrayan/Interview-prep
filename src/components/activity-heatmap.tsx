import { cn } from "./ui";

interface Props {
  days: { day: string; count: number }[];
}

function level(count: number) {
  if (count === 0) return "bg-surface-muted";
  if (count < 5) return "bg-accent/25";
  if (count < 15) return "bg-accent/55";
  return "bg-accent";
}

const fmt = new Intl.DateTimeFormat("en", { month: "short", day: "numeric", timeZone: "UTC" });

/** GitHub-style grid: one column per week, one cell per day (UTC). */
export function ActivityHeatmap({ days }: Props) {
  const weeks: (typeof days)[] = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));
  const total = days.reduce((n, d) => n + d.count, 0);
  const activeDays = days.filter((d) => d.count > 0).length;

  return (
    <div>
      {/* Right-aligned and clipped, so narrow screens show the most recent weeks. */}
      <div
        className="flex justify-end gap-[3px] overflow-hidden"
        role="img"
        aria-label={`${total} reviews over ${activeDays} active days in the past year`}
      >
        {weeks.map((week) => (
          <div key={week[0].day} className="flex shrink-0 flex-col gap-[3px]">
            {week.map((d) => (
              <div
                key={d.day}
                className={cn("size-[13px] rounded-[3px]", level(d.count))}
                title={`${fmt.format(new Date(`${d.day}T00:00:00Z`))}: ${d.count} review${d.count === 1 ? "" : "s"}`}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-subtle">
        <span>
          {total} reviews · {activeDays} active days
        </span>
        <span className="flex items-center gap-1">
          Less
          {[0, 1, 6, 20].map((c) => (
            <span key={c} className={cn("size-[11px] rounded-[2px]", level(c))} />
          ))}
          More
        </span>
      </div>
    </div>
  );
}
