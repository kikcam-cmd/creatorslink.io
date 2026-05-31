import Link from "next/link";
import { signUp } from "@/lib/auth-actions";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div>
      <h1 className="font-display text-3xl leading-tight mb-1">
        Create your account
      </h1>
      <p className="text-sm text-[var(--cl-muted)] mb-8">
        Get every brand deal, deliverable, and dollar in one place.
      </p>

      {error ? (
        <p className="mb-5 rounded-lg border border-[var(--cl-danger)]/30 bg-[var(--cl-danger)]/5 px-4 py-3 text-sm text-[var(--cl-danger)]">
          {error}
        </p>
      ) : null}

      <form action={signUp} className="space-y-4">
        <div>
          <label htmlFor="displayName" className="block text-sm mb-1.5">
            Name
          </label>
          <input
            id="displayName"
            name="displayName"
            type="text"
            required
            autoComplete="name"
            className="w-full rounded-lg border border-[var(--cl-line)] bg-[var(--cl-card)] px-3.5 py-2.5 text-sm outline-none transition focus:border-[var(--cl-accent)] focus:ring-2 focus:ring-[var(--cl-accent)]/20"
          />
        </div>
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
            minLength={8}
            autoComplete="new-password"
            className="w-full rounded-lg border border-[var(--cl-line)] bg-[var(--cl-card)] px-3.5 py-2.5 text-sm outline-none transition focus:border-[var(--cl-accent)] focus:ring-2 focus:ring-[var(--cl-accent)]/20"
          />
          <p className="mt-1.5 text-xs text-[var(--cl-muted)]">
            At least 8 characters.
          </p>
        </div>
        <button
          type="submit"
          className="w-full rounded-lg bg-[var(--cl-ink)] px-4 py-2.5 text-sm font-medium text-[var(--cl-paper)] transition hover:opacity-90"
        >
          Create account
        </button>
      </form>

      <p className="mt-6 text-sm text-[var(--cl-muted)]">
        Already have an account?{" "}
        <Link href="/login" className="text-[var(--cl-accent)] underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
