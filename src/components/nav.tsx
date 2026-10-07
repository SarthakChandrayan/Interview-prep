import Link from "next/link";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/review", label: "Review" },
  { href: "/items", label: "Library" },
];

export function Nav() {
  return (
    <header className="border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
      <nav className="mx-auto flex max-w-5xl items-center gap-4 px-4 sm:gap-6 py-3 sm:px-6">
        <Link href="/" className="shrink-0 font-semibold tracking-tight">
          Prep<span className="text-indigo-600 dark:text-indigo-400">Deck</span>
        </Link>
        <div className="flex gap-3 text-sm sm:gap-4 text-zinc-600 dark:text-zinc-400">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-zinc-900 dark:hover:text-zinc-100">
              {l.label}
            </Link>
          ))}
        </div>
        <Link
          href="/items/new"
          className="ml-auto shrink-0 whitespace-nowrap rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500"
        >
          + Add
        </Link>
      </nav>
    </header>
  );
}
