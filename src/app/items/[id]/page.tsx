import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { deleteItem, resetItemProgress } from "@/app/actions";
import { ConfirmButton } from "@/components/confirm-button";
import { Card, DifficultyLabel, KindBadge, Skeleton, buttonStyles } from "@/components/ui";
import { getItem, getItemHistory } from "@/lib/data";
import { formatInterval } from "@/lib/srs";

export default function ItemPage({ params }: PageProps<"/items/[id]">) {
  return (
    <Suspense fallback={<Skeleton className="h-96" />}>
      <ItemDetail params={params} />
    </Suspense>
  );
}

const gradeColor = {
  again: "text-rose-600 dark:text-rose-400",
  hard: "text-amber-600 dark:text-amber-400",
  good: "text-emerald-600 dark:text-emerald-400",
  easy: "text-sky-600 dark:text-sky-400",
};

const dateFmt = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "UTC" });

async function ItemDetail({ params }: Pick<PageProps<"/items/[id]">, "params">) {
  const { id } = await params;
  const [item, history] = await Promise.all([getItem(id), getItemHistory(id)]);
  if (!item) notFound();

  const { srs } = item;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/items" className="text-sm text-zinc-500 hover:underline">
          ← Library
        </Link>
        <div className="mt-3 flex items-center gap-3">
          <KindBadge kind={item.kind} />
          <span className="text-sm text-zinc-500">{item.topic}</span>
          <DifficultyLabel difficulty={item.difficulty} />
        </div>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">{item.title}</h1>
        {item.url && (
          <a href={item.url} target="_blank" rel="noreferrer" className="text-sm text-indigo-600 hover:underline dark:text-indigo-400">
            {item.url} ↗
          </a>
        )}
        {item.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {item.tags.map((t) => (
              <Link
                key={t}
                href={`/items?q=${encodeURIComponent(t)}`}
                className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400"
              >
                #{t}
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <h2 className="mb-3 font-semibold">Notes</h2>
          {item.notes ? (
            <p className="whitespace-pre-wrap font-mono text-sm leading-relaxed">{item.notes}</p>
          ) : (
            <p className="text-sm text-zinc-500">No notes yet.</p>
          )}
        </Card>

        <Card>
          <h2 className="mb-3 font-semibold">Memory</h2>
          <dl className="space-y-2 text-sm">
            <Row label="Next review" value={dateFmt.format(srs.dueAt)} />
            <Row label="Interval" value={srs.interval ? formatInterval(srs.interval) : "New"} />
            <Row label="Ease" value={srs.ease.toFixed(2)} />
            <Row label="Streak" value={String(srs.reps)} />
            <Row label="Lapses" value={String(srs.lapses)} />
          </dl>
        </Card>
      </div>

      <Card>
        <h2 className="mb-3 font-semibold">Review history</h2>
        {history.length === 0 ? (
          <p className="text-sm text-zinc-500">Not reviewed yet.</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {history.map((r) => (
              <li key={r.id} className="flex justify-between">
                <span className="text-zinc-500">{dateFmt.format(r.reviewedAt)}</span>
                <span>
                  <span className={`font-medium capitalize ${gradeColor[r.grade]}`}>{r.grade}</span>
                  <span className="text-zinc-500"> → {formatInterval(r.intervalAfter)}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="flex flex-wrap gap-3">
        <Link href={`/items/${item.id}/edit`} className={buttonStyles.primary}>
          Edit
        </Link>
        <ConfirmButton
          action={resetItemProgress.bind(null, item.id)}
          message="Reset this item's review progress and history?"
          className={buttonStyles.secondary}
        >
          Reset progress
        </ConfirmButton>
        <ConfirmButton
          action={deleteItem.bind(null, item.id)}
          message="Delete this item permanently?"
          className={buttonStyles.danger}
        >
          Delete
        </ConfirmButton>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-zinc-500">{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}
