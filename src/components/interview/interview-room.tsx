"use client";

import { ArrowUp, Bot, CircleStop, Flag, Loader2, Mic, RotateCw, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { finishInterview } from "@/app/interview/actions";
import { MAX_ANSWERS, MAX_ANSWER_CHARS, WRAP_UP_AFTER } from "@/lib/ai/constants";
import type { InterviewMessage } from "@/lib/interviews";
import { Markdown } from "../markdown";
import { Button, Card, Kbd, cn } from "../ui";
import { useSpeech } from "./use-speech";

type Phase = "idle" | "streaming" | "error";

// Guards the automatic request against React's dev-mode double effects.
// Keyed by transcript length so a refreshed transcript can trigger it again.
const autoStarted = new Set<string>();

export function InterviewRoom({
  id,
  initialMessages,
  awaitingReply,
}: {
  id: string;
  initialMessages: InterviewMessage[];
  awaitingReply: boolean;
}) {
  const router = useRouter();
  const [messages, setMessages] = useState(initialMessages);
  const [streamText, setStreamText] = useState("");
  const autoStart = initialMessages.length === 0 || awaitingReply;
  const [phase, setPhase] = useState<Phase>(autoStart ? "streaming" : "idle");
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [finishing, startFinishing] = useTransition();
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const answers = messages.filter((m) => m.role === "candidate").length;
  const needsReply = messages.length === 0 || messages.at(-1)?.role === "candidate";
  const busy = phase === "streaming" || finishing;

  const speech = useSpeech((text) => setDraft((d) => (d ? `${d.trimEnd()} ${text}` : text)));

  // Network half of a turn: streams the reply into state as it arrives.
  const streamTurn = useCallback(
    async (answer?: string) => {
      try {
        const res = await fetch(`/api/interviews/${id}/turn`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(answer ? { answer } : {}),
        });
        if (!res.ok || !res.body) {
          const body = (await res.json().catch(() => null)) as { error?: string; code?: string } | null;
          // A reply started before a reload is still being written: wait for it.
          if (!answer && body?.code === "busy") {
            setTimeout(() => void streamTurn(), 1500);
            return;
          }
          // It finished saving in the meantime: reload the transcript.
          if (!answer && body?.code === "already_answered") {
            router.refresh();
            return;
          }
          throw new Error(body?.error ?? "The interviewer couldn't reply. Try again.");
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let full = "";
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            if (!line.trim()) continue;
            const event = JSON.parse(line) as { type: string; text?: string; message?: string };
            if (event.type === "delta") {
              full += event.text;
              setStreamText(full);
            } else if (event.type === "error") {
              throw new Error(event.message);
            } else if (event.type === "done") {
              setMessages((m) => [...m, { role: "interviewer", text: full.trim() }]);
              setStreamText("");
              setPhase("idle");
              return;
            }
          }
        }
        throw new Error("The connection dropped before the interviewer finished.");
      } catch (err) {
        setStreamText("");
        setPhase("error");
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    },
    [id, router],
  );

  function runTurn(answer?: string) {
    setPhase("streaming");
    setError(null);
    setStreamText("");
    void streamTurn(answer);
  }

  // Kick off the interview, or retry a reply that failed before the page loaded.
  useEffect(() => {
    const key = `${id}:${initialMessages.length}`;
    if (autoStart && !autoStarted.has(key)) {
      autoStarted.add(key);
      void streamTurn();
    }
  }, [id, autoStart, initialMessages.length, streamTurn]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, streamText]);

  // Grow the textarea with its content.
  useEffect(() => {
    const t = textareaRef.current;
    if (!t) return;
    t.style.height = "auto";
    t.style.height = `${Math.min(t.scrollHeight, 240)}px`;
  }, [draft, speech.interim]);

  function send() {
    const answer = draft.trim();
    if (!answer || busy || needsReply) return;
    if (speech.listening) speech.stop();
    setDraft("");
    setMessages((m) => [...m, { role: "candidate", text: answer }]);
    runTurn(answer);
  }

  function finish() {
    if (speech.listening) speech.stop();
    startFinishing(async () => {
      const result = await finishInterview(id);
      if (result.error) toast.error(result.error);
      else router.refresh();
    });
  }

  const atLimit = answers >= MAX_ANSWERS;
  const shownDraft = speech.interim ? `${draft}${draft ? " " : ""}${speech.interim}` : draft;

  if (finishing) {
    return (
      <Card className="flex min-h-[420px] flex-col items-center justify-center gap-4 p-10 text-center">
        <Loader2 className="size-8 animate-spin text-accent" />
        <div>
          <p className="font-semibold">Reviewing your interview…</p>
          <p className="mt-1 text-sm text-muted">Scoring your answers and writing a model answer. This takes a few seconds.</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="flex h-[calc(100dvh-13rem)] min-h-[480px] flex-col overflow-hidden lg:h-[calc(100dvh-11rem)]">
      <div ref={scrollRef} className="flex-1 space-y-6 overflow-y-auto px-4 py-6 sm:px-6" aria-live="polite">
        {messages.map((m, i) => (
          <Bubble key={i} role={m.role} text={m.text} />
        ))}
        {phase === "streaming" && (
          <Bubble role="interviewer" text={streamText} streaming />
        )}
        {phase === "error" && error && (
          <div role="alert" className="mx-auto flex max-w-md flex-col items-center gap-3 rounded-xl bg-danger-soft px-4 py-3 text-center text-sm text-danger">
            {error}
            {needsReply && (
              <Button size="sm" variant="secondary" onClick={() => runTurn()}>
                <RotateCw />
                Retry
              </Button>
            )}
          </div>
        )}
        {answers >= WRAP_UP_AFTER && phase === "idle" && (
          <p className="text-center text-xs text-subtle">
            You&apos;ve covered a lot. End the interview whenever you&apos;re ready for feedback.
          </p>
        )}
      </div>

      <div className="border-t border-border bg-surface p-3 sm:p-4">
        <div
          className={cn(
            "rounded-xl border border-border bg-surface shadow-sm transition-colors focus-within:border-accent focus-within:ring-4 focus-within:ring-ring",
            speech.listening && "border-danger ring-4 ring-danger/15",
          )}
        >
          <label htmlFor="answer" className="sr-only">
            Your answer
          </label>
          <textarea
            id="answer"
            ref={textareaRef}
            value={shownDraft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                send();
              }
            }}
            readOnly={speech.listening}
            maxLength={MAX_ANSWER_CHARS}
            rows={2}
            placeholder={
              atLimit
                ? "That's the maximum for one session. End the interview to get feedback."
                : speech.listening
                  ? "Listening… speak your answer"
                  : "Type your answer… (Enter to send, Shift+Enter for a new line)"
            }
            disabled={atLimit}
            className="block w-full resize-none bg-transparent px-4 pt-3 text-[15px] leading-relaxed placeholder:text-subtle focus:outline-none disabled:cursor-not-allowed"
          />
          <div className="flex items-center gap-2 px-2.5 pb-2.5">
            {speech.supported && (
              <Button
                type="button"
                size="sm"
                variant={speech.listening ? "danger" : "ghost"}
                onClick={speech.listening ? speech.stop : speech.start}
                disabled={atLimit}
                aria-pressed={speech.listening}
              >
                {speech.listening ? <CircleStop /> : <Mic />}
                {speech.listening ? "Stop" : "Speak"}
              </Button>
            )}
            {speech.error && <span className="text-xs text-danger">{speech.error}</span>}
            {draft.length > MAX_ANSWER_CHARS * 0.8 && (
              <span className="text-xs tabular-nums text-subtle">
                {draft.length}/{MAX_ANSWER_CHARS}
              </span>
            )}
            <div className="ml-auto flex items-center gap-2">
              <span className="hidden text-xs text-subtle sm:inline">
                <Kbd>Enter</Kbd> to send
              </span>
              <Button
                type="button"
                size="sm"
                onClick={send}
                disabled={!draft.trim() || busy || needsReply || atLimit}
                aria-label="Send answer"
              >
                <ArrowUp />
                Send
              </Button>
            </div>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-xs tabular-nums text-subtle">
            {answers} of up to {MAX_ANSWERS} answers
          </p>
          <Button type="button" variant="secondary" size="sm" onClick={finish} disabled={busy || answers === 0}>
            <Flag />
            End &amp; get feedback
          </Button>
        </div>
      </div>
    </Card>
  );
}

function Bubble({ role, text, streaming }: { role: InterviewMessage["role"]; text: string; streaming?: boolean }) {
  const interviewer = role === "interviewer";
  return (
    <div className={cn("flex animate-fade-in gap-3", !interviewer && "flex-row-reverse")}>
      <div
        className={cn(
          "grid size-8 shrink-0 place-items-center rounded-full [&>svg]:size-4",
          interviewer ? "bg-accent-soft text-accent-soft-foreground" : "bg-surface-muted text-muted",
        )}
        aria-hidden
      >
        {interviewer ? <Bot /> : <User />}
      </div>
      <div className={cn("min-w-0 max-w-[85%]", !interviewer && "text-right")}>
        <p className="mb-1 text-xs font-medium text-subtle">{interviewer ? "Interviewer" : "You"}</p>
        <div
          className={cn(
            "inline-block rounded-2xl px-4 py-2.5 text-left",
            interviewer ? "rounded-tl-md bg-surface-muted" : "rounded-tr-md bg-accent text-accent-foreground",
          )}
        >
          {interviewer ? (
            text ? (
              <Markdown className="text-[15px]">{text}</Markdown>
            ) : (
              <span className="flex h-6 items-center gap-1" aria-label="Interviewer is typing">
                {[0, 150, 300].map((d) => (
                  <span key={d} className="size-1.5 animate-pulse rounded-full bg-subtle" style={{ animationDelay: `${d}ms` }} />
                ))}
              </span>
            )
          ) : (
            <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{text}</p>
          )}
          {streaming && text && <span className="ml-0.5 inline-block h-4 w-0.5 translate-y-0.5 animate-blink bg-foreground" />}
        </div>
      </div>
    </div>
  );
}
