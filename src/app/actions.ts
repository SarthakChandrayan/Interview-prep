"use server";

import { isValidObjectId } from "mongoose";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { connectDb } from "@/lib/db";
import { GRADES, initialSrs, schedule, type Grade, type SrsState } from "@/lib/srs";
import { parseItemForm } from "@/lib/validation";
import { Item } from "@/models/Item";
import { Review } from "@/models/Review";

export interface FormState {
  errors?: Record<string, string>;
  values?: Record<string, string>;
}

function formErrors(formData: FormData): FormState | { data: NonNullable<ReturnType<typeof parseItemForm>["data"]> } {
  const parsed = parseItemForm(formData);
  if (parsed.success) return { data: parsed.data };

  const errors: Record<string, string> = {};
  for (const issue of parsed.error.issues) {
    const key = String(issue.path[0] ?? "form");
    errors[key] ??= issue.message;
  }
  const values = Object.fromEntries(
    [...formData.entries()].filter(([k]) => !k.startsWith("$")).map(([k, v]) => [k, String(v)]),
  );
  return { errors, values };
}

export async function createItem(_prev: FormState, formData: FormData): Promise<FormState> {
  const result = formErrors(formData);
  if (!("data" in result)) return result;

  await connectDb();
  const item = await Item.create({ ...result.data, srs: initialSrs() });

  revalidatePath("/", "layout");
  if (formData.get("intent") === "another") {
    // Keep kind/topic so adding a batch of problems on one topic is quick.
    return { values: { kind: result.data.kind, topic: result.data.topic } };
  }
  redirect(`/items/${item._id}`);
}

export async function updateItem(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  if (!isValidObjectId(id)) return { errors: { form: "Item not found" } };
  const result = formErrors(formData);
  if (!("data" in result)) return result;

  await connectDb();
  const updated = await Item.findByIdAndUpdate(id, result.data);
  if (!updated) return { errors: { form: "Item not found" } };

  revalidatePath("/", "layout");
  redirect(`/items/${id}`);
}

export async function deleteItem(id: string) {
  if (!isValidObjectId(id)) return;
  await connectDb();
  await Promise.all([Item.findByIdAndDelete(id), Review.deleteMany({ item: id })]);
  revalidatePath("/", "layout");
  redirect("/items");
}

export async function resetItemProgress(id: string) {
  if (!isValidObjectId(id)) return;
  await connectDb();
  await Promise.all([
    Item.findByIdAndUpdate(id, { srs: initialSrs() }),
    Review.deleteMany({ item: id }),
  ]);
  revalidatePath("/", "layout");
}

export async function reviewItem(id: string, grade: Grade) {
  if (!isValidObjectId(id) || !GRADES.includes(grade)) throw new Error("Invalid review");

  await connectDb();
  const item = await Item.findById(id);
  if (!item) throw new Error("Item not found");

  const now = new Date();
  const next = schedule(item.srs as unknown as SrsState, grade, now);
  item.set("srs", next);
  await Promise.all([
    item.save(),
    Review.create({ item: item._id, grade, intervalAfter: next.interval, reviewedAt: now }),
  ]);

  revalidatePath("/", "layout");
}

export async function importStarterPack() {
  const { STARTER_PACK } = await import("@/lib/starter-pack");
  await connectDb();
  const existing = new Set(await Item.distinct("title"));
  const fresh = STARTER_PACK.filter((s) => !existing.has(s.title));
  if (fresh.length) {
    await Item.insertMany(fresh.map((s) => ({ ...s, srs: initialSrs() })));
  }
  revalidatePath("/", "layout");
}
