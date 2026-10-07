import Link from "next/link";
import { Suspense } from "react";
import { importStarterPack } from "@/app/actions";
import { ActivityHeatmap } from "@/components/activity-heatmap";
import { Card, PageHeader, Skeleton, buttonStyles } from "@/components/ui";
import { getDashboard } from "@/lib/data";

export default function DashboardPage() {
  return (
    <>
      <PageHeader title="Dashboard" />
      <Suspense fallback={<DashboardSkeleton />}>
        <Dashboard />
      </Suspense>
    </>
  );
}

async function Dashboard() {
  const d = await getDashboard();

  if (d.totalItems === 0) {
    return (
      <Card className="py-12 text-center">
        <h2 className="text-lg font-semibold">Your deck is empty</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-zinc-500">
          Add problems you&apos;ve solved, concepts you need to know, and your behavioral stories. PrepDeck
          brings each one back just before you&apos;d forget it.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/items/new" className={buttonStyles.primary}>
            Add your first item
          </Link>
          <form action={importStarterPack}>
            <button className={buttonStyles.secondary}>Load the starter pack (20 items)</button>
          </form>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-4">
        <Card className="sm:col-span-2">
          <p className="text-sm text-zinc-500">Due for review</p>
          <p className="mt-1 text-4xl font-semibold tabular-nums">{d.dueNow}</p>
          {d.dueNow > 0 ? (
            <Link href="/review" className={`${buttonStyles.primary} mt-4 inline-block`}>
              Start review →
            </Link>
          ) : (
            <p className="mt-4 text-sm text-emerald-600 dark:text-emerald-400">All caught up. Nice.</p>
          )}
        </Card>
        <Stat label="Streak" value={d.streak} unit={d.streak === 1 ? "day" : "days"} />
        <Stat label="Reviewed today" value={d.reviewsToday} />
      </div>

      <Card>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="font-semibold">Activity</h2>
          <span className="text-xs text-zinc-500">last 12 weeks</span>
        </div>
        <ActivityHeatmap days={d.activity} />
      </Card>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <h2 className="font-semibold">Weakest topics</h2>
          <p className="mb-4 text-xs text-zinc-500">Lowest average ease first: these are the ones you keep forgetting.</p>
          <ul className="space-y-3">
            {d.topics.slice(0, 8).map((t) => (
              <li key={t.topic}>
                <div className="flex items-baseline justify-between text-sm">
                  <Link href={`/items?topic=${encodeURIComponent(t.topic)}`} className="font-medium hover:underline">
                    {t.topic}
                  </Link>
                  <span className="text-xs text-zinc-500">
                    {t.count} {t.count === 1 ? "item" : "items"} · {t.due} due · {t.lapses} {t.lapses === 1 ? "lapse" : "lapses"}
                  </span>
                </div>
                <EaseBar ease={t.avgEase} />
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <h2 className="mb-4 font-semibold">Library</h2>
          <dl className="space-y-2 text-sm">
            {(["problem", "concept", "behavioral"] as const).map((k) => (
              <div key={k} className="flex justify-between">
                <dt className="capitalize text-zinc-500">{k}s</dt>
                <dd className="tabular-nums">{d.byKind[k] ?? 0}</dd>
              </div>
            ))}
            <div className="flex justify-between border-t border-zinc-200 pt-2 font-medium dark:border-zinc-800">
              <dt>Total</dt>
              <dd className="tabular-nums">{d.totalItems}</dd>
            </div>
          </dl>
        </Card>
      </div>
    </div>
  );
}

function Stat({ label, value, unit }: { label: string; value: number; unit?: string }) {
  return (
    <Card>
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="mt-1 text-4xl font-semibold tabular-nums">
        {value}
        {unit && <span className="ml-1 text-base font-normal text-zinc-500">{unit}</span>}
      </p>
    </Card>
  );
}

// Ease runs from 1.3 (keeps being forgotten) to ~3 (easy); 2.5 is where new items start.
function EaseBar({ ease }: { ease: number }) {
  const pct = Math.min(100, Math.max(4, ((ease - 1.3) / (3 - 1.3)) * 100));
  const color = ease < 1.9 ? "bg-rose-500" : ease < 2.4 ? "bg-amber-500" : "bg-emerald-500";
  return (
    <div className="mt-1.5 h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800" title={`Average ease ${ease.toFixed(2)}`}>
      <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-4">
        <Skeleton className="h-40 sm:col-span-2" />
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
      </div>
      <Skeleton className="h-36" />
      <Skeleton className="h-64" />
    </div>
  );
}
