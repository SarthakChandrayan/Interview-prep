"use server";

import { isValidObjectId } from "mongoose";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { connectDb } from "@/lib/db";
import { recordReview } from "@/lib/reviews";
import { initialSrs, type Grade } from "@/lib/srs";
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

// Server Actions are public HTTP endpoints: every one re-checks the session and
// only touches documents owned by the signed-in user.

export async function createItem(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const result = formErrors(formData);
  if (!("data" in result)) return result;

  await connectDb();
  const item = await Item.create({ ...result.data, user: user.id, srs: initialSrs() });

  revalidatePath("/", "layout");
  if (formData.get("intent") === "another") {
    // Keep kind/topic so adding a batch of problems on one topic is quick.
    return { values: { kind: result.data.kind, topic: result.data.topic } };
  }
  redirect(`/items/${item._id}`);
}

export async function updateItem(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  if (!isValidObjectId(id)) return { errors: { form: "Item not found" } };
  const result = formErrors(formData);
  if (!("data" in result)) return result;

  await connectDb();
  const updated = await Item.findOneAndUpdate({ _id: id, user: user.id }, result.data);
  if (!updated) return { errors: { form: "Item not found" } };

  revalidatePath("/", "layout");
  redirect(`/items/${id}`);
}

export async function deleteItem(id: string) {
  const user = await requireUser();
  if (!isValidObjectId(id)) return;
  await connectDb();
  const deleted = await Item.findOneAndDelete({ _id: id, user: user.id });
  if (deleted) await Review.deleteMany({ item: id, user: user.id });
  revalidatePath("/", "layout");
  redirect("/items");
}

export async function resetItemProgress(id: string) {
  const user = await requireUser();
  if (!isValidObjectId(id)) return;
  await connectDb();
  const updated = await Item.findOneAndUpdate({ _id: id, user: user.id }, { srs: initialSrs() });
  if (updated) await Review.deleteMany({ item: id, user: user.id });
  revalidatePath("/", "layout");
}

export async function reviewItem(id: string, grade: Grade) {
  const user = await requireUser();
  if (!(await recordReview(user.id, id, grade))) throw new Error("Item not found");
  revalidatePath("/", "layout");
}

export async function importStarterPack() {
  const user = await requireUser();
  const { STARTER_PACK } = await import("@/lib/starter-pack");
  await connectDb();
  const existing = new Set(await Item.distinct("title", { user: user.id }));
  const fresh = STARTER_PACK.filter((s) => !existing.has(s.title));
  if (fresh.length) {
    await Item.insertMany(fresh.map((s) => ({ ...s, user: user.id, srs: initialSrs() })));
  }
  revalidatePath("/", "layout");
}
