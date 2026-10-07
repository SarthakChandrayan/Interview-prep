import { ArrowLeft, ArrowUpRight, MessagesSquare, Pencil, RotateCcw, Trash2 } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { deleteItem, resetItemProgress } from "@/app/actions";
import { ConfirmButton } from "@/components/confirm-button";
import { Markdown } from "@/components/markdown";
import { ScoreBadge } from "@/components/score";
import { Badge, ButtonLink, Card, CardHeader, DifficultyBadge, KindBadge, Skeleton, cn } from "@/components/ui";
import { isAiEnabled } from "@/lib/ai/client";
import { getItem, getItemHistory } from "@/lib/data";
import { listInterviewsForItem } from "@/lib/interviews";
import { formatInterval, type Grade } from "@/lib/srs";

export default function ItemPage({ params }: PageProps<"/items/[id]">) {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <Skeleton className="h-28" />
          <Skeleton className="h-72" />
        </div>
      }
    >
      <ItemDetail params={params} />
    </Suspense>
  );
}

const gradeTone: Record<Grade, "danger" | "warning" | "success" | "info"> = {
  again: "danger",
  hard: "warning",
  good: "success",
  easy: "info",
};

const dateFmt = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "UTC" });

async function ItemDetail({ params }: Pick<PageProps<"/items/[id]">, "params">) {
  const { id } = await params;
  const [item, history, interviews] = await Promise.all([getItem(id), getItemHistory(id), listInterviewsForItem(id)]);
  if (!item) notFound();

  const { srs } = item;
  const due = srs.dueAt <= new Date();
  const ai = isAiEnabled();

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <Link href="/items" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground">
          <ArrowLeft className="size-4" />
          Library
        </Link>
        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <KindBadge kind={item.kind} />
              <DifficultyBadge difficulty={item.difficulty} />
              <span className="text-sm text-muted">{item.topic}</span>
            </div>
            <h1 className="mt-2 text-balance text-2xl font-semibold tracking-tight sm:text-[28px]">{item.title}</h1>
            {item.url && (
              <a
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-flex max-w-full items-center gap-1 truncate text-sm text-accent hover:underline"
              >
                {item.url.replace(/^https?:\/\//, "")}
                <ArrowUpRight className="size-3.5 shrink-0" />
              </a>
            )}
            {item.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {item.tags.map((t) => (
                  <Link key={t} href={`/items?q=${encodeURIComponent(t)}`}>
                    <Badge className="hover:text-foreground">#{t}</Badge>
                  </Link>
                ))}
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {ai && (
              <ButtonLink href={`/interview?item=${item.id}`}>
                <MessagesSquare />
                Practise with AI
              </ButtonLink>
            )}
            <ButtonLink href={`/items/${item.id}/edit`} variant="secondary">
              <Pencil />
              Edit
            </ButtonLink>
          </div>
        </div>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Notes" />
          <div className="px-5 pb-6 pt-3 sm:px-6">
            {item.notes ? (
              <Markdown>{item.notes}</Markdown>
            ) : (
              <p className="text-sm text-muted">
                No notes yet.{" "}
                <Link href={`/items/${item.id}/edit`} className="font-medium text-accent hover:underline">
                  Add the answer you want to remember.
                </Link>
              </p>
            )}
          </div>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Memory" />
            <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-b-2xl px-5 pb-5 pt-3 sm:px-6">
              <Stat label="Next review" value={due ? "Due now" : dateFmt.format(srs.dueAt)} highlight={due} />
              <Stat label="Interval" value={srs.interval ? formatInterval(srs.interval) : "New"} />
              <Stat label="Ease" value={srs.ease.toFixed(2)} />
              <Stat label="Streak" value={String(srs.reps)} />
              <Stat label="Lapses" value={String(srs.lapses)} />
              <Stat label="Reviews" value={String(history.length)} />
            </dl>
          </Card>

          <Card>
            <CardHeader title="Review history" />
            <div className="px-5 pb-5 pt-3 sm:px-6">
              {history.length === 0 ? (
                <p className="text-sm text-muted">Not reviewed yet.</p>
              ) : (
                <ol className="space-y-2.5">
                  {history.slice(0, 12).map((r) => (
                    <li key={r.id} className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-muted">{dateFmt.format(r.reviewedAt)}</span>
                      <span className="flex items-center gap-2">
                        <Badge tone={gradeTone[r.grade]} className="capitalize">
                          {r.grade}
                        </Badge>
                        <span className="w-16 text-right text-xs tabular-nums text-subtle">
                          → {formatInterval(r.intervalAfter)}
                        </span>
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </Card>
        </div>
      </div>

      {interviews.length > 0 && (
        <Card>
          <CardHeader title="Mock interviews" description="Your AI practice sessions on this question" />
          <ul className="divide-y divide-border px-2 pb-2 pt-2">
            {interviews.map((iv) => (
              <li key={iv.id}>
                <Link
                  href={`/interview/${iv.id}`}
                  className="flex items-center justify-between rounded-lg px-3 py-3 text-sm hover:bg-surface-muted/60"
                >
                  <span className="text-muted">{dateFmt.format(iv.createdAt)}</span>
                  {iv.feedback ? <ScoreBadge score={iv.feedback.overall_score} /> : <Badge>In progress</Badge>}
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="flex flex-wrap gap-2 border-t border-border pt-6">
        <ConfirmButton
          action={resetItemProgress.bind(null, item.id)}
          title="Reset progress?"
          description="This clears the review history and schedules the item as new. Your notes are kept."
          confirmLabel="Reset progress"
          successMessage="Progress reset"
        >
          <RotateCcw />
          Reset progress
        </ConfirmButton>
        <ConfirmButton
          action={deleteItem.bind(null, item.id)}
          title="Delete this item?"
          description="The item and its review history are permanently deleted. This can't be undone."
          confirmLabel="Delete"
          variant="danger"
        >
          <Trash2 />
          Delete
        </ConfirmButton>
      </div>
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="py-2">
      <dt className="text-xs text-subtle">{label}</dt>
      <dd className={cn("mt-0.5 text-sm font-medium tabular-nums", highlight && "text-accent")}>{value}</dd>
    </div>
  );
}
