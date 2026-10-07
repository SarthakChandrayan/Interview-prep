import { z } from "zod";

export const PASSWORD_MIN = 8;

// Trim and lowercase before validating, so " Ada@Example.com " is accepted.
const email = z.string().trim().toLowerCase().max(254).pipe(z.email("Enter a valid email address"));
const password = z
  .string()
  .min(PASSWORD_MIN, `Use at least ${PASSWORD_MIN} characters`)
  .max(128, "Use at most 128 characters");
const name = z.string().trim().min(1, "Enter your name").max(60, "Keep it under 60 characters");

export const signupSchema = z.object({ name, email, password });
export const loginSchema = z.object({ email, password: z.string().min(1, "Enter your password").max(128) });
export const nameSchema = z.object({ name });
export const changePasswordSchema = z
  .object({ current: z.string().min(1, "Enter your current password"), next: password })
  .refine((v) => v.current !== v.next, { path: ["next"], message: "Choose a different password" });

export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) out[String(issue.path[0] ?? "form")] ??= issue.message;
  return out;
}
