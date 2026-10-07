import "server-only";
import { isValidObjectId } from "mongoose";
import { connectDb } from "@/lib/db";
import { GRADES, schedule, type Grade, type SrsState } from "@/lib/srs";
import { Item } from "@/models/Item";
import { Review } from "@/models/Review";

/** Grade an item: reschedule it and log the review. Returns false if the item is gone. */
export async function recordReview(itemId: string, grade: Grade): Promise<boolean> {
  if (!isValidObjectId(itemId) || !GRADES.includes(grade)) throw new Error("Invalid review");

  await connectDb();
  const item = await Item.findById(itemId);
  if (!item) return false;

  const now = new Date();
  const next = schedule(item.srs as unknown as SrsState, grade, now);
  item.set("srs", next);
  await Promise.all([
    item.save(),
    Review.create({ item: item._id, grade, intervalAfter: next.interval, reviewedAt: now }),
  ]);
  return true;
}
