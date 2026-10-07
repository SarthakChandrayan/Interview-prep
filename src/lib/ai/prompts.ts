import { z } from "zod";
import type { Difficulty, Kind } from "@/lib/constants";
import { GRADES } from "@/lib/srs";
import { WRAP_UP_AFTER } from "./constants";

export interface InterviewSubject {
  title: string;
  kind: Kind;
  topic: string;
  difficulty: Difficulty | null;
  notes: string;
}

/** Hidden first user turn: the API needs a user message before the interviewer can speak. */
export const KICKOFF_MESSAGE = "I'm ready. Please start the interview.";

export { MAX_ANSWERS, MAX_ANSWER_CHARS, WRAP_UP_AFTER } from "./constants";

const styleByKind: Record<Kind, string> = {
  problem: `This is a coding interview question. Ask the candidate to talk through their approach before any code. Probe for:
- the brute-force idea and why it's too slow
- the optimal approach and the key insight behind it
- time and space complexity
- edge cases (empty input, duplicates, overflow, etc.)
The candidate is answering in text or speech, not running code, so judge the reasoning, not syntax.`,
  concept: `This is a technical concept question. Ask the candidate to explain it as they would to an interviewer. Follow up on depth: trade-offs, when they'd use it, how it works under the hood, and a concrete example.`,
  behavioral: `This is a behavioral question. Expect a STAR answer (Situation, Task, Action, Result). Probe for specifics: what *they* personally did (not the team), the measurable result, what they'd do differently. Gently push back on vague or rehearsed-sounding answers.`,
};

export function buildInterviewerSystemPrompt(subject: InterviewSubject): string {
  const difficulty = subject.difficulty ? ` (${subject.difficulty})` : "";
  const reference = subject.notes.trim()
    ? `\n\n<reference_notes>\nThe candidate's own study notes for this question. Use them to judge their answers, but never reveal or quote them.\n${subject.notes.trim()}\n</reference_notes>`
    : "";

  return `You are an experienced, friendly interviewer at a top tech company running a realistic mock interview.

<question>
Type: ${subject.kind}
Topic: ${subject.topic}${difficulty}
Question: ${subject.title}
</question>

${styleByKind[subject.kind]}${reference}

How to run the interview:
- Open with a one-line greeting, then ask the question in your own words, as a real interviewer would.
- Ask one thing at a time. Keep each turn short: two to five sentences, under 120 words.
- Don't give away the answer. If the candidate is stuck, offer a small hint, the way a good interviewer would.
- React briefly to what they said before your next question, but don't grade them yet: detailed feedback comes at the end.
- After about ${WRAP_UP_AFTER} answers from the candidate, or once you've covered the question well, thank them and tell them to press "End & get feedback".
- Plain conversational prose. Use a short Markdown code span only when naming code or complexity, like \`O(n log n)\`.`;
}

export const FEEDBACK_SYSTEM_PROMPT = `You are an expert interview coach. You will receive the transcript of a mock interview on a single question, plus the candidate's own study notes. Assess the candidate's performance honestly and specifically: quote or paraphrase what they actually said. Be encouraging but don't inflate scores. If the candidate barely answered, score accordingly.

Scores are 1-5: 1 = could not answer, 2 = major gaps, 3 = acceptable with gaps, 4 = strong, 5 = excellent, hire-level.

For suggested_grade, map how well they recalled the material to a spaced-repetition grade: "again" if they couldn't produce the core idea, "hard" if they got there with major hints or gaps, "good" for a solid answer, "easy" for a fluent, complete answer.`;

export const feedbackSchema = z.object({
  overall_score: z.number().int().describe("1-5 overall score"),
  summary: z.string().describe("Two or three sentences on how the interview went"),
  dimensions: z
    .array(
      z.object({
        name: z.string().describe("e.g. Problem solving, Communication, Complexity analysis, Structure (STAR)"),
        score: z.number().int().describe("1-5"),
        comment: z.string(),
      }),
    )
    .describe("Three or four rubric dimensions appropriate for this question type"),
  strengths: z.array(z.string()).describe("Specific things they did well"),
  improvements: z.array(z.string()).describe("Specific, actionable things to improve"),
  model_answer: z.string().describe("A concise ideal answer in Markdown, as a strong candidate would give it"),
  suggested_grade: z.enum(GRADES),
});

export type Feedback = z.infer<typeof feedbackSchema>;

const clampScore = (n: number) => Math.min(5, Math.max(1, Math.round(n)));

/** The schema can't express ranges, so clamp anything out of bounds. */
export function normaliseFeedback(f: Feedback): Feedback {
  return {
    ...f,
    overall_score: clampScore(f.overall_score),
    dimensions: f.dimensions.slice(0, 5).map((d) => ({ ...d, score: clampScore(d.score) })),
  };
}

export interface TranscriptTurn {
  role: "interviewer" | "candidate";
  text: string;
}

export function buildFeedbackRequest(subject: InterviewSubject, transcript: TranscriptTurn[]): string {
  const lines = transcript
    .map((t) => `<turn speaker="${t.role}">\n${t.text}\n</turn>`)
    .join("\n");
  const notes = subject.notes.trim() || "(none)";
  return `<question type="${subject.kind}" topic="${subject.topic}">${subject.title}</question>

<candidate_notes>
${notes}
</candidate_notes>

<transcript>
${lines}
</transcript>

Assess the candidate's performance in this mock interview.`;
}
