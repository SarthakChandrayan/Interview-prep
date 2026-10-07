"use client";

import { AlertCircle, Mic, Play, Shuffle } from "lucide-react";
import { useActionState } from "react";
import { startInterview } from "@/actions/interview";
import type { Kind } from "@/lib/constants";
import { SubmitButton } from "../submit-button";
import { fieldClass } from "../ui";

interface Option {
  id: string;
  title: string;
  topic: string;
  kind: Kind;
}

export function StartInterviewForm({ options, defaultItemId }: { options: Option[]; defaultItemId: string }) {
  const [state, action] = useActionState(startInterview, {});
  const topics = [...new Set(options.map((o) => o.topic))];

  return (
    <form action={action} className="space-y-5">
      <div className="space-y-1.5">
        <label htmlFor="itemId" className="block text-sm font-medium">
          Question
        </label>
        <select id="itemId" name="itemId" defaultValue={defaultItemId} className={fieldClass}>
          <option value="">Surprise me: something due or weak</option>
          {topics.map((topic) => (
            <optgroup key={topic} label={topic}>
              {options
                .filter((o) => o.topic === topic)
                .map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.title}
                  </option>
                ))}
            </optgroup>
          ))}
        </select>
      </div>

      <ul className="grid gap-3 text-sm text-muted sm:grid-cols-3">
        <li className="flex gap-2">
          <Shuffle className="mt-0.5 size-4 shrink-0 text-accent" />
          Realistic follow-ups based on your answers
        </li>
        <li className="flex gap-2">
          <Mic className="mt-0.5 size-4 shrink-0 text-accent" />
          Type, or answer by voice in Chrome or Edge
        </li>
        <li className="flex gap-2">
          <Play className="mt-0.5 size-4 shrink-0 text-accent" />
          Scored feedback and a model answer at the end
        </li>
      </ul>

      {state.error && (
        <p role="alert" className="flex items-center gap-2 rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger">
          <AlertCircle className="size-4 shrink-0" />
          {state.error}
        </p>
      )}

      <SubmitButton size="lg" pendingLabel="Starting…" className="w-full sm:w-auto">
        <Play />
        Start interview
      </SubmitButton>
    </form>
  );
}
