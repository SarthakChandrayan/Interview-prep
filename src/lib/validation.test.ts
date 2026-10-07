import { describe, expect, it } from "vitest";
import { parseItemForm } from "./validation";

function form(fields: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

const valid = {
  title: "Two Sum",
  kind: "problem",
  topic: "Arrays",
  difficulty: "easy",
  url: "https://leetcode.com/problems/two-sum/",
  notes: "",
  tags: "Hash Map, arrays, hash map",
};

describe("parseItemForm", () => {
  it("accepts a valid item and normalises tags", () => {
    const r = parseItemForm(form(valid));
    expect(r.success).toBe(true);
    expect(r.data?.tags).toEqual(["hash map", "arrays"]);
  });

  it("treats an empty difficulty as null", () => {
    const r = parseItemForm(form({ ...valid, difficulty: "" }));
    expect(r.data?.difficulty).toBeNull();
  });

  it("rejects a missing title and a malformed URL", () => {
    const r = parseItemForm(form({ ...valid, title: "  ", url: "leetcode" }));
    expect(r.success).toBe(false);
    const fields = r.error?.issues.map((i) => i.path[0]);
    expect(fields).toContain("title");
    expect(fields).toContain("url");
  });

  it("rejects an unknown kind", () => {
    expect(parseItemForm(form({ ...valid, kind: "trivia" })).success).toBe(false);
  });
});
