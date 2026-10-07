import { z } from "zod";
import { DIFFICULTIES, KINDS } from "@/lib/constants";

const optionalUrl = z
  .string()
  .trim()
  .refine((v) => v === "" || URL.canParse(v), "Enter a full URL, like https://leetcode.com/...");

export const itemInputSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  kind: z.enum(KINDS),
  topic: z.string().trim().min(1, "Topic is required").max(60),
  difficulty: z
    .enum([...DIFFICULTIES, ""])
    .transform((v) => (v === "" ? null : v)),
  url: optionalUrl,
  notes: z.string().max(20_000),
  tags: z
    .string()
    .transform((v) =>
      [...new Set(v.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean))].slice(0, 20),
    ),
});

export type ItemInput = z.output<typeof itemInputSchema>;

export function parseItemForm(formData: FormData) {
  return itemInputSchema.safeParse({
    title: formData.get("title") ?? "",
    kind: formData.get("kind") ?? "",
    topic: formData.get("topic") ?? "",
    difficulty: formData.get("difficulty") ?? "",
    url: formData.get("url") ?? "",
    notes: formData.get("notes") ?? "",
    tags: formData.get("tags") ?? "",
  });
}
