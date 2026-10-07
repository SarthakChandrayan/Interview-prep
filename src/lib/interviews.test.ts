import { describe, expect, it } from "vitest";
import { toPlainInterview } from "./interviews";

const base = {
  _id: "abc",
  item: "item1",
  subject: { title: "Two Sum", kind: "problem", topic: "Arrays", difficulty: "easy", notes: "" },
  status: "active",
  feedback: null,
  appliedGrade: null,
  createdAt: new Date("2026-01-01"),
};

describe("toPlainInterview", () => {
  it("hides the kickoff turn and maps roles", () => {
    const iv = toPlainInterview({
      ...base,
      messages: [
        { role: "user", text: "", hidden: true },
        { role: "assistant", text: "Hi! How would you solve it?" },
        { role: "user", text: "Hash map." },
        { role: "assistant", text: "Complexity?" },
      ],
    });
    expect(iv.messages).toEqual([
      { role: "interviewer", text: "Hi! How would you solve it?" },
      { role: "candidate", text: "Hash map." },
      { role: "interviewer", text: "Complexity?" },
    ]);
    expect(iv.answerCount).toBe(1);
    expect(iv.awaitingReply).toBe(false);
  });

  it("flags a missing reply when the candidate spoke last", () => {
    const iv = toPlainInterview({
      ...base,
      messages: [
        { role: "user", text: "", hidden: true },
        { role: "assistant", text: "Question?" },
        { role: "user", text: "Answer." },
      ],
    });
    expect(iv.awaitingReply).toBe(true);
  });

  it("handles an interview that hasn't started", () => {
    const iv = toPlainInterview({ ...base, messages: [] });
    expect(iv.messages).toEqual([]);
    expect(iv.answerCount).toBe(0);
    expect(iv.usage).toEqual({ inputTokens: 0, outputTokens: 0 });
  });
});
