"use client";

import { Loader2 } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "./ui";

/** A submit button that shows a spinner while its parent form's action runs. */
export function SubmitButton({
  children,
  pendingLabel,
  ...props
}: ComponentProps<typeof Button> & { pendingLabel?: ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending || props.disabled} aria-busy={pending} {...props}>
      {pending ? (
        <>
          <Loader2 className="animate-spin" />
          {pendingLabel ?? children}
        </>
      ) : (
        children
      )}
    </Button>
  );
}
