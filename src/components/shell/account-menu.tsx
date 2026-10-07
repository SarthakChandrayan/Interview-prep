import { LogOut, Settings } from "lucide-react";
import Link from "next/link";
import { logout } from "@/actions/auth";
import { requireUser } from "@/lib/auth/session";

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}

/** The signed-in user's card at the bottom of the sidebar. Reads the session. */
export async function AccountMenu() {
  const user = await requireUser();
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-border bg-surface p-2">
      <Link href="/account" className="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg p-1 hover:bg-surface-muted" title="Account settings">
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-accent-soft text-xs font-semibold text-accent-soft-foreground">
          {initials(user.name)}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium">{user.name}</span>
          <span className="block truncate text-xs text-subtle">{user.email}</span>
        </span>
        <Settings className="ml-auto size-4 shrink-0 text-subtle" />
      </Link>
      <form action={logout}>
        <button
          type="submit"
          aria-label="Sign out"
          title="Sign out"
          className="grid size-8 place-items-center rounded-lg text-subtle hover:bg-surface-muted hover:text-foreground"
        >
          <LogOut className="size-4" />
        </button>
      </form>
    </div>
  );
}
