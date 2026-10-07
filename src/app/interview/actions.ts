"use server";

import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { isValidObjectId } from "mongoose";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AI_MODEL, describeAiError, fallbackParams, getClient, isAiEnabled } from "@/lib/ai/client";
import { RateLimitedError, clientKeyFrom, consumeAiQuota } from "@/lib/ai/limits";
import {
  FEEDBACK_SYSTEM_PROMPT,
  buildFeedbackRequest,
  buildInterviewerSystemPrompt,
  feedbackSchema,
  normaliseFeedback,
  type InterviewSubject,
} from "@/lib/ai/prompts";
import { connectDb } from "@/lib/db";
import { toPlainInterview } from "@/lib/interviews";
import { recordReview } from "@/lib/reviews";
import { GRADES, type Grade } from "@/lib/srs";
import { Interview } from "@/models/Interview";
import { Item } from "@/models/Item";

export interface ActionResult {
  error?: string;
}

/** Pick what to practise: the requested item, else something due, else the weakest item. */
async function chooseItem(itemId: string | null) {
  if (itemId && isValidObjectId(itemId)) {
    const item = await Item.findById(itemId).lean();
    if (item) return item;
  }
  const [due] = await Item.aggregate([{ $match: { "srs.dueAt": { $lte: new Date() } } }, { $sample: { size: 1 } }]);
  if (due) return due;
  return Item.findOne().sort({ "srs.ease": 1, "srs.lapses": -1 }).lean();
}

export async function startInterview(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  if (!isAiEnabled()) return { error: "AI features are turned off: set ANTHROPIC_API_KEY to enable them." };

  await connectDb();
  const item = await chooseItem((formData.get("itemId") as string | null) || null);
  if (!item) return { error: "Add some items to your library first." };

  const subject: InterviewSubject = {
    title: item.title,
    kind: item.kind,
    topic: item.topic,
    difficulty: item.difficulty ?? null,
    notes: item.notes ?? "",
  };
  const interview = await Interview.create({
    item: item._id,
    subject,
    model: AI_MODEL,
    // Frozen for the life of the interview so the conversation prefix never changes.
    system: buildInterviewerSystemPrompt(subject),
  });

  redirect(`/interview/${interview._id}`);
}

/** Form action for "Practise again": starts a fresh interview on the same item. */
export async function practiseAgain(formData: FormData) {
  const result = await startInterview({}, formData);
  // startInterview redirects on success; only errors reach here.
  if (result.error) redirect(`/interview?item=${formData.get("itemId") ?? ""}`);
}

export async function finishInterview(id: string): Promise<ActionResult> {
  if (!isValidObjectId(id)) return { error: "Interview not found" };
  await connectDb();
  const doc = await Interview.findById(id).lean();
  if (!doc) return { error: "Interview not found" };
  if (doc.status === "completed") return {};

  const interview = toPlainInterview(doc);
  if (interview.answerCount === 0) return { error: "Answer at least one question before ending." };

  try {
    await consumeAiQuota(clientKeyFrom(await headers()));
    const response = await getClient().beta.messages.parse({
      model: doc.model,
      max_tokens: 16000,
      system: FEEDBACK_SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildFeedbackRequest(interview.subject, interview.messages) }],
      output_config: { effort: "medium", format: betaZodOutputFormat(feedbackSchema) },
      ...fallbackParams(),
    });

    if (response.stop_reason === "refusal" || !response.parsed_output) {
      return { error: "Couldn't generate feedback for this interview. Try again." };
    }

    await Interview.updateOne(
      { _id: id },
      {
        status: "completed",
        feedback: normaliseFeedback(response.parsed_output),
        $inc: {
          "usage.inputTokens": response.usage.input_tokens,
          "usage.outputTokens": response.usage.output_tokens,
        },
      },
    );
  } catch (err) {
    if (err instanceof RateLimitedError) return { error: err.message };
    console.error("[interview feedback]", err);
    return { error: describeAiError(err).message };
  }

  revalidatePath(`/interview/${id}`);
  revalidatePath("/interview");
  return {};
}

/** Feed the interview result back into spaced repetition. */
export async function applyInterviewGrade(id: string, grade: Grade): Promise<ActionResult> {
  if (!isValidObjectId(id) || !GRADES.includes(grade)) return { error: "Invalid grade" };
  await connectDb();
  const interview = await Interview.findById(id, { item: 1, appliedGrade: 1, status: 1 }).lean();
  if (!interview || interview.status !== "completed") return { error: "Finish the interview first." };
  if (interview.appliedGrade) return {};
  if (!interview.item || !(await recordReview(String(interview.item), grade))) {
    return { error: "The library item for this interview no longer exists." };
  }
  await Interview.updateOne({ _id: id }, { appliedGrade: grade });
  revalidatePath("/", "layout");
  return {};
}

export async function deleteInterview(id: string) {
  if (!isValidObjectId(id)) return;
  await connectDb();
  await Interview.deleteOne({ _id: id });
  revalidatePath("/interview");
  redirect("/interview");
}
