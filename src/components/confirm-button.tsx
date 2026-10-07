"use client";

import { Loader2 } from "lucide-react";
import { useRef, useTransition, type ReactNode } from "react";
import { toast } from "sonner";
import { Button, buttonClass } from "./ui";

/** A button that asks for confirmation in an accessible modal before running a server action. */
export function ConfirmButton({
  action,
  title,
  description,
  confirmLabel,
  successMessage,
  variant = "secondary",
  children,
}: {
  action: () => Promise<unknown>;
  title: string;
  description: string;
  confirmLabel: string;
  successMessage?: string;
  variant?: "secondary" | "danger" | "ghost";
  children: ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [pending, startTransition] = useTransition();

  function confirm() {
    startTransition(async () => {
      try {
        await action();
        dialog.current?.close();
        if (successMessage) toast.success(successMessage);
      } catch (err) {
        // redirect() inside an action throws a control-flow error that must propagate.
        if (err instanceof Error && "digest" in err && String(err.digest).startsWith("NEXT_REDIRECT")) throw err;
        toast.error("Something went wrong. Please try again.");
      }
    });
  }

  return (
    <>
      <Button type="button" variant={variant} onClick={() => dialog.current?.showModal()}>
        {children}
      </Button>
      <dialog
        ref={dialog}
        aria-labelledby="confirm-title"
        className="m-auto w-[min(420px,calc(100vw-2rem))] rounded-2xl border border-border bg-surface p-0 text-foreground shadow-[var(--shadow-pop)] backdrop:bg-black/40 backdrop:backdrop-blur-[2px] open:animate-fade-in"
        onClick={(e) => e.target === dialog.current && !pending && dialog.current?.close()}
      >
        <div className="p-6">
          <h2 id="confirm-title" className="text-base font-semibold">
            {title}
          </h2>
          <p className="mt-1.5 text-sm text-muted">{description}</p>
        </div>
        <div className="flex justify-end gap-2 border-t border-border bg-surface-muted/50 px-6 py-4">
          <button type="button" className={buttonClass("secondary")} onClick={() => dialog.current?.close()} disabled={pending}>
            Cancel
          </button>
          <button
            type="button"
            className={buttonClass(variant === "danger" ? "danger" : "primary")}
            onClick={confirm}
            disabled={pending}
            autoFocus
          >
            {pending && <Loader2 className="animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </dialog>
    </>
  );
}
