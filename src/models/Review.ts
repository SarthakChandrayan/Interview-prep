import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";
import { GRADES } from "@/lib/srs";

// One document per review, kept separately from items so history can grow
// without bloating the item documents. Powers streaks and activity stats.
const reviewSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  item: { type: Schema.Types.ObjectId, ref: "Item", required: true, index: true },
  grade: { type: String, enum: GRADES, required: true },
  intervalAfter: { type: Number, required: true },
  reviewedAt: { type: Date, required: true, default: () => new Date() },
});

// Streak and heatmap queries read one user's reviews by date.
reviewSchema.index({ user: 1, reviewedAt: -1 });

export type ReviewDoc = InferSchemaType<typeof reviewSchema>;

export const Review: Model<ReviewDoc> = models.Review ?? model("Review", reviewSchema);
