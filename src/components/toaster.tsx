"use client";

import { Toaster as Sonner } from "sonner";

export function Toaster() {
  return (
    <Sonner
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast: "!rounded-xl !border-border !bg-surface !text-foreground !shadow-[var(--shadow-pop)] !font-sans",
          description: "!text-muted",
        },
      }}
    />
  );
}
