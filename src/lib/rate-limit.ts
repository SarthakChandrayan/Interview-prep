import "server-only";
import { UsageCounter } from "@/models/UsageCounter";

export class RateLimitedError extends Error {}

/**
 * Fixed-window counter in MongoDB: counts a hit for `key` in the current
 * window and reports whether it's still within `limit`.
 */
export async function hit(key: string, windowMs: number, limit: number): Promise<boolean> {
  const window = String(Math.floor(Date.now() / windowMs));
  const doc = await UsageCounter.findOneAndUpdate(
    { key, day: window },
    { $inc: { count: 1 } },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
  );
  return doc.count <= limit;
}

export function clientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || headers.get("x-real-ip") || "local";
}
