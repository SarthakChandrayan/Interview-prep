import { Schema, model, models, type Model } from "mongoose";

// Daily request counters for AI rate limiting. Documents expire after two days.
const usageCounterSchema = new Schema({
  key: { type: String, required: true },
  day: { type: String, required: true },
  count: { type: Number, default: 0 },
  createdAt: { type: Date, default: () => new Date(), expires: 60 * 60 * 48 },
});

usageCounterSchema.index({ key: 1, day: 1 }, { unique: true });

interface UsageCounterDoc {
  key: string;
  day: string;
  count: number;
  createdAt: Date;
}

export const UsageCounter: Model<UsageCounterDoc> =
  models.UsageCounter ?? model("UsageCounter", usageCounterSchema);
