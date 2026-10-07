import type { BetaMessageParam } from "@anthropic-ai/sdk/resources/beta/messages/messages";
import { isValidObjectId } from "mongoose";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { AiUnavailableError, describeAiError, fallbackParams, getClient, isAiEnabled } from "@/lib/ai/client";
import { replayableContent, textOf } from "@/lib/ai/content";
import { RateLimitedError, consumeAiQuota } from "@/lib/ai/limits";
import { KICKOFF_MESSAGE, MAX_ANSWERS, MAX_ANSWER_CHARS } from "@/lib/ai/prompts";
import { getCurrentUser } from "@/lib/auth/session";
import { connectDb } from "@/lib/db";
import { Interview } from "@/models/Interview";

const bodySchema = z.object({
  answer: z.string().trim().max(MAX_ANSWER_CHARS, `Keep answers under ${MAX_ANSWER_CHARS} characters`).optional(),
});

const LOCK_MS = 90_000;

type ErrorCode = "busy" | "already_answered";

function fail(status: number, message: string, code?: ErrorCode) {
  return NextResponse.json({ error: message, code }, { status });
}

/**
 * Sends the candidate's answer (or kicks off the interview) and streams the
 * interviewer's reply back as newline-delimited JSON:
 *   {"type":"delta","text":"..."}  … then {"type":"done"} or {"type":"error","message":"..."}
 */
export async function POST(req: NextRequest, ctx: RouteContext<"/api/interviews/[id]/turn">) {
  const user = await getCurrentUser();
  if (!user) return fail(401, "Your session has expired. Sign in again.");
  const { id } = await ctx.params;
  if (!isValidObjectId(id)) return fail(404, "Interview not found");
  if (!isAiEnabled()) return fail(503, new AiUnavailableError().message);

  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return fail(400, parsed.error.issues[0].message);
  const answer = parsed.data.answer;

  await connectDb();
  // Someone else's interview looks exactly like a missing one.
  const interview = await Interview.findOne({ _id: id, user: user.id });
  if (!interview) return fail(404, "Interview not found");
  if (interview.status === "completed") return fail(409, "This interview has ended.");

  const stored = interview.messages;
  const last = stored.at(-1);
  const answers = stored.filter((m) => m.role === "user" && !m.hidden).length;

  // Work out which user turn (if any) this request adds.
  let newUserTurn: { text: string; hidden: boolean } | null = null;
  if (stored.length === 0) {
    newUserTurn = { text: KICKOFF_MESSAGE, hidden: true };
  } else if (answer) {
    if (answers >= MAX_ANSWERS) return fail(409, "That's the maximum length for one interview. End it to get feedback.");
    newUserTurn = { text: answer, hidden: false };
  } else if (last?.role !== "user") {
    // A reply already exists, e.g. it finished saving after the page reloaded.
    return fail(409, "The interviewer has already replied.", "already_answered");
  } // else: retrying a reply that failed last time; nothing new to add.

  const now = Date.now();
  const locked = await Interview.findOneAndUpdate(
    { _id: id, $or: [{ busyUntil: null }, { busyUntil: { $lt: new Date(now) } }] },
    { busyUntil: new Date(now + LOCK_MS) },
  );
  if (!locked) return fail(409, "The interviewer is already replying.", "busy");
  const unlock = () => Interview.updateOne({ _id: id }, { busyUntil: null });

  try {
    await consumeAiQuota(user.id);
  } catch (err) {
    await unlock();
    if (err instanceof RateLimitedError) return fail(429, err.message);
    throw err;
  }

  const history: BetaMessageParam[] = stored.map((m) => ({ role: m.role, content: m.content }));
  if (newUserTurn) {
    const content = [{ type: "text" as const, text: newUserTurn.text }];
    history.push({ role: "user", content });
    await Interview.updateOne(
      { _id: id },
      { $push: { messages: { role: "user", content, text: newUserTurn.hidden ? "" : newUserTurn.text, hidden: newUserTurn.hidden } } },
    );
  }

  const encoder = new TextEncoder();
  // If the browser goes away mid-reply we keep generating and still save the
  // reply, so it's there when the candidate comes back.
  let clientGone = false;
  const send = (controller: ReadableStreamDefaultController, event: object) => {
    if (clientGone) return;
    try {
      controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
    } catch {
      clientGone = true;
    }
  };

  const body = new ReadableStream({
    cancel() {
      clientGone = true;
    },
    async start(controller) {
      try {
        const stream = getClient().beta.messages.stream({
          model: interview.model,
          max_tokens: 4000,
          system: interview.system,
          messages: history,
          cache_control: { type: "ephemeral" },
          // Conversational turns: keep latency and cost low.
          output_config: { effort: "low" },
          ...fallbackParams(),
        });

        for await (const event of stream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            send(controller, { type: "delta", text: event.delta.text });
          }
        }

        const message = await stream.finalMessage();
        if (message.stop_reason === "refusal") {
          send(controller, {
            type: "error",
            message: "The interviewer couldn't respond to that. Try rephrasing your answer.",
          });
          return;
        }

        await Interview.updateOne(
          { _id: id },
          {
            $push: {
              messages: { role: "assistant", content: replayableContent(message.content), text: textOf(message.content) },
            },
            $inc: { "usage.inputTokens": message.usage.input_tokens, "usage.outputTokens": message.usage.output_tokens },
          },
        );
        send(controller, { type: "done" });
      } catch (err) {
        console.error("[interview turn]", err);
        send(controller, { type: "error", message: describeAiError(err).message });
      } finally {
        await unlock();
        if (!clientGone) controller.close();
      }
    },
  });

  return new Response(body, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Accel-Buffering": "no",
    },
  });
}
