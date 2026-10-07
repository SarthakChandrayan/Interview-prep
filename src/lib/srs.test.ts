import { describe, expect, it } from "vitest";
import { MIN_EASE, formatInterval, initialSrs, previewIntervals, schedule } from "./srs";

const now = new Date("2026-01-01T00:00:00Z");
const DAY = 24 * 60 * 60 * 1000;

describe("schedule", () => {
  it("starts a new item due immediately", () => {
    const s = initialSrs(now);
    expect(s.dueAt).toEqual(now);
    expect(s.reps).toBe(0);
  });

  it("follows the 1 → 3 → interval×ease ladder on 'good'", () => {
    let s = initialSrs(now);
    s = schedule(s, "good", now);
    expect(s.interval).toBe(1);
    s = schedule(s, "good", now);
    expect(s.interval).toBe(3);
    s = schedule(s, "good", now);
    expect(s.interval).toBe(Math.round(3 * 2.5));
    expect(s.dueAt.getTime() - now.getTime()).toBe(s.interval * DAY);
  });

  it("resets progress and counts a lapse on 'again'", () => {
    let s = initialSrs(now);
    s = schedule(schedule(schedule(s, "good", now), "good", now), "good", now);
    s = schedule(s, "again", now);
    expect(s.interval).toBe(1);
    expect(s.reps).toBe(0);
    expect(s.lapses).toBe(1);
    expect(s.ease).toBe(2.3);
  });

  it("never drops ease below the minimum", () => {
    let s = initialSrs(now);
    for (let i = 0; i < 20; i++) s = schedule(s, "again", now);
    expect(s.ease).toBe(MIN_EASE);
  });

  it("grows faster on 'easy' than 'good'", () => {
    const base = schedule(schedule(initialSrs(now), "good", now), "good", now);
    const p = previewIntervals(base, now);
    expect(p.easy).toBeGreaterThan(p.good);
    expect(p.good).toBeGreaterThan(p.hard);
    expect(p.hard).toBeGreaterThanOrEqual(p.again);
  });

  it("records when the item was reviewed", () => {
    expect(schedule(initialSrs(now), "hard", now).lastReviewedAt).toEqual(now);
  });
});

describe("formatInterval", () => {
  it("formats days, months and years", () => {
    expect(formatInterval(0)).toBe("now");
    expect(formatInterval(1)).toBe("1 day");
    expect(formatInterval(12)).toBe("12 days");
    expect(formatInterval(90)).toBe("3 mo");
    expect(formatInterval(730)).toBe("2.0 yr");
  });
});
