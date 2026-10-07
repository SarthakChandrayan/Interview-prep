import { BookMarked, ChevronRight, Plus, Search, SearchX } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ButtonLink, Card, DifficultyBadge, EmptyState, KindBadge, PageHeader, Skeleton, fieldClass, cn } from "@/components/ui";
import { KINDS } from "@/lib/constants";
import { listItems, listTopics } from "@/lib/data";
import { formatInterval } from "@/lib/srs";

export const metadata: Metadata = { title: "Library" };

export default function ItemsPage({ searchParams }: PageProps<"/items">) {
  return (
    <>
      <PageHeader
        title="Library"
        description="Everything in your deck, ordered by what's due next."
        actions={
          <ButtonLink href="/items/new">
            <Plus />
            New item
          </ButtonLink>
        }
      />
      <Suspense fallback={<Skeleton className="h-[480px]" />}>
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
  const filtered = Boolean(filters.kind || filters.topic || filters.q);

  if (!filtered && items.length === 0) {
    return (
      <Card>
        <EmptyState icon={<BookMarked />} title="No items yet" description="Add a problem, concept or behavioral story to start building your deck.">
          <ButtonLink href="/items/new">
            <Plus />
            New item
          </ButtonLink>
        </EmptyState>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <form className="grid gap-2 sm:grid-cols-[1fr_160px_200px_auto]" role="search">
        <label className="relative">
          <span className="sr-only">Search</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle" />
          <input name="q" defaultValue={filters.q} placeholder="Search titles or tags…" className={cn(fieldClass, "pl-9")} />
        </label>
        <select name="kind" defaultValue={filters.kind ?? ""} className={fieldClass} aria-label="Type">
          <option value="">All types</option>
          {KINDS.map((k) => (
            <option key={k} value={k}>
              {k[0].toUpperCase() + k.slice(1)}
            </option>
          ))}
        </select>
        <select name="topic" defaultValue={filters.topic ?? ""} className={fieldClass} aria-label="Topic">
          <option value="">All topics</option>
          {topics.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <button className="h-10 rounded-lg border border-border bg-surface px-4 text-sm font-medium shadow-sm hover:bg-surface-muted">
          Apply
        </button>
      </form>

      {items.length === 0 ? (
        <Card>
          <EmptyState icon={<SearchX />} title="No matches" description="Try a different search or clear the filters.">
            <ButtonLink href="/items" variant="secondary">
              Clear filters
            </ButtonLink>
          </EmptyState>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="hidden grid-cols-[1fr_140px_110px_24px] gap-4 border-b border-border px-5 py-2.5 text-xs font-medium uppercase tracking-wider text-subtle sm:grid">
            <span>Item</span>
            <span>Topic</span>
            <span className="text-right">Next review</span>
            <span />
          </div>
          <ul className="divide-y divide-border">
            {items.map((item) => {
              const due = item.srs.dueAt <= now;
              const daysUntil = Math.ceil((item.srs.dueAt.getTime() - now.getTime()) / 86_400_000);
              return (
                <li key={item.id}>
                  <Link
                    href={`/items/${item.id}`}
                    className="group grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1.5 px-5 py-3.5 transition-colors hover:bg-surface-muted/60 sm:grid-cols-[1fr_140px_110px_24px]"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[15px] font-medium group-hover:text-accent">{item.title}</p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        <KindBadge kind={item.kind} />
                        <DifficultyBadge difficulty={item.difficulty} />
                        <span className="text-xs text-muted sm:hidden">{item.topic}</span>
                      </div>
                    </div>
                    <span className="hidden truncate text-sm text-muted sm:block">{item.topic}</span>
                    <span
                      className={cn(
                        "text-right text-sm tabular-nums",
                        due ? "font-medium text-accent" : "text-muted",
                      )}
                    >
                      {due ? "Due now" : daysUntil === 1 ? "Tomorrow" : `in ${formatInterval(daysUntil)}`}
                    </span>
                    <ChevronRight className="hidden size-4 text-subtle group-hover:text-foreground sm:block" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </Card>
      )}
      <p className="text-xs text-subtle">
        {items.length} {items.length === 1 ? "item" : "items"}
        {filtered && " match"}
      </p>
    </div>
  );
}
