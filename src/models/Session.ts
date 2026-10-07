import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

// _id is the SHA-256 of the cookie token (see lib/auth/tokens.ts).
const sessionSchema = new Schema(
  {
    _id: { type: String, required: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    // MongoDB deletes the document once this time passes.
    expiresAt: { type: Date, required: true, expires: 0 },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export type SessionDoc = InferSchemaType<typeof sessionSchema>;

export const Session: Model<SessionDoc> = models.Session ?? model("Session", sessionSchema);
