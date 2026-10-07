"use client";

import { buttonStyles } from "@/components/ui";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="py-20 text-center">
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <p className="mt-2 text-sm text-zinc-500">
        If this keeps happening, check that MongoDB is running and <code>MONGODB_URI</code> is set.
      </p>
      <button onClick={reset} className={`${buttonStyles.secondary} mt-6`}>
        Try again
      </button>
    </div>
  );
}
