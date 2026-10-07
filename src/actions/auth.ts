"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getDummyHash, hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSession, destroyAllSessions, destroySession, requireUser, SESSION_COOKIE } from "@/lib/auth/session";
import { safeRedirectPath } from "@/lib/auth/tokens";
import { changePasswordSchema, fieldErrors, loginSchema, nameSchema, signupSchema } from "@/lib/auth/validation";
import { connectDb } from "@/lib/db";
import { clientIp, hit } from "@/lib/rate-limit";
import { Interview } from "@/models/Interview";
import { Item } from "@/models/Item";
import { Review } from "@/models/Review";
import { User } from "@/models/User";

export interface AuthFormState {
  errors?: Record<string, string>;
  values?: Record<string, string>;
  success?: string;
}

const MINUTE = 60 * 1000;
const TOO_MANY = "Too many attempts. Wait a few minutes and try again.";

function field(formData: FormData, name: string) {
  const v = formData.get(name);
  return typeof v === "string" ? v : "";
}

export async function signup(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const values = { name: field(formData, "name"), email: field(formData, "email") };
  const parsed = signupSchema.safeParse({ ...values, password: field(formData, "password") });
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };

  await connectDb();
  if (!(await hit(`signup:ip:${clientIp(await headers())}`, 60 * MINUTE, 10))) {
    return { errors: { form: TOO_MANY }, values };
  }

  const { name, email, password } = parsed.data;
  if (await User.exists({ email })) {
    return { errors: { email: "An account with this email already exists. Try signing in." }, values };
  }

  const isFirstUser = (await User.estimatedDocumentCount()) === 0;
  let user;
  try {
    user = await User.create({ name, email, passwordHash: await hashPassword(password) });
  } catch (err) {
    // Lost a race with a concurrent signup for the same email.
    if ((err as { code?: number }).code === 11000) {
      return { errors: { email: "An account with this email already exists. Try signing in." }, values };
    }
    throw err;
  }

  // Data created before accounts existed belongs to whoever signs up first.
  if (isFirstUser) {
    const orphan = { user: { $exists: false } };
    await Promise.all([
      Item.updateMany(orphan, { $set: { user: user._id } }),
      Review.updateMany(orphan, { $set: { user: user._id } }),
      Interview.updateMany(orphan, { $set: { user: user._id } }),
    ]);
  }

  await createSession(String(user._id));
  redirect("/");
}

export async function login(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const values = { email: field(formData, "email") };
  const parsed = loginSchema.safeParse({ ...values, password: field(formData, "password") });
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };
  const { email, password } = parsed.data;

  await connectDb();
  const ip = clientIp(await headers());
  const [ipOk, emailOk] = await Promise.all([
    hit(`login:ip:${ip}`, 15 * MINUTE, 30),
    hit(`login:email:${email}`, 15 * MINUTE, 10),
  ]);
  if (!ipOk || !emailOk) return { errors: { form: TOO_MANY }, values };

  const user = await User.findOne({ email });
  // Always run a hash comparison so timing doesn't reveal whether the email exists.
  const valid = await verifyPassword(password, user?.passwordHash ?? (await getDummyHash()));
  if (!user || !valid) return { errors: { form: "Incorrect email or password." }, values };

  await createSession(String(user._id));
  redirect(safeRedirectPath(field(formData, "next")));
}

export async function logout() {
  await destroySession();
  redirect("/login");
}

export async function updateName(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const user = await requireUser();
  const parsed = nameSchema.safeParse({ name: field(formData, "name") });
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  await connectDb();
  await User.updateOne({ _id: user.id }, { name: parsed.data.name });
  revalidatePath("/", "layout");
  return { success: "Name updated." };
}

export async function changePassword(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const sessionUser = await requireUser();
  const parsed = changePasswordSchema.safeParse({ current: field(formData, "current"), next: field(formData, "next") });
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };

  await connectDb();
  if (!(await hit(`password:user:${sessionUser.id}`, 15 * MINUTE, 10))) return { errors: { form: TOO_MANY } };
  const user = await User.findById(sessionUser.id);
  if (!user || !(await verifyPassword(parsed.data.current, user.passwordHash))) {
    return { errors: { current: "That's not your current password." } };
  }

  user.passwordHash = await hashPassword(parsed.data.next);
  await user.save();
  // Sign out every other device, then start a fresh session here.
  await destroyAllSessions(sessionUser.id);
  await createSession(sessionUser.id);
  return { success: "Password changed. Other devices have been signed out." };
}

export async function deleteAccount(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const sessionUser = await requireUser();
  await connectDb();
  if (!(await hit(`password:user:${sessionUser.id}`, 15 * MINUTE, 10))) return { errors: { password: TOO_MANY } };
  const user = await User.findById(sessionUser.id);
  if (!user || !(await verifyPassword(field(formData, "password"), user.passwordHash))) {
    return { errors: { password: "Incorrect password." } };
  }

  const owned = { user: user._id };
  await Promise.all([Item.deleteMany(owned), Review.deleteMany(owned), Interview.deleteMany(owned)]);
  await destroyAllSessions(sessionUser.id);
  await User.deleteOne({ _id: user._id });
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/signup");
}
