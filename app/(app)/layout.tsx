import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/auth-actions";

const NAV = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/brands", label: "Brands" },
  { href: "/deals", label: "Deals" },
  { href: "/inbox", label: "Inbox" },
  { href: "/settings", label: "Settings" },
];

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Middleware already guards these routes; this is a belt-and-suspenders check.
  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .single();

  const name = profile?.display_name || user.email;

  return (
    <div className="min-h-screen md:grid md:grid-cols-[240px_1fr]">
      <aside className="border-b md:border-b-0 md:border-r border-[var(--cl-line)] flex md:flex-col md:min-h-screen">
        <div className="px-6 py-6">
          <Link href="/dashboard" className="font-display text-xl tracking-tight">
            Creators<span className="text-[var(--cl-accent)]">Link</span>
          </Link>
        </div>

        <nav className="flex-1 px-3 flex md:flex-col gap-0.5 overflow-x-auto">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-2 text-sm text-[var(--cl-muted)] transition hover:bg-black/[0.04] hover:text-[var(--cl-ink)] whitespace-nowrap"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:block px-3 pb-6">
          <div className="px-3 pb-3 text-xs text-[var(--cl-muted)] truncate">{name}</div>
          <form action={signOut}>
            <button
              type="submit"
              className="w-full rounded-lg px-3 py-2 text-left text-sm text-[var(--cl-muted)] transition hover:bg-black/[0.04] hover:text-[var(--cl-ink)]"
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>

      <main className="px-6 py-8 md:px-10 md:py-12 max-w-5xl w-full">
        {children}
      </main>
    </div>
  );
}
