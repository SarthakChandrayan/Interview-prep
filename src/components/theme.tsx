"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useEffect, useSyncExternalStore } from "react";
import { cn } from "./ui";

type Theme = "light" | "dark" | "system";
const KEY = "theme";

/**
 * Runs before first paint (inlined in <head>) so the page never flashes the
 * wrong theme. Kept tiny and dependency-free.
 */
export const themeScript = `(function(){try{var t=localStorage.getItem("${KEY}");var d=t==="dark"||((t===null||t==="system")&&matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d)}catch(e){}})()`;

function apply(theme: Theme) {
  const dark = theme === "dark" || (theme === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
}

function readTheme(): Theme {
  try {
    const t = localStorage.getItem(KEY);
    return t === "light" || t === "dark" ? t : "system";
  } catch {
    return "system";
  }
}

const options: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

const listeners = new Set<() => void>();

function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}

export function ThemeToggle({ className }: { className?: string }) {
  // null on the server, which can't know the stored preference.
  const theme = useSyncExternalStore(subscribe, readTheme, () => null);

  // Follow OS changes while the preference is "system".
  useEffect(() => {
    const mq = matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => readTheme() === "system" && apply("system");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  function choose(t: Theme) {
    try {
      localStorage.setItem(KEY, t);
    } catch {
      // Storage unavailable (private mode): still apply for this page view.
    }
    apply(t);
    listeners.forEach((l) => l());
  }

  return (
    <div role="radiogroup" aria-label="Theme" className={cn("flex rounded-lg bg-surface-muted p-0.5", className)}>
      {options.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={theme === value}
          aria-label={label}
          title={label}
          onClick={() => choose(value)}
          className={cn(
            "grid h-7 flex-1 place-items-center rounded-md text-subtle transition-colors hover:text-foreground",
            theme === value && "bg-surface text-foreground shadow-sm",
          )}
        >
          <Icon className="size-3.5" />
        </button>
      ))}
    </div>
  );
}
