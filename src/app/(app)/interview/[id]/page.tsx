import { ArrowLeft, ArrowUpRight, Lightbulb, RotateCcw, Trash2 } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { deleteInterview, practiseAgain } from "@/actions/interview";
import { ConfirmButton } from "@/components/confirm-button";
import { ApplyGrade } from "@/components/interview/apply-grade";
import { FeedbackReport } from "@/components/interview/feedback-report";
import { InterviewRoom } from "@/components/interview/interview-room";
import { SubmitButton } from "@/components/submit-button";
import { Card, CardHeader, DifficultyBadge, KindBadge, Skeleton } from "@/components/ui";
import { isAiEnabled } from "@/lib/ai/client";
import type { Kind } from "@/lib/constants";
import { getInterview } from "@/lib/interviews";

export default function InterviewPage({ params }: PageProps<"/interview/[id]">) {
  return (
    <Suspense
      fallback={
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <Skeleton className="h-[560px]" />
          <Skeleton className="h-72" />
        </div>
      }
    >
      <Session params={params} />
    </Suspense>
  );
}

const tips: Record<Kind, string[]> = {
  problem: [
    "Restate the problem and ask about constraints.",
    "Start with brute force, then optimise.",
    "State time and space complexity.",
    "Walk through an example and the edge cases.",
  ],
  concept: [
    "Lead with a one-sentence definition.",
    "Explain how it works underneath.",
    "Cover trade-offs and when you'd use it.",
    "Give a concrete, real-world example.",
  ],
  behavioral: [
    "Use STAR: Situation, Task, Action, Result.",
    "Say \"I\", not \"we\": own your part.",
    "Quantify the result where you can.",
    "Close with what you learned.",
  ],
};

async function Session({ params }: Pick<PageProps<"/interview/[id]">, "params">) {
  const { id } = await params;
  const interview = await getInterview(id);
  if (!interview) notFound();

  const { subject, feedback } = interview;
  const completed = interview.status === "completed" && feedback;

  return (
    <div className="space-y-6">
      <Link href="/interview" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground">
        <ArrowLeft className="size-4" />
        Mock interviews
      </Link>

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0">
          {completed ? (
            <>
              <h1 className="mb-6 text-2xl font-semibold tracking-tight">Interview feedback</h1>
              <FeedbackReport feedback={feedback} transcript={interview.messages} />
            </>
          ) : isAiEnabled() ? (
            <InterviewRoom
              // Remount with fresh state whenever the stored transcript changes.
              key={`${interview.messages.length}:${interview.awaitingReply}`}
              id={interview.id}
              initialMessages={interview.messages}
              awaitingReply={interview.awaitingReply}
            />
          ) : (
            <Card className="p-8 text-center text-sm text-muted">
              AI features are turned off. Set <code className="font-mono">ANTHROPIC_API_KEY</code> to continue this interview.
            </Card>
          )}
        </div>

        <aside className="space-y-6 lg:sticky lg:top-10">
          <Card>
            <CardHeader title="Question" />
            <div className="space-y-3 px-5 pb-5 pt-3 sm:px-6">
              <div className="flex flex-wrap items-center gap-1.5">
                <KindBadge kind={subject.kind} />
                <DifficultyBadge difficulty={subject.difficulty} />
              </div>
              <p className="font-medium leading-snug">{subject.title}</p>
              <p className="text-sm text-muted">{subject.topic}</p>
              {interview.itemId && (
                <Link
                  href={`/items/${interview.itemId}`}
                  className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline"
                >
                  View in library
                  <ArrowUpRight className="size-3.5" />
                </Link>
              )}
            </div>
          </Card>

          {completed ? (
            <Card>
              <CardHeader title="Update your schedule" description="Record this as a review of the question." />
              <div className="px-5 pb-5 pt-4 sm:px-6">
                <ApplyGrade
                  interviewId={interview.id}
                  suggested={feedback.suggested_grade}
                  applied={interview.appliedGrade}
                  hasItem={Boolean(interview.itemId)}
                />
              </div>
            </Card>
          ) : (
            <Card>
              <CardHeader
                title={
                  <span className="flex items-center gap-2">
                    <Lightbulb className="size-4 text-accent" />
                    Strong answers
                  </span>
                }
              />
              <ul className="space-y-2 px-5 pb-5 pt-3 text-sm text-muted sm:px-6">
                {tips[subject.kind].map((t) => (
                  <li key={t} className="flex gap-2.5">
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-accent/60" />
                    {t}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <div className="flex flex-wrap gap-2">
            {completed && interview.itemId && isAiEnabled() && (
              <form action={practiseAgain}>
                <input type="hidden" name="itemId" value={interview.itemId} />
                <SubmitButton variant="secondary" pendingLabel="Starting…">
                  <RotateCcw />
                  Practise again
                </SubmitButton>
              </form>
            )}
            <ConfirmButton
              action={deleteInterview.bind(null, interview.id)}
              title="Delete this interview?"
              description="The transcript and feedback are permanently deleted."
              confirmLabel="Delete"
              variant="ghost"
            >
              <Trash2 />
              Delete
            </ConfirmButton>
          </div>

          {interview.usage.inputTokens > 0 && (
            <p className="text-xs text-subtle">
              {(interview.usage.inputTokens + interview.usage.outputTokens).toLocaleString("en")} tokens used
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}
