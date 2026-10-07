import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Card, DifficultyLabel, KindBadge, PageHeader, Skeleton, buttonStyles, inputStyles } from "@/components/ui";
import { KINDS } from "@/lib/constants";
import { listItems, listTopics } from "@/lib/data";
import { formatInterval } from "@/lib/srs";

export const metadata: Metadata = { title: "Library" };

export default function ItemsPage({ searchParams }: PageProps<"/items">) {
  return (
    <>
      <PageHeader title="Library">
        <Link href="/items/new" className={buttonStyles.primary}>
          + Add item
        </Link>
      </PageHeader>
      <Suspense fallback={<Skeleton className="h-96" />}>
        <Library searchParams={searchParams} />
      </Suspense>
    </>
  );
}

function param(v: string | string[] | undefined) {
  return (Array.isArray(v) ? v[0] : v)?.trim() || undefined;
}

async function Library({ searchParams }: Pick<PageProps<"/items">, "searchParams">) {
  const sp = await searchParams;
  const filters = { kind: param(sp.kind), topic: param(sp.topic), q: param(sp.q) };
  const [items, topics] = await Promise.all([listItems(filters), listTopics()]);
  const now = new Date();

  return (
    <div className="space-y-4">
      <form className="grid gap-2 sm:grid-cols-[1fr_auto_auto_auto]">
        <input name="q" defaultValue={filters.q} placeholder="Search titles or tags…" className={inputStyles} />
        <select name="kind" defaultValue={filters.kind ?? ""} className={inputStyles}>
          <option value="">All types</option>
          {KINDS.map((k) => (
            <option key={k} value={k}>
              {k[0].toUpperCase() + k.slice(1)}
            </option>
          ))}
        </select>
        <select name="topic" defaultValue={filters.topic ?? ""} className={inputStyles}>
          <option value="">All topics</option>
          {topics.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <button className={buttonStyles.secondary}>Filter</button>
      </form>

      {items.length === 0 ? (
        <Card className="py-10 text-center text-sm text-zinc-500">
          No items match.{" "}
          <Link href="/items" className="text-indigo-600 hover:underline dark:text-indigo-400">
            Clear filters
          </Link>
        </Card>
      ) : (
        <Card className="divide-y divide-zinc-100 p-0 dark:divide-zinc-800">
          {items.map((item) => {
            const due = item.srs.dueAt <= now;
            const daysUntil = Math.ceil((item.srs.dueAt.getTime() - now.getTime()) / 86_400_000);
            return (
              <Link
                key={item.id}
                href={`/items/${item.id}`}
                className="flex items-center gap-4 px-5 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{item.title}</p>
                  <div className="mt-1 flex items-center gap-2 text-xs text-zinc-500">
                    <KindBadge kind={item.kind} />
                    <span>{item.topic}</span>
                    <DifficultyLabel difficulty={item.difficulty} />
                  </div>
                </div>
                <span
                  className={`shrink-0 text-xs ${due ? "font-medium text-indigo-600 dark:text-indigo-400" : "text-zinc-500"}`}
                >
                  {due ? "Due now" : `in ${formatInterval(daysUntil)}`}
                </span>
              </Link>
            );
          })}
        </Card>
      )}
      <p className="text-xs text-zinc-500">
        {items.length} {items.length === 1 ? "item" : "items"}
      </p>
    </div>
  );
}
