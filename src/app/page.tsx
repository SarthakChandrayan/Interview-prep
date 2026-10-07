import { ArrowRight, BookMarked, Flame, Layers, MessagesSquare, Sparkles, Target, Upload } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { importStarterPack } from "@/app/actions";
import { ActivityHeatmap } from "@/components/activity-heatmap";
import { SubmitButton } from "@/components/submit-button";
import { ButtonLink, Card, CardHeader, EmptyState, PageHeader, Skeleton, cn } from "@/components/ui";
import { getDashboard } from "@/lib/data";

export default function DashboardPage() {
  return (
    <>
      <PageHeader title="Dashboard" description="Where your prep stands today." />
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
      <Card>
        <EmptyState
          icon={<Layers />}
          title="Build your deck"
          description="Add problems you've solved, concepts you need to explain, and your behavioral stories. PrepDeck brings each one back right before you'd forget it."
        >
          <ButtonLink href="/items/new">Add your first item</ButtonLink>
          <form action={importStarterPack}>
            <SubmitButton variant="secondary" pendingLabel="Loading…">
              <Upload />
              Load the starter pack
            </SubmitButton>
          </form>
        </EmptyState>
      </Card>
    );
  }

  const todayTotal = d.reviewsToday + d.dueNow;
  const progress = todayTotal === 0 ? 100 : Math.round((d.reviewsToday / todayTotal) * 100);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="relative overflow-hidden p-5 md:col-span-2">
          <div className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-accent/10 blur-2xl" />
          <p className="text-sm font-medium text-muted">Due for review</p>
          <div className="mt-2 flex items-end gap-3">
            <p className="text-5xl font-semibold tracking-tight tabular-nums">{d.dueNow}</p>
            <p className="pb-1.5 text-sm text-muted">{d.dueNow === 1 ? "card" : "cards"} waiting</p>
          </div>
          <div className="mt-5">
            <div className="flex justify-between text-xs text-muted">
              <span>Today&apos;s progress</span>
              <span className="tabular-nums">
                {d.reviewsToday}/{todayTotal}
              </span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-muted">
              <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {d.dueNow > 0 ? (
              <ButtonLink href="/review">
                Start review
                <ArrowRight />
              </ButtonLink>
            ) : (
              <p className="text-sm font-medium text-success">All caught up for today.</p>
            )}
            <ButtonLink href="/interview" variant="secondary">
              <MessagesSquare />
              Mock interview
            </ButtonLink>
          </div>
        </Card>

        <StatCard
          icon={<Flame />}
          tone="text-warning bg-warning-soft"
          label="Day streak"
          value={d.streak}
          hint={d.reviewsToday > 0 ? "Reviewed today" : d.streak > 0 ? "Review today to keep it going" : "Review today to start one"}
        />
        <StatCard
          icon={<Target />}
          tone="text-success bg-success-soft"
          label="Mock interviews"
          value={d.interviews.completed}
          hint={
            d.interviews.avgScore
              ? `Average score ${d.interviews.avgScore.toFixed(1)} / 5`
              : "Practise out loud with the AI interviewer"
          }
        />
      </div>

      <Card>
        <CardHeader title="Activity" description="Reviews per day over the past year" />
        <div className="px-5 pb-5 pt-4 sm:px-6">
          <ActivityHeatmap days={d.activity} />
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Weakest topics"
            description="Ranked by average ease: the topics you keep forgetting."
            action={
              <ButtonLink href="/interview" variant="ghost" size="sm">
                <Sparkles />
                Practise with AI
              </ButtonLink>
            }
          />
          <ul className="divide-y divide-border px-5 pb-2 pt-3 sm:px-6">
            {d.topics.slice(0, 7).map((t) => (
              <li key={t.topic} className="py-3">
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <Link
                    href={`/items?topic=${encodeURIComponent(t.topic)}`}
                    className="truncate font-medium hover:text-accent"
                  >
                    {t.topic}
                  </Link>
                  <span className="shrink-0 text-xs tabular-nums text-subtle">
                    {t.count} {t.count === 1 ? "item" : "items"} · {t.due} due · {t.lapses}{" "}
                    {t.lapses === 1 ? "lapse" : "lapses"}
                  </span>
                </div>
                <EaseBar ease={t.avgEase} />
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <CardHeader title="Library" action={<ButtonLink href="/items" variant="ghost" size="sm">View all</ButtonLink>} />
          <div className="px-5 pb-5 pt-4 sm:px-6">
            <p className="text-3xl font-semibold tabular-nums">{d.totalItems}</p>
            <p className="text-sm text-muted">items in your deck</p>
            <KindSplit byKind={d.byKind} total={d.totalItems} />
          </div>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  tone,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  tone: string;
  label: string;
  value: number;
  hint: string;
}) {
  return (
    <Card className="p-5">
      <div className={cn("grid size-9 place-items-center rounded-xl [&>svg]:size-[18px]", tone)}>{icon}</div>
      <p className="mt-4 text-sm font-medium text-muted">{label}</p>
      <p className="mt-0.5 text-3xl font-semibold tracking-tight tabular-nums">{value}</p>
      <p className="mt-1 text-xs text-subtle">{hint}</p>
    </Card>
  );
}

const kinds = [
  { key: "problem", label: "Problems", color: "bg-info" },
  { key: "concept", label: "Concepts", color: "bg-accent" },
  { key: "behavioral", label: "Behavioral", color: "bg-warning" },
] as const;

function KindSplit({ byKind, total }: { byKind: Partial<Record<string, number>>; total: number }) {
  return (
    <>
      <div className="mt-5 flex h-2 gap-0.5 overflow-hidden rounded-full">
        {kinds.map((k) => (
          <div key={k.key} className={k.color} style={{ width: `${((byKind[k.key] ?? 0) / total) * 100}%` }} />
        ))}
      </div>
      <dl className="mt-4 space-y-2 text-sm">
        {kinds.map((k) => (
          <div key={k.key} className="flex items-center justify-between">
            <dt className="flex items-center gap-2 text-muted">
              <span className={cn("size-2 rounded-full", k.color)} />
              {k.label}
            </dt>
            <dd className="font-medium tabular-nums">{byKind[k.key] ?? 0}</dd>
          </div>
        ))}
      </dl>
      <Link href="/items/new" className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline">
        <BookMarked className="size-4" />
        Add an item
      </Link>
    </>
  );
}

// Ease runs from 1.3 (keeps being forgotten) to about 3 (easy); new items start at 2.5.
function EaseBar({ ease }: { ease: number }) {
  const pct = Math.min(100, Math.max(4, ((ease - 1.3) / (3 - 1.3)) * 100));
  const color = ease < 1.9 ? "bg-danger" : ease < 2.4 ? "bg-warning" : "bg-success";
  return (
    <div
      className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-muted"
      role="meter"
      aria-valuemin={1.3}
      aria-valuemax={3}
      aria-valuenow={Number(ease.toFixed(2))}
      aria-label="Average ease"
    >
      <div className={cn("h-full rounded-full", color)} style={{ width: `${pct}%` }} />
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Skeleton className="h-56 md:col-span-2" />
        <Skeleton className="h-56" />
        <Skeleton className="h-56" />
      </div>
      <Skeleton className="h-48" />
      <div className="grid gap-6 lg:grid-cols-3">
        <Skeleton className="h-80 lg:col-span-2" />
        <Skeleton className="h-80" />
      </div>
    </div>
  );
}
