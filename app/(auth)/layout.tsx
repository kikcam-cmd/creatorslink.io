import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-6 py-6">
        <Link
          href="/"
          className="font-display text-2xl tracking-tight text-[var(--cl-ink)]"
        >
          Creators<span className="text-[var(--cl-accent)]">Link</span>
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 pb-24">
        <div className="w-full max-w-sm">{children}</div>
      </main>

      <footer className="px-6 py-6 text-xs text-[var(--cl-muted)]">
        Run your entire creator-partnership business in one place.
      </footer>
    </div>
  );
}
