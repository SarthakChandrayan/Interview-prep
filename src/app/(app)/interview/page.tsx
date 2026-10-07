import { History, KeyRound, MessagesSquare } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { StartInterviewForm } from "@/components/interview/start-form";
import { ScoreBadge } from "@/components/score";
import { Badge, ButtonLink, Card, CardHeader, EmptyState, KindBadge, PageHeader, Skeleton } from "@/components/ui";
import { isAiEnabled } from "@/lib/ai/client";
import { listItems } from "@/lib/data";
import { listInterviews } from "@/lib/interviews";

export const metadata: Metadata = { title: "Mock interview" };

export default function InterviewHubPage({ searchParams }: PageProps<"/interview">) {
  return (
    <>
      <PageHeader
        title="Mock interview"
        description="Practise answering out loud with an AI interviewer that asks follow-ups, then get scored feedback that feeds back into your reviews."
      />
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <Suspense fallback={<Skeleton className="h-80" />}>
            <Start searchParams={searchParams} />
          </Suspense>
        </div>
        <div className="lg:col-span-2">
          <Suspense fallback={<Skeleton className="h-80" />}>
            <Past />
          </Suspense>
        </div>
      </div>
    </>
  );
}

async function Start({ searchParams }: Pick<PageProps<"/interview">, "searchParams">) {
  const [{ item }, items] = await Promise.all([searchParams, listItems()]);
  const enabled = isAiEnabled();

  if (!enabled) return <AiSetupCard />;
  if (items.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={<MessagesSquare />}
          title="Add some questions first"
          description="The interviewer quizzes you on items from your library."
        >
          <ButtonLink href="/items/new">New item</ButtonLink>
        </EmptyState>
      </Card>
    );
  }

  const options = items
    .map((i) => ({ id: i.id, title: i.title, topic: i.topic, kind: i.kind }))
    .sort((a, b) => a.topic.localeCompare(b.topic) || a.title.localeCompare(b.title));
  const preselected = typeof item === "string" && options.some((o) => o.id === item) ? item : "";

  return (
    <Card>
      <CardHeader title="Start a session" description="One question, a few follow-ups, about 10 minutes." />
      <div className="px-5 pb-6 pt-4 sm:px-6">
        <StartInterviewForm options={options} defaultItemId={preselected} />
      </div>
    </Card>
  );
}

function AiSetupCard() {
  return (
    <Card>
      <EmptyState
        icon={<KeyRound />}
        title="Connect an AI provider to enable this"
        description="The mock interviewer uses the Claude API. Add an API key to your environment and restart the app. Everything else in PrepDeck works without it."
      >
        <div className="w-full max-w-md rounded-xl border border-border bg-surface-muted/60 p-4 text-left">
          <p className="text-xs font-medium text-muted">.env.local</p>
          <pre className="mt-1.5 overflow-x-auto font-mono text-[13px]">ANTHROPIC_API_KEY=sk-ant-…</pre>
          <p className="mt-3 text-xs text-muted">
            Create a key in the{" "}
            <a href="https://console.anthropic.com" target="_blank" rel="noreferrer" className="text-accent hover:underline">
              Anthropic Console
            </a>
            . Set a monthly spend limit there; a session costs a few cents.
          </p>
        </div>
      </EmptyState>
    </Card>
  );
}

const dateFmt = new Intl.DateTimeFormat("en", { month: "short", day: "numeric", timeZone: "UTC" });

async function Past() {
  const interviews = await listInterviews(15);
  return (
    <Card>
      <CardHeader title="Past sessions" />
      {interviews.length === 0 ? (
        <EmptyState icon={<History />} title="No sessions yet" description="Your interviews and scores will show up here." className="py-10" />
      ) : (
        <ul className="divide-y divide-border px-2 pb-2 pt-2">
          {interviews.map((iv) => (
            <li key={iv.id}>
              <Link href={`/interview/${iv.id}`} className="flex items-center gap-3 rounded-lg px-3 py-3 hover:bg-surface-muted/60">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{iv.subject.title}</p>
                  <div className="mt-1 flex items-center gap-2 text-xs text-subtle">
                    <KindBadge kind={iv.subject.kind} />
                    {dateFmt.format(iv.createdAt)}
                  </div>
                </div>
                {iv.feedback ? <ScoreBadge score={iv.feedback.overall_score} /> : <Badge tone="accent">In progress</Badge>}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
