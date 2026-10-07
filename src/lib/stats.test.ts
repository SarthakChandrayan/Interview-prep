import { describe, expect, it } from "vitest";
import { currentStreak, lastNDays } from "./stats";

const today = new Date("2026-03-10T15:00:00Z");

describe("currentStreak", () => {
  it("counts consecutive days ending today", () => {
    expect(currentStreak(["2026-03-10", "2026-03-09", "2026-03-08", "2026-03-06"], today)).toBe(3);
  });

  it("keeps yesterday's streak alive before today's first review", () => {
    expect(currentStreak(["2026-03-09", "2026-03-08"], today)).toBe(2);
  });

  it("is zero when the last review was two days ago", () => {
    expect(currentStreak(["2026-03-08"], today)).toBe(0);
  });

  it("is zero with no reviews", () => {
    expect(currentStreak([], today)).toBe(0);
  });
});

describe("lastNDays", () => {
  it("returns n day keys ending today, oldest first", () => {
    expect(lastNDays(3, today)).toEqual(["2026-03-08", "2026-03-09", "2026-03-10"]);
  });
});
