import { describe, expect, it } from "vitest";
import {
  buildFeedbackRequest,
  buildInterviewerSystemPrompt,
  normaliseFeedback,
  type InterviewSubject,
} from "./prompts";

const subject: InterviewSubject = {
  title: "Two Sum",
  kind: "problem",
  topic: "Arrays & Hashing",
  difficulty: "easy",
  notes: "Use a hash map of value to index.",
};

describe("buildInterviewerSystemPrompt", () => {
  it("includes the question and hides the notes in a reference block", () => {
    const p = buildInterviewerSystemPrompt(subject);
    expect(p).toContain("Question: Two Sum");
    expect(p).toContain("Topic: Arrays & Hashing (easy)");
    expect(p).toMatch(/<reference_notes>[\s\S]*hash map[\s\S]*<\/reference_notes>/);
    expect(p).toContain("coding interview");
  });

  it("omits the reference block when there are no notes", () => {
    expect(buildInterviewerSystemPrompt({ ...subject, notes: "  " })).not.toContain("<reference_notes>");
  });

  it("uses STAR guidance for behavioral questions", () => {
    expect(buildInterviewerSystemPrompt({ ...subject, kind: "behavioral" })).toContain("STAR");
  });

  it("is deterministic, so the prompt cache prefix stays stable", () => {
    expect(buildInterviewerSystemPrompt(subject)).toBe(buildInterviewerSystemPrompt(subject));
  });
});

describe("buildFeedbackRequest", () => {
  it("renders every turn with its speaker", () => {
    const req = buildFeedbackRequest(subject, [
      { role: "interviewer", text: "How would you solve it?" },
      { role: "candidate", text: "Hash map." },
    ]);
    expect(req).toContain('<turn speaker="interviewer">\nHow would you solve it?');
    expect(req).toContain('<turn speaker="candidate">\nHash map.');
  });
});

describe("normaliseFeedback", () => {
  it("clamps scores into 1-5", () => {
    const f = normaliseFeedback({
      overall_score: 9,
      summary: "",
      dimensions: [{ name: "x", score: 0, comment: "" }],
      strengths: [],
      improvements: [],
      model_answer: "",
      suggested_grade: "good",
    });
    expect(f.overall_score).toBe(5);
    expect(f.dimensions[0].score).toBe(1);
  });
});
