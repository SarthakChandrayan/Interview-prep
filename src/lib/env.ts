import "server-only";
import { z } from "zod";

// Validated once at startup so a misconfigured deploy fails loudly with a
// readable message instead of a cryptic runtime error deep in a request.
const schema = z.object({
  MONGODB_URI: z.string().min(1).default("mongodb://127.0.0.1:27017/interview-prep"),
  ANTHROPIC_API_KEY: z.string().optional(),
  ANTHROPIC_MODEL: z.string().min(1).default("claude-sonnet-5-5"),
  AI_DAILY_LIMIT: z.coerce.number().int().positive().default(300),
  AI_PER_USER_DAILY_LIMIT: z.coerce.number().int().positive().default(60),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  throw new Error(
    `Invalid environment configuration:\n${parsed.error.issues
      .map((i) => `  ${i.path.join(".")}: ${i.message}`)
      .join("\n")}`,
  );
}

export const env = parsed.data;
