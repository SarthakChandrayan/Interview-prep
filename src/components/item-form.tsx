"use client";

import { useActionState } from "react";
import type { FormState } from "@/app/actions";
import { DIFFICULTIES, KINDS } from "@/lib/constants";
import { buttonStyles, inputStyles } from "./ui";

interface Props {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  defaults?: Partial<Record<string, string>>;
  topics: string[];
  submitLabel: string;
  allowAddAnother?: boolean;
}

export function ItemForm({ action, defaults = {}, topics, submitLabel, allowAddAnother }: Props) {
  const [state, formAction, pending] = useActionState(action, {});
  const values = { ...defaults, ...state.values };
  const errors = state.errors ?? {};
  // Remount the fields after "save & add another" so they pick up fresh defaults.
  const formKey = JSON.stringify(state.values ?? {});

  return (
    <form action={formAction} key={formKey} className="space-y-5">
      {errors.form && <p className="text-sm text-rose-600">{errors.form}</p>}

      <Field label="Title" error={errors.title}>
        <input
          name="title"
          defaultValue={values.title}
          placeholder="e.g. Longest Substring Without Repeating Characters"
          className={inputStyles}
          autoFocus
          required
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-3">
        <Field label="Type" error={errors.kind}>
          <select name="kind" defaultValue={values.kind ?? "problem"} className={inputStyles}>
            {KINDS.map((k) => (
              <option key={k} value={k}>
                {k[0].toUpperCase() + k.slice(1)}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Topic" error={errors.topic}>
          <input
            name="topic"
            list="topics"
            defaultValue={values.topic}
            placeholder="e.g. Sliding Window"
            className={inputStyles}
            required
          />
          <datalist id="topics">
            {topics.map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>
        </Field>
        <Field label="Difficulty" error={errors.difficulty}>
          <select name="difficulty" defaultValue={values.difficulty ?? ""} className={inputStyles}>
            <option value="">—</option>
            {DIFFICULTIES.map((d) => (
              <option key={d} value={d}>
                {d[0].toUpperCase() + d.slice(1)}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Link" error={errors.url} hint="LeetCode problem, article, or doc">
        <input name="url" type="url" defaultValue={values.url} placeholder="https://" className={inputStyles} />
      </Field>

      <Field label="Tags" error={errors.tags} hint="Comma separated">
        <input name="tags" defaultValue={values.tags} placeholder="hash map, two pointers" className={inputStyles} />
      </Field>

      <Field
        label="Notes"
        error={errors.notes}
        hint="Key insight, approach, complexity — or your STAR story. Shown when you reveal the answer during review."
      >
        <textarea name="notes" rows={8} defaultValue={values.notes} className={`${inputStyles} font-mono`} />
      </Field>

      <div className="flex gap-3">
        <button type="submit" name="intent" value="save" disabled={pending} className={buttonStyles.primary}>
          {pending ? "Saving…" : submitLabel}
        </button>
        {allowAddAnother && (
          <button type="submit" name="intent" value="another" disabled={pending} className={buttonStyles.secondary}>
            Save & add another
          </button>
        )}
      </div>
    </form>
  );
}

function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium">{label}</span>
      {children}
      {error ? (
        <span className="block text-xs text-rose-600">{error}</span>
      ) : (
        hint && <span className="block text-xs text-zinc-500">{hint}</span>
      )}
    </label>
  );
}
