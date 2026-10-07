import "server-only";
import { isValidObjectId } from "mongoose";
import { requireUser } from "@/lib/auth/session";
import { connectDb } from "@/lib/db";
import type { Feedback, InterviewSubject } from "@/lib/ai/prompts";
import type { Grade } from "@/lib/srs";
import { Interview } from "@/models/Interview";

export interface InterviewMessage {
  role: "interviewer" | "candidate";
  text: string;
}

export interface PlainInterview {
  id: string;
  itemId: string | null;
  subject: InterviewSubject;
  messages: InterviewMessage[];
  /** True when the last stored turn is the candidate's (e.g. the reply failed). */
  awaitingReply: boolean;
  answerCount: number;
  status: "active" | "completed";
  feedback: Feedback | null;
  appliedGrade: Grade | null;
  usage: { inputTokens: number; outputTokens: number };
  createdAt: Date;
}

type StoredMessage = { role: "user" | "assistant"; text: string; hidden?: boolean };

export function toPlainInterview(doc: Record<string, unknown> & { _id: unknown }): PlainInterview {
  const d = doc as unknown as {
    item: unknown;
    subject: InterviewSubject;
    messages: StoredMessage[];
    status: "active" | "completed";
    feedback: Feedback | null;
    appliedGrade: Grade | null;
    usage?: { inputTokens: number; outputTokens: number };
    createdAt: Date;
  };
  const last = d.messages.at(-1);
  return {
    id: String(doc._id),
    itemId: d.item ? String(d.item) : null,
    subject: {
      title: d.subject.title,
      kind: d.subject.kind,
      topic: d.subject.topic,
      difficulty: d.subject.difficulty ?? null,
      notes: d.subject.notes ?? "",
    },
    messages: d.messages
      .filter((m) => !m.hidden)
      .map((m) => ({ role: m.role === "assistant" ? "interviewer" : "candidate", text: m.text })),
    awaitingReply: last?.role === "user",
    answerCount: d.messages.filter((m) => m.role === "user" && !m.hidden).length,
    status: d.status,
    feedback: d.feedback ?? null,
    appliedGrade: d.appliedGrade ?? null,
    usage: { inputTokens: d.usage?.inputTokens ?? 0, outputTokens: d.usage?.outputTokens ?? 0 },
    createdAt: d.createdAt,
  };
}

export async function getInterview(id: string): Promise<PlainInterview | null> {
  const user = await requireUser();
  if (!isValidObjectId(id)) return null;
  await connectDb();
  const doc = await Interview.findOne({ _id: id, user: user.id }).lean();
  return doc ? toPlainInterview(doc) : null;
}

export async function listInterviews(limit = 20) {
  const user = await requireUser();
  await connectDb();
  const docs = await Interview.find({ user: user.id }, { system: 0, "messages.content": 0 })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
  return docs.map(toPlainInterview);
}

export async function listInterviewsForItem(itemId: string, limit = 10) {
  const user = await requireUser();
  if (!isValidObjectId(itemId)) return [];
  await connectDb();
  const docs = await Interview.find({ item: itemId, user: user.id }, { system: 0, "messages.content": 0 })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
  return docs.map(toPlainInterview);
}
