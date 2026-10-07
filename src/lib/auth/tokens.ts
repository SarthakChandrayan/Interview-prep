import { createHash, randomBytes } from "node:crypto";

/** A 256-bit random session token for the cookie. */
export function generateSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

/**
 * Sessions are stored under the SHA-256 of the token, so a database leak
 * doesn't hand out working session cookies.
 */
export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Only allow same-site relative paths as a post-login redirect target. */
export function safeRedirectPath(path: unknown, fallback = "/"): string {
  if (typeof path !== "string" || !path.startsWith("/") || path.startsWith("//") || path.startsWith("/\\")) {
    return fallback;
  }
  return path;
}
