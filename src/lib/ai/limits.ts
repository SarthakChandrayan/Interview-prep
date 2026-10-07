import "server-only";
import { dayKey } from "@/lib/stats";
import { env } from "@/lib/env";
import { UsageCounter } from "@/models/UsageCounter";

export class RateLimitedError extends Error {}

async function bump(key: string, day: string) {
  const doc = await UsageCounter.findOneAndUpdate(
    { key, day },
    { $inc: { count: 1 } },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
  );
  return doc.count;
}

/**
 * Daily caps on AI calls: one per client (by IP) and one for the whole app,
 * so a public demo can't run up an unbounded bill. Throws when exceeded.
 */
export async function consumeAiQuota(clientKey: string) {
  const day = dayKey(new Date());
  const [global, perClient] = await Promise.all([bump("global", day), bump(`client:${clientKey}`, day)]);
  if (global > env.AI_DAILY_LIMIT) {
    throw new RateLimitedError("The app's AI budget for today is used up. Try again tomorrow.");
  }
  if (perClient > env.AI_PER_CLIENT_DAILY_LIMIT) {
    throw new RateLimitedError("You've hit today's AI limit. Spaced-repetition reviews still work.");
  }
}

export function clientKeyFrom(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || headers.get("x-real-ip") || "local";
}
