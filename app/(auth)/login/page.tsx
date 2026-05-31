import Link from "next/link";
import { signIn } from "@/lib/auth-actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { error, message } = await searchParams;

  return (
    <div>
      <h1 className="font-display text-3xl leading-tight mb-1">Welcome back</h1>
      <p className="text-sm text-[var(--cl-muted)] mb-8">
        Sign in to your CreatorsLink account.
      </p>

      {message ? (
        <p className="mb-5 rounded-lg border border-[var(--cl-line)] bg-[var(--cl-card)] px-4 py-3 text-sm text-[var(--cl-ink)]">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="mb-5 rounded-lg border border-[var(--cl-danger)]/30 bg-[var(--cl-danger)]/5 px-4 py-3 text-sm text-[var(--cl-danger)]">
          {error}
        </p>
      ) : null}

      <form action={signIn} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm mb-1.5">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="w-full rounded-lg border border-[var(--cl-line)] bg-[var(--cl-card)] px-3.5 py-2.5 text-sm outline-none transition focus:border-[var(--cl-accent)] focus:ring-2 focus:ring-[var(--cl-accent)]/20"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm mb-1.5">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="w-full rounded-lg border border-[var(--cl-line)] bg-[var(--cl-card)] px-3.5 py-2.5 text-sm outline-none transition focus:border-[var(--cl-accent)] focus:ring-2 focus:ring-[var(--cl-accent)]/20"
          />
        </div>
        <button
          type="submit"
          className="w-full rounded-lg bg-[var(--cl-ink)] px-4 py-2.5 text-sm font-medium text-[var(--cl-paper)] transition hover:opacity-90"
        >
          Sign in
        </button>
      </form>

      <p className="mt-6 text-sm text-[var(--cl-muted)]">
        New here?{" "}
        <Link href="/signup" className="text-[var(--cl-accent)] underline-offset-4 hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
