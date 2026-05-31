import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user!.id)
    .single();

  const firstName = (profile?.display_name || "").split(" ")[0];

  return (
    <div>
      <p className="text-sm text-[var(--muted)] mb-1">Dashboard</p>
      <h1 className="font-display text-3xl md:text-4xl leading-tight mb-10">
        {firstName ? `Hi, ${firstName}.` : "Welcome."}
      </h1>

      {/* Placeholder cards — wired to real data in Phase 1 (deliverables) and Phase 2 (payments). */}
      <div className="grid gap-4 sm:grid-cols-3 mb-10">
        {[
          { label: "Due this week", value: "—", hint: "Deliverables (Phase 1)" },
          { label: "Overdue", value: "—", hint: "Deliverables (Phase 1)" },
          { label: "Outstanding", value: "—", hint: "Payments (Phase 2)" },
        ].map((c) => (
          <div
            key={c.label}
            className="rounded-xl border border-[var(--line)] bg-[var(--card)] p-5"
          >
            <div className="text-sm text-[var(--muted)]">{c.label}</div>
            <div className="font-display text-3xl mt-2">{c.value}</div>
            <div className="text-xs text-[var(--muted)] mt-2">{c.hint}</div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-dashed border-[var(--line)] p-8 text-center">
        <p className="font-display text-xl mb-1">Nothing here yet</p>
        <p className="text-sm text-[var(--muted)] max-w-md mx-auto">
          This is Phase 0 — auth is live and you&apos;re signed in. Next up
          (Phase 1): add Brands, then Deals, then Deliverables, and this
          dashboard starts filling in.
        </p>
      </div>
    </div>
  );
}
