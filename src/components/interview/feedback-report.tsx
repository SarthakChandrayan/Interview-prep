import { CheckCircle2, ChevronDown, Lightbulb, TrendingUp } from "lucide-react";
import type { Feedback } from "@/lib/ai/prompts";
import type { InterviewMessage } from "@/lib/interviews";
import { Markdown } from "../markdown";
import { ScoreRing, scoreTone } from "../score";
import { Card, CardHeader, cn } from "../ui";

export function FeedbackReport({ feedback, transcript }: { feedback: Feedback; transcript: InterviewMessage[] }) {
  return (
    <div className="animate-fade-in space-y-6">
      <Card className="p-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <ScoreRing score={feedback.overall_score} />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-subtle">Overall</p>
            <p className="mt-1.5 text-[15px] leading-relaxed">{feedback.summary}</p>
          </div>
        </div>
        <div className="mt-6 grid gap-4 border-t border-border pt-6 sm:grid-cols-2">
          {feedback.dimensions.map((d) => (
            <div key={d.name}>
              <div className="flex items-baseline justify-between text-sm">
                <span className="font-medium">{d.name}</span>
                <span className={cn("font-semibold tabular-nums", scoreTone(d.score))}>{d.score}/5</span>
              </div>
              <div className="mt-1.5 flex gap-1" aria-hidden>
                {[1, 2, 3, 4, 5].map((n) => (
                  <span
                    key={n}
                    className={cn("h-1.5 flex-1 rounded-full", n <= d.score ? "bg-current" : "bg-surface-muted", n <= d.score && scoreTone(d.score))}
                  />
                ))}
              </div>
              <p className="mt-1.5 text-sm text-muted">{d.comment}</p>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <ListCard title="What went well" icon={<CheckCircle2 className="text-success" />} items={feedback.strengths} />
        <ListCard title="What to improve" icon={<TrendingUp className="text-warning" />} items={feedback.improvements} />
      </div>

      <Card>
        <CardHeader
          title={
            <span className="flex items-center gap-2">
              <Lightbulb className="size-4 text-accent" />
              Model answer
            </span>
          }
          description="How a strong candidate might answer"
        />
        <div className="px-5 pb-6 pt-3 sm:px-6">
          <Markdown>{feedback.model_answer}</Markdown>
        </div>
      </Card>

      <details className="group rounded-2xl border border-border bg-surface shadow-[var(--shadow-card)]">
        <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 text-[15px] font-semibold sm:px-6 [&::-webkit-details-marker]:hidden">
          Transcript
          <ChevronDown className="size-4 text-subtle transition-transform group-open:rotate-180" />
        </summary>
        <div className="space-y-4 border-t border-border px-5 py-5 sm:px-6">
          {transcript.map((m, i) => (
            <div key={i}>
              <p className="text-xs font-semibold text-subtle">{m.role === "interviewer" ? "Interviewer" : "You"}</p>
              {m.role === "interviewer" ? (
                <Markdown className="mt-1 text-sm">{m.text}</Markdown>
              ) : (
                <p className="mt-1 whitespace-pre-wrap text-sm">{m.text}</p>
              )}
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}

function ListCard({ title, icon, items }: { title: string; icon: React.ReactNode; items: string[] }) {
  return (
    <Card>
      <CardHeader
        title={
          <span className="flex items-center gap-2 [&>svg]:size-4">
            {icon}
            {title}
          </span>
        }
      />
      <ul className="space-y-2.5 px-5 pb-6 pt-3 text-sm sm:px-6">
        {items.length === 0 ? (
          <li className="text-muted">Nothing noted.</li>
        ) : (
          items.map((s, i) => (
            <li key={i} className="flex gap-2.5">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-border-strong" />
              <span className="leading-relaxed">{s}</span>
            </li>
          ))
        )}
      </ul>
    </Card>
  );
}
