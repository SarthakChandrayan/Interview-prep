import "server-only";
import { isValidObjectId } from "mongoose";
import { connection } from "next/server";
import { connectDb } from "@/lib/db";
import { currentStreak, dayKey, lastNDays } from "@/lib/stats";
import type { Grade, SrsState } from "@/lib/srs";
import type { Difficulty, Kind } from "@/lib/constants";
import { Item, type ItemDoc } from "@/models/Item";
import { Interview } from "@/models/Interview";
import { Review } from "@/models/Review";

export interface PlainItem {
  id: string;
  title: string;
  kind: Kind;
  topic: string;
  difficulty: Difficulty | null;
  url: string;
  notes: string;
  tags: string[];
  srs: SrsState;
  createdAt: Date;
}

// Lean Mongo documents carry ObjectIds and extra fields; flatten them into
// plain objects that are safe to pass to client components.
function toPlain(doc: ItemDoc & { _id: unknown }): PlainItem {
  return {
    id: String(doc._id),
    title: doc.title,
    kind: doc.kind as Kind,
    topic: doc.topic,
    difficulty: (doc.difficulty as Difficulty | null) ?? null,
    url: doc.url ?? "",
    notes: doc.notes ?? "",
    tags: doc.tags ?? [],
    srs: {
      ease: doc.srs.ease,
      interval: doc.srs.interval,
      reps: doc.srs.reps,
      lapses: doc.srs.lapses ?? 0,
      dueAt: doc.srs.dueAt,
      lastReviewedAt: doc.srs.lastReviewedAt ?? null,
    },
    createdAt: doc.createdAt,
  };
}

// Every read goes through here: it marks the render as request-time (data
// changes constantly) and makes sure Mongo is connected.
async function ready() {
  await connection();
  await connectDb();
}

export interface ItemFilters {
  kind?: string;
  topic?: string;
  q?: string;
}

export async function listItems(filters: ItemFilters = {}): Promise<PlainItem[]> {
  await ready();
  const query: Record<string, unknown> = {};
  if (filters.kind) query.kind = filters.kind;
  if (filters.topic) query.topic = filters.topic;
  if (filters.q) {
    const escaped = filters.q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    query.$or = [{ title: { $regex: escaped, $options: "i" } }, { tags: filters.q.toLowerCase() }];
  }
  const docs = await Item.find(query).sort({ "srs.dueAt": 1 }).limit(500).lean();
  return docs.map(toPlain);
}

export async function listTopics(): Promise<string[]> {
  await ready();
  const topics = await Item.distinct("topic");
  return topics.sort((a, b) => a.localeCompare(b));
}

export async function getItem(id: string): Promise<PlainItem | null> {
  await ready();
  if (!isValidObjectId(id)) return null;
  const doc = await Item.findById(id).lean();
  return doc ? toPlain(doc) : null;
}

export async function getItemHistory(id: string) {
  await ready();
  if (!isValidObjectId(id)) return [];
  const docs = await Review.find({ item: id }).sort({ reviewedAt: -1 }).limit(50).lean();
  return docs.map((r) => ({
    id: String(r._id),
    grade: r.grade as Grade,
    intervalAfter: r.intervalAfter,
    reviewedAt: r.reviewedAt,
  }));
}

export async function getReviewQueue(limit = 50) {
  await ready();
  const now = new Date();
  const [items, total] = await Promise.all([
    Item.find({ "srs.dueAt": { $lte: now } }).sort({ "srs.dueAt": 1 }).limit(limit).lean(),
    Item.countDocuments({ "srs.dueAt": { $lte: now } }),
  ]);
  return { items: items.map(toPlain), total };
}

export interface TopicStat {
  topic: string;
  count: number;
  due: number;
  avgEase: number;
  lapses: number;
}

export async function getDashboard() {
  await ready();
  const now = new Date();
  // A full year of activity, ending today, for the heatmap.
  const days = lastNDays(364, now);
  const since = new Date(`${days[0]}T00:00:00Z`);

  const [totalItems, dueNow, byKind, topics, activity, interviewStats] = await Promise.all([
    Item.countDocuments(),
    Item.countDocuments({ "srs.dueAt": { $lte: now } }),
    Item.aggregate<{ _id: Kind; count: number }>([{ $group: { _id: "$kind", count: { $sum: 1 } } }]),
    // Lowest average ease first: the topics you keep getting wrong.
    Item.aggregate<TopicStat>([
      {
        $group: {
          _id: "$topic",
          count: { $sum: 1 },
          due: { $sum: { $cond: [{ $lte: ["$srs.dueAt", now] }, 1, 0] } },
          avgEase: { $avg: "$srs.ease" },
          lapses: { $sum: "$srs.lapses" },
        },
      },
      { $project: { _id: 0, topic: "$_id", count: 1, due: 1, avgEase: 1, lapses: 1 } },
      { $sort: { avgEase: 1, lapses: -1 } },
    ]),
    Review.aggregate<{ _id: string; count: number }>([
      { $match: { reviewedAt: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$reviewedAt" } },
          count: { $sum: 1 },
        },
      },
    ]),
    Interview.aggregate<{ count: number; completed: number; avgScore: number | null }>([
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
          avgScore: { $avg: "$feedback.overall_score" },
        },
      },
    ]),
  ]);

  const perDay = new Map(activity.map((a) => [a._id, a.count]));

  return {
    totalItems,
    dueNow,
    byKind: Object.fromEntries(byKind.map((k) => [k._id, k.count])) as Partial<Record<Kind, number>>,
    topics,
    reviewsToday: perDay.get(dayKey(now)) ?? 0,
    streak: currentStreak(perDay.keys(), now),
    activity: days.map((day) => ({ day, count: perDay.get(day) ?? 0 })),
    interviews: {
      count: interviewStats[0]?.count ?? 0,
      completed: interviewStats[0]?.completed ?? 0,
      avgScore: interviewStats[0]?.avgScore ?? null,
    },
  };
}

export async function getDueCount(): Promise<number> {
  await ready();
  return Item.countDocuments({ "srs.dueAt": { $lte: new Date() } });
}
