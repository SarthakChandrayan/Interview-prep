"use client";

import { AlertCircle, CheckCircle2, Trash2 } from "lucide-react";
import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { changePassword, deleteAccount, updateName, type AuthFormState } from "@/actions/auth";
import { PASSWORD_MIN } from "@/lib/auth/validation";
import { SubmitButton } from "../submit-button";
import { Button, buttonClass, fieldClass } from "../ui";

function useToastOnSuccess(state: AuthFormState) {
  useEffect(() => {
    if (state.success) toast.success(state.success);
  }, [state]);
}

function Field({
  label,
  name,
  type = "text",
  autoComplete,
  defaultValue,
  error,
  hint,
}: {
  label: string;
  name: string;
  type?: string;
  autoComplete: string;
  defaultValue?: string;
  error?: string;
  hint?: string;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="block text-sm font-medium">{label}</span>
      <input
        name={name}
        type={type}
        autoComplete={autoComplete}
        defaultValue={defaultValue}
        aria-invalid={error ? true : undefined}
        className={fieldClass}
      />
      {error ? (
        <span className="block text-xs font-medium text-danger">{error}</span>
      ) : (
        hint && <span className="block text-xs text-subtle">{hint}</span>
      )}
    </label>
  );
}

function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="flex items-center gap-2 rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger">
      <AlertCircle className="size-4 shrink-0" />
      {message}
    </p>
  );
}

export function ProfileForm({ name }: { name: string }) {
  const [state, action] = useActionState(updateName, {});
  useToastOnSuccess(state);
  return (
    <form action={action} className="space-y-4">
      <Field label="Name" name="name" autoComplete="name" defaultValue={name} error={state.errors?.name} />
      <SubmitButton pendingLabel="Saving…">Save</SubmitButton>
    </form>
  );
}

export function PasswordForm() {
  const [state, action] = useActionState(changePassword, {});
  const formRef = useRef<HTMLFormElement>(null);
  useToastOnSuccess(state);
  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="space-y-4">
      <FormError message={state.errors?.form} />
      <Field label="Current password" name="current" type="password" autoComplete="current-password" error={state.errors?.current} />
      <Field
        label="New password"
        name="next"
        type="password"
        autoComplete="new-password"
        error={state.errors?.next}
        hint={`At least ${PASSWORD_MIN} characters. Other devices will be signed out.`}
      />
      {state.success && (
        <p className="flex items-center gap-2 text-sm font-medium text-success">
          <CheckCircle2 className="size-4" />
          {state.success}
        </p>
      )}
      <SubmitButton pendingLabel="Updating…">Change password</SubmitButton>
    </form>
  );
}

export function DeleteAccount() {
  const [state, action] = useActionState(deleteAccount, {});
  const dialog = useRef<HTMLDialogElement>(null);

  return (
    <>
      <Button variant="danger" onClick={() => dialog.current?.showModal()}>
        <Trash2 />
        Delete account
      </Button>
      <dialog
        ref={dialog}
        aria-labelledby="delete-title"
        className="m-auto w-[min(440px,calc(100vw-2rem))] rounded-2xl border border-border bg-surface p-0 text-foreground shadow-[var(--shadow-pop)] backdrop:bg-black/40 open:animate-fade-in"
      >
        <form action={action}>
          <div className="space-y-4 p-6">
            <div>
              <h2 id="delete-title" className="text-base font-semibold">
                Delete your account?
              </h2>
              <p className="mt-1.5 text-sm text-muted">
                This permanently deletes your account, library, review history and interviews. It can&apos;t be undone.
              </p>
            </div>
            <Field
              label="Enter your password to confirm"
              name="password"
              type="password"
              autoComplete="current-password"
              error={state.errors?.password}
            />
          </div>
          <div className="flex justify-end gap-2 border-t border-border bg-surface-muted/50 px-6 py-4">
            <button type="button" className={buttonClass("secondary")} onClick={() => dialog.current?.close()}>
              Cancel
            </button>
            <SubmitButton variant="danger" pendingLabel="Deleting…">
              Delete everything
            </SubmitButton>
          </div>
        </form>
      </dialog>
    </>
  );
}
