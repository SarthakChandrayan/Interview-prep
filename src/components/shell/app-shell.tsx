import { BookMarked, Layers, LayoutDashboard, MessagesSquare, Plus } from "lucide-react";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense, type ReactNode } from "react";
import { isAiEnabled } from "@/lib/ai/client";
import { getDueCount } from "@/lib/data";
import { ThemeToggle } from "../theme";
import { ButtonLink } from "../ui";
import { MobileNav } from "./mobile-nav";
import { AccountMenu } from "./account-menu";
import { ActiveNavList, NavList, type NavItem } from "./nav-list";

function Brand() {
  return (
    <Link href="/" className="flex items-center gap-2.5 font-semibold tracking-tight">
      <span className="grid size-8 place-items-center rounded-[10px] bg-gradient-to-br from-accent to-[#a855f7] text-accent-foreground shadow-sm">
        <Layers className="size-4" />
      </span>
      <span className="text-[15px]">PrepDeck</span>
    </Link>
  );
}

async function DueBadge() {
  const due = await getDueCount();
  if (!due) return null;
  return (
    <span className="rounded-full bg-accent px-1.5 py-px text-[11px] font-semibold tabular-nums text-accent-foreground">
      {due > 99 ? "99+" : due}
    </span>
  );
}

async function AiStatus() {
  await connection();
  const on = isAiEnabled();
  return (
    <div className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs text-muted">
      <span className={on ? "size-1.5 rounded-full bg-success" : "size-1.5 rounded-full bg-subtle"} />
      {on ? "AI interviewer ready" : "AI interviewer off"}
    </div>
  );
}

const items: NavItem[] = [
  { href: "/", label: "Dashboard", icon: <LayoutDashboard /> },
  {
    href: "/review",
    label: "Review",
    icon: <Layers />,
    badge: (
      <Suspense>
        <DueBadge />
      </Suspense>
    ),
  },
  { href: "/interview", label: "Mock interview", icon: <MessagesSquare /> },
  { href: "/items", label: "Library", icon: <BookMarked /> },
];

function SidebarContent() {
  return (
    <div className="flex h-full flex-col gap-6 px-3 py-4">
      <div className="px-2 pt-1">
        <Brand />
      </div>
      <ButtonLink href="/items/new" variant="secondary" className="mx-1 justify-start">
        <Plus />
        New item
      </ButtonLink>
      <nav aria-label="Main">
        <Suspense fallback={<NavList items={items} pathname={null} />}>
          <ActiveNavList items={items} />
        </Suspense>
      </nav>
      <div className="mt-auto space-y-2">
        <Suspense>
          <AiStatus />
        </Suspense>
        <ThemeToggle className="mx-1" />
        <Suspense fallback={<div className="h-[54px] rounded-xl border border-border" />}>
          <AccountMenu />
        </Suspense>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh lg:pl-64">
      <a
        href="#main"
        className="sr-only z-50 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-accent-foreground focus:not-sr-only focus:fixed focus:left-3 focus:top-3"
      >
        Skip to content
      </a>
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-border bg-surface lg:block">
        <SidebarContent />
      </aside>
      <MobileNav brand={<Brand />}>
        <SidebarContent />
      </MobileNav>
      <main id="main" className="mx-auto w-full max-w-6xl px-4 pb-16 pt-6 sm:px-6 lg:px-10 lg:pt-10">
        {children}
      </main>
    </div>
  );
}
