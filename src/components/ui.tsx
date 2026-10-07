import { BookOpen, Code2, MessageSquareQuote } from "lucide-react";
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import type { Difficulty, Kind } from "@/lib/constants";

export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

/* ---------- Surfaces ---------- */

export function Card({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn("rounded-2xl border border-border bg-surface shadow-[var(--shadow-card)]", className)}
      {...props}
    />
  );
}

export function CardHeader({
  title,
  description,
  action,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 px-5 pt-5 sm:px-6">
      <div className="min-w-0">
        <h2 className="text-[15px] font-semibold tracking-tight">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
  eyebrow,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  eyebrow?: ReactNode;
}) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && <div className="mb-2">{eyebrow}</div>}
        <h1 className="text-2xl font-semibold tracking-tight sm:text-[28px]">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-[15px] text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  children,
  className,
}: {
  icon: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center px-6 py-14 text-center", className)}>
      <div className="mb-4 grid size-12 place-items-center rounded-2xl bg-accent-soft text-accent-soft-foreground [&>svg]:size-6">
        {icon}
      </div>
      <h2 className="text-base font-semibold">{title}</h2>
      {description && <p className="mt-1.5 max-w-md text-sm text-muted">{description}</p>}
      {children && <div className="mt-6 flex flex-wrap justify-center gap-2">{children}</div>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("animate-pulse rounded-2xl bg-surface-muted", className)} />;
}

/* ---------- Buttons ---------- */

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-accent text-accent-foreground shadow-sm hover:bg-accent-hover",
  secondary: "border border-border bg-surface text-foreground shadow-sm hover:bg-surface-muted",
  ghost: "text-muted hover:bg-surface-muted hover:text-foreground",
  danger: "border border-border bg-surface text-danger shadow-sm hover:bg-danger-soft",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-8 gap-1.5 rounded-lg px-3 text-[13px] [&_svg]:size-3.5",
  md: "h-9 gap-2 rounded-lg px-3.5 text-sm [&_svg]:size-4",
  lg: "h-11 gap-2 rounded-xl px-5 text-[15px] [&_svg]:size-4",
};

export function buttonClass(variant: ButtonVariant = "primary", size: ButtonSize = "md", className?: string) {
  return cn(
    "inline-flex shrink-0 select-none items-center justify-center whitespace-nowrap font-medium transition-colors",
    "disabled:pointer-events-none disabled:opacity-50 [&_svg]:shrink-0",
    variants[variant],
    sizes[size],
    className,
  );
}

export function Button({
  variant,
  size,
  className,
  ...props
}: ComponentProps<"button"> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return <button className={buttonClass(variant, size, className)} {...props} />;
}

export function ButtonLink({
  variant,
  size,
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return <Link className={buttonClass(variant, size, className)} {...props} />;
}

/* ---------- Form controls ---------- */

export const inputClass = cn(
  "w-full rounded-lg border border-border bg-surface px-3 text-sm text-foreground shadow-sm transition-colors",
  "placeholder:text-subtle hover:border-border-strong",
  "focus:border-accent focus:outline-none focus:ring-4 focus:ring-ring",
  "aria-[invalid=true]:border-danger",
);

export const fieldClass = cn(inputClass, "h-10");

/* ---------- Badges ---------- */

type Tone = "neutral" | "accent" | "success" | "warning" | "danger" | "info";

const tones: Record<Tone, string> = {
  neutral: "bg-surface-muted text-muted",
  accent: "bg-accent-soft text-accent-soft-foreground",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  info: "bg-info-soft text-info",
};

export function Badge({ tone = "neutral", className, ...props }: ComponentProps<"span"> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium [&_svg]:size-3",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}

const kindMeta: Record<Kind, { tone: Tone; label: string; icon: ReactNode }> = {
  problem: { tone: "info", label: "Problem", icon: <Code2 /> },
  concept: { tone: "accent", label: "Concept", icon: <BookOpen /> },
  behavioral: { tone: "warning", label: "Behavioral", icon: <MessageSquareQuote /> },
};

export function KindBadge({ kind }: { kind: Kind }) {
  const m = kindMeta[kind];
  return (
    <Badge tone={m.tone}>
      {m.icon}
      {m.label}
    </Badge>
  );
}

const difficultyTone: Record<Difficulty, Tone> = { easy: "success", medium: "warning", hard: "danger" };

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty | null }) {
  if (!difficulty) return null;
  return (
    <Badge tone={difficultyTone[difficulty]} className="capitalize">
      {difficulty}
    </Badge>
  );
}

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded border border-border bg-surface-muted px-1 font-mono text-[11px] font-medium text-muted">
      {children}
    </kbd>
  );
}
