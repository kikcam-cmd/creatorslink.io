import Link from "next/link";
import { addDays, format } from "date-fns";
import { requireUser } from "@/lib/auth";
import {
  OPEN_DELIVERABLE_STATUSES,
  type Deliverable,
} from "@/lib/types";
import { formatDate } from "@/lib/format";
import { DeliverableStatusBadge } from "@/components/status-badge";
import { Card, CardContent } from "@/components/ui/card";

type DeliverableWithDeal = Deliverable & {
  deals: { id: string; title: string; brands: { name: string } | null } | null;
};

export default async function DashboardPage() {
  const { supabase, user } = await requireUser();

  const [{ data: profile }, { data: openItems }, { count: activeDeals }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("display_name")
        .eq("id", user.id)
        .single(),
      supabase
        .from("deliverables")
        .select("*, deals(id, title, brands(name))")
        .in("status", OPEN_DELIVERABLE_STATUSES)
        .not("due_date", "is", null)
        .order("due_date", { ascending: true }),
      supabase
        .from("deals")
        .select("id", { count: "exact", head: true })
        .eq("status", "active"),
    ]);

  const firstName = (profile?.display_name || "").split(" ")[0];
  const items = (openItems ?? []) as DeliverableWithDeal[];

  // TODO: "today" uses the server timezone (UTC on Vercel). For a US creator
  // this can be off by a day in the evening — switch to the user's local date.
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const weekEndStr = format(addDays(new Date(), 7), "yyyy-MM-dd");

  const overdue = items.filter((i) => i.due_date! < todayStr);
  const dueThisWeek = items.filter(
    (i) => i.due_date! >= todayStr && i.due_date! <= weekEndStr,
  );

  const stats = [
    { label: "Due this week", value: dueThisWeek.length },
    { label: "Overdue", value: overdue.length },
    { label: "Active deals", value: activeDeals ?? 0 },
  ];

  return (
    <div>
      <p className="text-sm text-muted-foreground mb-1">Dashboard</p>
      <h1 className="font-display text-3xl md:text-4xl leading-tight mb-10">
        {firstName ? `Hi, ${firstName}.` : "Welcome."}
      </h1>

      <div className="grid gap-4 sm:grid-cols-3 mb-10">
        {stats.map((c) => (
          <Card key={c.label}>
            <CardContent className="pt-5">
              <div className="text-sm text-muted-foreground">{c.label}</div>
              <div className="font-display text-3xl mt-2 tabular-nums">
                {c.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <DeliverableList
        title="Overdue"
        empty="Nothing overdue. Nice."
        items={overdue}
        tone="danger"
      />
      <DeliverableList
        title="Due this week"
        empty="Nothing due in the next 7 days."
        items={dueThisWeek}
      />

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--cl-line)] p-8 text-center mt-2">
          <p className="font-display text-xl mb-1">Nothing scheduled yet</p>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Add a{" "}
            <Link
              href="/deals"
              className="text-[var(--cl-accent)] hover:underline underline-offset-4"
            >
              deal
            </Link>{" "}
            and give its deliverables due dates — they&apos;ll show up here.
          </p>
        </div>
      ) : null}
    </div>
  );
}

function DeliverableList({
  title,
  empty,
  items,
  tone,
}: {
  title: string;
  empty: string;
  items: DeliverableWithDeal[];
  tone?: "danger";
}) {
  return (
    <section className="mb-8">
      <h2 className="font-display text-xl mb-3">{title}</h2>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{empty}</p>
      ) : (
        <div className="space-y-2">
          {items.map((i) => (
            <Link
              key={i.id}
              href={i.deals ? `/deals/${i.deals.id}` : "/deals"}
              className="flex items-center justify-between gap-4 rounded-lg border border-[var(--cl-line)] bg-[var(--cl-card)] px-4 py-3 transition hover:border-[var(--cl-accent)]/40"
            >
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{i.title}</div>
                <div className="text-xs text-muted-foreground truncate">
                  {i.deals?.title ?? "—"}
                  {i.deals?.brands?.name ? ` · ${i.deals.brands.name}` : ""}
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <DeliverableStatusBadge status={i.status} />
                <span
                  className={
                    tone === "danger"
                      ? "text-sm text-[var(--cl-danger)] tabular-nums"
                      : "text-sm text-muted-foreground tabular-nums"
                  }
                >
                  {formatDate(i.due_date)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
