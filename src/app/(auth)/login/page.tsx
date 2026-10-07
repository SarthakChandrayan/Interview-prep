import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { login } from "@/actions/auth";
import { AuthForm } from "@/components/auth/auth-form";
import { Skeleton } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth/session";
import { safeRedirectPath } from "@/lib/auth/tokens";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
      <p className="mt-1.5 text-sm text-muted">Sign in to keep your streak going.</p>
      <div className="mt-8">
        <Suspense fallback={<Skeleton className="h-64" />}>
          <LoginForm searchParams={searchParams} />
        </Suspense>
      </div>
      <p className="mt-6 text-center text-sm text-muted">
        New here?{" "}
        <Link href="/signup" className="font-medium text-accent hover:underline">
          Create an account
        </Link>
      </p>
    </>
  );
}

async function LoginForm({ searchParams }: Pick<PageProps<"/login">, "searchParams">) {
  const { next } = await searchParams;
  // Already signed in (the cookie can outlive the proxy's optimistic check).
  if (await getCurrentUser()) redirect(safeRedirectPath(next));
  return (
    <AuthForm
      action={login}
      submitLabel="Sign in"
      pendingLabel="Signing in…"
      hidden={{ next: safeRedirectPath(next) }}
      fields={[
        { name: "email", label: "Email", type: "email", autoComplete: "email" },
        { name: "password", label: "Password", type: "password", autoComplete: "current-password" },
      ]}
    />
  );
}
