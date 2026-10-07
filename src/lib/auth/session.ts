import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { connectDb } from "@/lib/db";
import { Session } from "@/models/Session";
import { User } from "@/models/User";
import { generateSessionToken, hashSessionToken } from "./tokens";

export const SESSION_COOKIE = "prepdeck_session";
const SESSION_DAYS = 30;
const DAY = 24 * 60 * 60 * 1000;

export interface SessionUser {
  id: string;
  email: string;
  name: string;
}

function cookieOptions(expires: Date) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    expires,
  };
}

/** Start a session and set its cookie. Call from a Server Action or Route Handler. */
export async function createSession(userId: string) {
  await connectDb();
  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * DAY);
  await Session.create({ _id: hashSessionToken(token), user: userId, expiresAt });
  (await cookies()).set(SESSION_COOKIE, token, cookieOptions(expiresAt));
}

/** End the current session and clear its cookie. */
export async function destroySession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    await connectDb();
    await Session.deleteOne({ _id: hashSessionToken(token) });
  }
  store.delete(SESSION_COOKIE);
}

export async function destroyAllSessions(userId: string) {
  await connectDb();
  await Session.deleteMany({ user: userId });
}

/**
 * The signed-in user, or null. Reads the cookie, so callers must be inside a
 * <Suspense> boundary (or a Server Action / Route Handler). Memoised per request.
 */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  await connectDb();
  const id = hashSessionToken(token);
  const session = await Session.findById(id).lean();
  const now = Date.now();
  if (!session || session.expiresAt.getTime() <= now) return null;

  // Sliding expiry: active users stay signed in. The proxy refreshes the cookie.
  if (session.expiresAt.getTime() - now < (SESSION_DAYS / 2) * DAY) {
    await Session.updateOne({ _id: id }, { expiresAt: new Date(now + SESSION_DAYS * DAY) });
  }

  const user = await User.findById(session.user, { email: 1, name: 1 }).lean();
  return user ? { id: String(user._id), email: user.email, name: user.name } : null;
});

/** The signed-in user, or a redirect to the login page. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}
