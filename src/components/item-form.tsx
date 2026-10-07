"use client";

import { AlertCircle } from "lucide-react";
import { useActionState, useId, type ReactNode } from "react";
import type { FormState } from "@/actions/items";
import { DIFFICULTIES, KINDS } from "@/lib/constants";
import { SubmitButton } from "./submit-button";
import { fieldClass, inputClass, cn } from "./ui";

interface Props {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  defaults?: Partial<Record<string, string>>;
  topics: string[];
  submitLabel: string;
  allowAddAnother?: boolean;
}

const kindHelp: Record<string, string> = {
  problem: "A coding question you've solved, like a LeetCode problem.",
  concept: "Something you should be able to explain: OS, networking, system design…",
  behavioral: "A story for questions like \"tell me about a time…\".",
};

export function ItemForm({ action, defaults = {}, topics, submitLabel, allowAddAnother }: Props) {
  const [state, formAction] = useActionState(action, {});
  const values = { ...defaults, ...state.values };
  const errors = state.errors ?? {};
  // Remount the fields after "save & add another" so they pick up fresh defaults.
  const formKey = JSON.stringify(state.values ?? {});
  const hasErrors = Object.keys(errors).length > 0;

  return (
    <form action={formAction} key={formKey} className="space-y-6" noValidate>
      {hasErrors && (
        <div role="alert" className="flex items-center gap-2 rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger">
          <AlertCircle className="size-4 shrink-0" />
          {errors.form ?? "Please fix the highlighted fields."}
        </div>
      )}

      <Field label="Title" error={errors.title} required>
        {(p) => (
          <input
            {...p}
            name="title"
            defaultValue={values.title}
            placeholder="e.g. Longest Substring Without Repeating Characters"
            className={fieldClass}
            autoFocus
            maxLength={200}
          />
        )}
      </Field>

      <fieldset>
        <legend className="mb-2 text-sm font-medium">Type</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {KINDS.map((k) => (
            <label
              key={k}
              className="relative flex cursor-pointer flex-col rounded-xl border border-border bg-surface p-3.5 shadow-sm transition-colors hover:border-border-strong has-[:checked]:border-accent has-[:checked]:bg-accent-soft/50 has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-ring"
            >
              <input type="radio" name="kind" value={k} defaultChecked={(values.kind ?? "problem") === k} className="sr-only" />
              <span className="text-sm font-medium capitalize">{k}</span>
              <span className="mt-0.5 text-xs text-muted">{kindHelp[k]}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Topic" error={errors.topic} required hint="Group related items, e.g. Sliding Window">
          {(p) => (
            <>
              <input {...p} name="topic" list="topics" defaultValue={values.topic} placeholder="e.g. Graphs" className={fieldClass} maxLength={60} />
              <datalist id="topics">
                {topics.map((t) => (
                  <option key={t} value={t} />
                ))}
              </datalist>
            </>
          )}
        </Field>
        <Field label="Difficulty" error={errors.difficulty}>
          {(p) => (
            <select {...p} name="difficulty" defaultValue={values.difficulty ?? ""} className={fieldClass}>
              <option value="">Not set</option>
              {DIFFICULTIES.map((d) => (
                <option key={d} value={d}>
                  {d[0].toUpperCase() + d.slice(1)}
                </option>
              ))}
            </select>
          )}
        </Field>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Link" error={errors.url} hint="LeetCode problem, article or docs">
          {(p) => <input {...p} name="url" type="url" defaultValue={values.url} placeholder="https://" className={fieldClass} />}
        </Field>
        <Field label="Tags" error={errors.tags} hint="Comma separated">
          {(p) => <input {...p} name="tags" defaultValue={values.tags} placeholder="hash map, two pointers" className={fieldClass} />}
        </Field>
      </div>

      <Field
        label="Notes"
        error={errors.notes}
        hint="The answer you want to remember: key insight, approach, complexity, or your STAR story. Markdown supported."
      >
        {(p) => (
          <textarea
            {...p}
            name="notes"
            rows={10}
            defaultValue={values.notes}
            placeholder={"**Approach:** …\n\n**Complexity:** O(n) time, O(1) space"}
            className={cn(inputClass, "py-2.5 font-mono text-[13px] leading-relaxed")}
          />
        )}
      </Field>

      <div className="flex flex-wrap gap-2 border-t border-border pt-6">
        <SubmitButton name="intent" value="save" pendingLabel="Saving…">
          {submitLabel}
        </SubmitButton>
        {allowAddAnother && (
          <SubmitButton name="intent" value="another" variant="secondary" pendingLabel="Saving…">
            Save & add another
          </SubmitButton>
        )}
      </div>
    </form>
  );
}

function Field({
  label,
  error,
  hint,
  required,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: (props: { id: string; "aria-invalid"?: boolean; "aria-describedby"?: string; required?: boolean }) => ReactNode;
}) {
  const id = useId();
  const descId = `${id}-desc`;
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
        {required && <span className="text-danger"> *</span>}
      </label>
      {children({
        id,
        "aria-invalid": error ? true : undefined,
        "aria-describedby": error || hint ? descId : undefined,
        required,
      })}
      {error ? (
        <p id={descId} className="text-xs font-medium text-danger">
          {error}
        </p>
      ) : (
        hint && (
          <p id={descId} className="text-xs text-subtle">
            {hint}
          </p>
        )
      )}
    </div>
  );
}
