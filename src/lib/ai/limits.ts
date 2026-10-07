import "server-only";
import { env } from "@/lib/env";
import { RateLimitedError, hit } from "@/lib/rate-limit";

export { RateLimitedError };

const DAY = 24 * 60 * 60 * 1000;

/**
 * Daily caps on AI calls: one per user and one for the whole app, so a public
 * deployment can't run up an unbounded bill. Throws when exceeded.
 */
export async function consumeAiQuota(userId: string) {
  const [globalOk, userOk] = await Promise.all([
    hit("ai:global", DAY, env.AI_DAILY_LIMIT),
    hit(`ai:user:${userId}`, DAY, env.AI_PER_USER_DAILY_LIMIT),
  ]);
  if (!globalOk) throw new RateLimitedError("The app's AI budget for today is used up. Try again tomorrow.");
  if (!userOk) throw new RateLimitedError("You've hit today's AI limit. Spaced-repetition reviews still work.");
}
