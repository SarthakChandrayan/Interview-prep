import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";
import { DIFFICULTIES, KINDS } from "@/lib/constants";
import { GRADES } from "@/lib/srs";

const messageSchema = new Schema(
  {
    role: { type: String, enum: ["user", "assistant"], required: true },
    // Exact content blocks sent to / returned by the API. Assistant turns are
    // replayed verbatim (thinking blocks included) so the history stays
    // append-only, which the API requires for thinking blocks to stay valid.
    content: { type: Schema.Types.Mixed, required: true },
    // Plain text for display. Empty for the hidden kickoff turn.
    text: { type: String, default: "" },
    hidden: { type: Boolean, default: false },
    createdAt: { type: Date, default: () => new Date() },
  },
  { _id: false },
);

const feedbackSchema = new Schema(
  {
    overall_score: Number,
    summary: String,
    dimensions: [{ _id: false, name: String, score: Number, comment: String }],
    strengths: [String],
    improvements: [String],
    model_answer: String,
    suggested_grade: { type: String, enum: GRADES },
  },
  { _id: false },
);

const interviewSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    item: { type: Schema.Types.ObjectId, ref: "Item", default: null, index: true },
    // Snapshot of the question, so editing or deleting the item later doesn't
    // change a past interview (or the frozen system prompt).
    subject: {
      title: { type: String, required: true },
      kind: { type: String, enum: KINDS, required: true },
      topic: { type: String, required: true },
      difficulty: { type: String, enum: [...DIFFICULTIES, null], default: null },
      notes: { type: String, default: "" },
    },
    model: { type: String, required: true },
    system: { type: String, required: true },
    messages: { type: [messageSchema], default: [] },
    status: { type: String, enum: ["active", "completed"], default: "active" },
    feedback: { type: feedbackSchema, default: null },
    appliedGrade: { type: String, enum: [...GRADES, null], default: null },
    usage: {
      inputTokens: { type: Number, default: 0 },
      outputTokens: { type: Number, default: 0 },
    },
    // Lock so two tabs can't stream into the same interview at once.
    busyUntil: { type: Date, default: null },
  },
  { timestamps: true },
);

interviewSchema.index({ user: 1, createdAt: -1 });

export type InterviewDoc = InferSchemaType<typeof interviewSchema>;

export const Interview: Model<InterviewDoc> = models.Interview ?? model("Interview", interviewSchema);
