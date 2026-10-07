interface Props {
  days: { day: string; count: number }[];
}

function level(count: number) {
  if (count === 0) return "bg-zinc-100 dark:bg-zinc-800";
  if (count < 5) return "bg-indigo-200 dark:bg-indigo-900";
  if (count < 15) return "bg-indigo-400 dark:bg-indigo-700";
  return "bg-indigo-600 dark:bg-indigo-500";
}

/** GitHub-style grid: one column per week, one cell per day. */
export function ActivityHeatmap({ days }: Props) {
  const weeks: (typeof days)[] = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));

  return (
    <div className="flex gap-1 overflow-x-auto">
      {weeks.map((week) => (
        <div key={week[0].day} className="flex flex-col gap-1">
          {week.map((d) => (
            <div
              key={d.day}
              className={`h-3.5 w-3.5 rounded-sm ${level(d.count)}`}
              title={`${d.day}: ${d.count} review${d.count === 1 ? "" : "s"}`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
