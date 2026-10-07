import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { signup } from "@/actions/auth";
import { AuthForm } from "@/components/auth/auth-form";
import { Skeleton } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth/session";
import { PASSWORD_MIN } from "@/lib/auth/validation";

export const metadata: Metadata = { title: "Create account" };

export default function SignupPage() {
  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Create your account</h1>
      <p className="mt-1.5 text-sm text-muted">Free, and your deck stays private to you.</p>
      <div className="mt-8">
        <Suspense fallback={<Skeleton className="h-80" />}>
          <SignupForm />
        </Suspense>
      </div>
      <p className="mt-6 text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-accent hover:underline">
          Sign in
        </Link>
      </p>
    </>
  );
}

async function SignupForm() {
  // Already signed in (the cookie can outlive the proxy's optimistic check).
  if (await getCurrentUser()) redirect("/");
  return (
    <AuthForm
      action={signup}
      submitLabel="Create account"
      pendingLabel="Creating account…"
      fields={[
        { name: "name", label: "Name", type: "text", autoComplete: "name" },
        { name: "email", label: "Email", type: "email", autoComplete: "email" },
        {
          name: "password",
          label: "Password",
          type: "password",
          autoComplete: "new-password",
          hint: `At least ${PASSWORD_MIN} characters`,
        },
      ]}
    />
  );
}
