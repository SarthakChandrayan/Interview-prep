"use client";

import { AlertCircle, Eye, EyeOff } from "lucide-react";
import { useActionState, useId, useState } from "react";
import type { AuthFormState } from "@/actions/auth";
import { SubmitButton } from "../submit-button";
import { fieldClass, cn } from "../ui";

type Field = {
  name: string;
  label: string;
  type: "text" | "email" | "password";
  autoComplete: string;
  hint?: string;
};

export function AuthForm({
  action,
  fields,
  submitLabel,
  pendingLabel,
  hidden,
}: {
  action: (prev: AuthFormState, formData: FormData) => Promise<AuthFormState>;
  fields: Field[];
  submitLabel: string;
  pendingLabel: string;
  hidden?: Record<string, string>;
}) {
  const [state, formAction] = useActionState(action, {});
  const errors = state.errors ?? {};

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {errors.form && (
        <p role="alert" className="flex items-center gap-2 rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger">
          <AlertCircle className="size-4 shrink-0" />
          {errors.form}
        </p>
      )}
      {Object.entries(hidden ?? {}).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      {fields.map((f, i) => (
        <AuthField key={f.name} field={f} error={errors[f.name]} defaultValue={state.values?.[f.name]} autoFocus={i === 0} />
      ))}
      <SubmitButton size="lg" className="w-full" pendingLabel={pendingLabel}>
        {submitLabel}
      </SubmitButton>
    </form>
  );
}

function AuthField({
  field,
  error,
  defaultValue,
  autoFocus,
}: {
  field: Field;
  error?: string;
  defaultValue?: string;
  autoFocus?: boolean;
}) {
  const id = useId();
  const [show, setShow] = useState(false);
  const isPassword = field.type === "password";
  const descId = `${id}-desc`;

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium">
        {field.label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={field.name}
          type={isPassword && show ? "text" : field.type}
          autoComplete={field.autoComplete}
          defaultValue={isPassword ? undefined : defaultValue}
          autoFocus={autoFocus}
          aria-invalid={error ? true : undefined}
          aria-describedby={error || field.hint ? descId : undefined}
          className={cn(fieldClass, "h-11", isPassword && "pr-11")}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? "Hide password" : "Show password"}
            className="absolute right-1.5 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-md text-subtle hover:text-foreground"
          >
            {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        )}
      </div>
      {error ? (
        <p id={descId} className="text-xs font-medium text-danger">
          {error}
        </p>
      ) : (
        field.hint && (
          <p id={descId} className="text-xs text-subtle">
            {field.hint}
          </p>
        )
      )}
    </div>
  );
}
