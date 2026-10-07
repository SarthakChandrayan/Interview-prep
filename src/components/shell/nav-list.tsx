"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { cn } from "../ui";

export interface NavItem {
  href: string;
  label: string;
  icon: ReactNode;
  badge?: ReactNode;
}

function isActive(href: string, pathname: string | null) {
  if (!pathname) return false;
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

export function NavList({ items, pathname }: { items: NavItem[]; pathname: string | null }) {
  return (
    <ul className="space-y-0.5">
      {items.map((item) => {
        const active = isActive(item.href, pathname);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group flex h-9 items-center gap-3 rounded-lg px-2.5 text-sm font-medium transition-colors [&>svg]:size-[18px]",
                active
                  ? "bg-accent-soft text-accent-soft-foreground"
                  : "text-muted hover:bg-surface-muted hover:text-foreground",
              )}
            >
              {item.icon}
              <span className="flex-1">{item.label}</span>
              {item.badge}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** Reads the URL, so it must sit inside <Suspense> (dynamic routes resolve at request time). */
export function ActiveNavList({ items }: { items: NavItem[] }) {
  return <NavList items={items} pathname={usePathname()} />;
}
