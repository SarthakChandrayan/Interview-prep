import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./password";
import { generateSessionToken, hashSessionToken, safeRedirectPath } from "./tokens";
import { changePasswordSchema, loginSchema, signupSchema } from "./validation";

describe("password hashing", () => {
  it("verifies the right password and rejects the wrong one", async () => {
    const hash = await hashPassword("correct horse battery");
    expect(hash.startsWith("scrypt$")).toBe(true);
    expect(await verifyPassword("correct horse battery", hash)).toBe(true);
    expect(await verifyPassword("correct horse batterY", hash)).toBe(false);
  });

  it("salts each hash", async () => {
    expect(await hashPassword("same")).not.toBe(await hashPassword("same"));
  });

  it("rejects malformed stored hashes", async () => {
    expect(await verifyPassword("x", "garbage")).toBe(false);
    expect(await verifyPassword("x", "bcrypt$1$2$3$a$b")).toBe(false);
  });
});

describe("session tokens", () => {
  it("are random, URL-safe and hashed deterministically", () => {
    const a = generateSessionToken();
    expect(a).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(a).not.toBe(generateSessionToken());
    expect(hashSessionToken(a)).toBe(hashSessionToken(a));
    expect(hashSessionToken(a)).toMatch(/^[a-f0-9]{64}$/);
  });
});

describe("safeRedirectPath", () => {
  it("allows local paths only", () => {
    expect(safeRedirectPath("/review")).toBe("/review");
    expect(safeRedirectPath("//evil.com")).toBe("/");
    expect(safeRedirectPath("/\\evil.com")).toBe("/");
    expect(safeRedirectPath("https://evil.com")).toBe("/");
    expect(safeRedirectPath(null)).toBe("/");
  });
});

describe("auth validation", () => {
  it("normalises email and enforces password length", () => {
    const ok = signupSchema.safeParse({ name: " Ada ", email: " Ada@Example.COM ", password: "longenough" });
    expect(ok.data).toEqual({ name: "Ada", email: "ada@example.com", password: "longenough" });
    expect(signupSchema.safeParse({ name: "Ada", email: "ada@example.com", password: "short" }).success).toBe(false);
    expect(signupSchema.safeParse({ name: "Ada", email: "not-an-email", password: "longenough" }).success).toBe(false);
  });

  it("requires a password on login", () => {
    expect(loginSchema.safeParse({ email: "a@b.co", password: "" }).success).toBe(false);
  });

  it("rejects reusing the current password", () => {
    expect(changePasswordSchema.safeParse({ current: "samepassword", next: "samepassword" }).success).toBe(false);
  });
});
