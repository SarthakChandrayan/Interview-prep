import { CheckCircle2, Layers } from "lucide-react";
import type { ReactNode } from "react";

const points = [
  "Spaced repetition for problems, concepts and STAR stories",
  "An AI interviewer that asks real follow-ups",
  "Scored feedback that updates your review schedule",
];

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-[#13112b] p-12 text-white lg:flex lg:flex-col">
        <div className="pointer-events-none absolute -left-24 top-1/3 size-96 rounded-full bg-[#5b4ef0]/40 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 bottom-0 size-80 rounded-full bg-[#a855f7]/30 blur-3xl" />
        <div className="relative flex items-center gap-2.5 font-semibold tracking-tight">
          <span className="grid size-8 place-items-center rounded-[10px] bg-gradient-to-br from-[#7c71ff] to-[#a855f7]">
            <Layers className="size-4" />
          </span>
          PrepDeck
        </div>
        <div className="relative mt-auto max-w-md">
          <h2 className="text-balance text-3xl font-semibold leading-tight tracking-tight">
            Interview prep that remembers what you&apos;ll forget.
          </h2>
          <ul className="mt-8 space-y-3 text-[15px] text-white/80">
            {points.map((p) => (
              <li key={p} className="flex gap-3">
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-[#a99fff]" />
                {p}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <main className="flex items-center justify-center px-4 py-12 sm:px-6">
        <div className="w-full max-w-sm">
          <div className="mb-10 flex items-center gap-2.5 font-semibold tracking-tight lg:hidden">
            <span className="grid size-8 place-items-center rounded-[10px] bg-gradient-to-br from-accent to-[#a855f7] text-accent-foreground">
              <Layers className="size-4" />
            </span>
            PrepDeck
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
