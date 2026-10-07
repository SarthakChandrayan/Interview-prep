"use client";

import { Menu, X } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "../ui";

export function MobileNav({ brand, children }: { brand: ReactNode; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    panelRef.current?.querySelector<HTMLElement>("a, button")?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-surface/85 px-4 backdrop-blur-md lg:hidden">
        {brand}
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          aria-expanded={open}
          className="grid size-9 place-items-center rounded-lg text-muted hover:bg-surface-muted hover:text-foreground"
        >
          <Menu className="size-5" />
        </button>
      </header>

      <div
        className={cn("fixed inset-0 z-40 lg:hidden", open ? "visible" : "invisible")}
        aria-hidden={!open}
        inert={!open}
      >
        <div
          onClick={() => setOpen(false)}
          className={cn("absolute inset-0 bg-black/40 transition-opacity", open ? "opacity-100" : "opacity-0")}
        />
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label="Navigation"
          // Close after following any link inside the drawer.
          onClick={(e) => (e.target as HTMLElement).closest("a") && setOpen(false)}
          className={cn(
            "absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-surface shadow-[var(--shadow-pop)] transition-transform duration-200",
            open ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="absolute right-3 top-3 grid size-9 place-items-center rounded-lg text-muted hover:bg-surface-muted"
          >
            <X className="size-5" />
          </button>
          {children}
        </div>
      </div>
    </>
  );
}
