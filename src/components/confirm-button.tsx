"use client";

import { useTransition, type ReactNode } from "react";

export function ConfirmButton({
  action,
  message,
  className,
  children,
}: {
  action: () => Promise<void>;
  message: string;
  className?: string;
  children: ReactNode;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      className={className}
      disabled={pending}
      onClick={() => {
        if (confirm(message)) startTransition(() => action());
      }}
    >
      {pending ? "Working…" : children}
    </button>
  );
}
