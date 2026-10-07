/** Day keys are UTC dates formatted as YYYY-MM-DD, matching the Mongo aggregation. */
export function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Consecutive days with at least one review, ending today. If nothing has
 * been reviewed today yet the streak still counts from yesterday, so it
 * doesn't look broken first thing in the morning.
 */
export function currentStreak(activeDays: Iterable<string>, today: Date = new Date()): number {
  const days = new Set(activeDays);
  const cursor = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  if (!days.has(dayKey(cursor))) cursor.setUTCDate(cursor.getUTCDate() - 1);

  let streak = 0;
  while (days.has(dayKey(cursor))) {
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}

/** The last `n` day keys, oldest first, ending today. */
export function lastNDays(n: number, today: Date = new Date()): string[] {
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - i);
    out.push(dayKey(d));
  }
  return out;
}
