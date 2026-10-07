import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";
import { DIFFICULTIES, KINDS } from "@/lib/constants";
import { DEFAULT_EASE } from "@/lib/srs";

const srsSchema = new Schema(
  {
    ease: { type: Number, default: DEFAULT_EASE },
    interval: { type: Number, default: 0 },
    reps: { type: Number, default: 0 },
    lapses: { type: Number, default: 0 },
    dueAt: { type: Date, default: () => new Date() },
    lastReviewedAt: { type: Date, default: null },
  },
  { _id: false },
);

const itemSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    kind: { type: String, enum: KINDS, required: true },
    topic: { type: String, required: true, trim: true, maxlength: 60 },
    difficulty: { type: String, enum: [...DIFFICULTIES, null], default: null },
    url: { type: String, trim: true, default: "" },
    notes: { type: String, default: "", maxlength: 20_000 },
    tags: { type: [String], default: [] },
    srs: { type: srsSchema, default: () => ({}) },
  },
  { timestamps: true },
);

// The review queue reads "this user's items due before now, oldest first".
itemSchema.index({ user: 1, "srs.dueAt": 1 });
itemSchema.index({ user: 1, kind: 1, topic: 1 });

export type ItemDoc = InferSchemaType<typeof itemSchema>;

export const Item: Model<ItemDoc> = models.Item ?? model("Item", itemSchema);
