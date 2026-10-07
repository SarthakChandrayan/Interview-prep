/**
 * Spaced-repetition scheduling, a simplified SM-2 (the algorithm behind Anki).
 *
 * Each item carries an ease factor and a current interval. Grading a review
 * moves the item's next due date further out when you remember it, and pulls
 * it back in when you don't.
 */

export const GRADES = ["again", "hard", "good", "easy"] as const;
export type Grade = (typeof GRADES)[number];

export interface SrsState {
  /** Multiplier applied to the interval on a successful review. */
  ease: number;
  /** Days until the next review. 0 means the item has never been reviewed. */
  interval: number;
  /** Consecutive successful reviews. */
  reps: number;
  /** Total number of times the item was forgotten ("again"). */
  lapses: number;
  dueAt: Date;
  lastReviewedAt: Date | null;
}

export const MIN_EASE = 1.3;
export const DEFAULT_EASE = 2.5;
const DAY_MS = 24 * 60 * 60 * 1000;

export function initialSrs(now: Date = new Date()): SrsState {
  return {
    ease: DEFAULT_EASE,
    interval: 0,
    reps: 0,
    lapses: 0,
    dueAt: now,
    lastReviewedAt: null,
  };
}

export function schedule(state: SrsState, grade: Grade, now: Date = new Date()): SrsState {
  let { ease, interval, reps, lapses } = state;

  switch (grade) {
    case "again":
      ease -= 0.2;
      interval = 1;
      reps = 0;
      lapses += 1;
      break;
    case "hard":
      ease -= 0.15;
      interval = Math.max(1, Math.round(interval * 1.2));
      reps += 1;
      break;
    case "good":
      interval = reps === 0 ? 1 : reps === 1 ? 3 : Math.round(interval * ease);
      reps += 1;
      break;
    case "easy":
      interval = reps === 0 ? 3 : Math.round(Math.max(interval, 1) * ease * 1.3);
      ease += 0.15;
      reps += 1;
      break;
  }

  ease = Math.max(MIN_EASE, Math.round(ease * 100) / 100);

  return {
    ease,
    interval,
    reps,
    lapses,
    dueAt: new Date(now.getTime() + interval * DAY_MS),
    lastReviewedAt: now,
  };
}

/** Preview the interval each grade would produce, shown on the review buttons. */
export function previewIntervals(state: SrsState, now: Date = new Date()): Record<Grade, number> {
  return Object.fromEntries(GRADES.map((g) => [g, schedule(state, g, now).interval])) as Record<
    Grade,
    number
  >;
}

export function formatInterval(days: number): string {
  if (days < 1) return "now";
  if (days === 1) return "1 day";
  if (days < 30) return `${days} days`;
  if (days < 365) return `${Math.round(days / 30)} mo`;
  return `${(days / 365).toFixed(1)} yr`;
}
