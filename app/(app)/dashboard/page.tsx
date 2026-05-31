import Link from "next/link";
import { requireUser } from "@/lib/auth";
import {
  OPEN_DELIVERABLE_STATUSES,
  effectivePaymentStatus,
  isOutstanding,
  isPaymentOverdue,
  type Deliverable,
  type Payment,
} from "@/lib/types";
import { todayStr, daysFromTodayStr } from "@/lib/dates";
import { formatDate, formatMoneyExact } from "@/lib/format";
import {
  DeliverableStatusBadge,
  PaymentStatusBadge,
} from "@/components/status-badge";
import { Card, CardContent } from "@/components/ui/card";

type DeliverableWithDeal = Deliverable & {
  deals: { id: string; title: string; brands: { name: string } | null } | null;
};
type PaymentWithDeal = Payment & {
  deals: { id: string; title: string; brands: { name: string } | null } | null;
};

export default async function DashboardPage() {
  const { supabase, user } = await requireUser();

  const [
    { data: profile },
    { data: openItems },
    { data: paymentRows },
    { count: activeDeals },
  ] = await Promise.all([
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
      .from("payments")
      .select("*, deals(id, title, brands(name))")
      .order("due_date", { ascending: true, nullsFirst: false }),
    supabase
      .from("deals")
      .select("id", { count: "exact", head: true })
      .eq("status", "active"),
  ]);

  const firstName = (profile?.display_name || "").split(" ")[0];
  const items = (openItems ?? []) as DeliverableWithDeal[];
  const payments = (paymentRows ?? []) as PaymentWithDeal[];

  const today = todayStr();
  const weekEndStr = daysFromTodayStr(7);

  const overdue = items.filter((i) => i.due_date! < today);
  const dueThisWeek = items.filter(
    (i) => i.due_date! >= today && i.due_date! <= weekEndStr,
  );

  // Revenue overview. NOTE: amounts are summed as plain numbers and shown in
  // USD — if a creator runs deals in mixed currencies this aggregate is
  // approximate (per-payment currency is correct on the deal page). Most v1
  // creators are single-currency; revisit if that stops being true.
  const ym = today.slice(0, 7); // current YYYY-MM
  const sum = (rows: PaymentWithDeal[]) =>
    rows.reduce((t, p) => t + (Number(p.amount) || 0), 0);

  const paidThisMonth = payments.filter(
    (p) => p.status === "paid" && (p.paid_date ?? "").startsWith(ym),
  );
  const outstanding = payments.filter(isOutstanding);
  const overduePayments = outstanding.filter((p) => isPaymentOverdue(p, today));

  const stats = [
    { label: "Due this week", value: dueThisWeek.length },
    { label: "Overdue deliverables", value: overdue.length },
    { label: "Active deals", value: activeDeals ?? 0 },
  ];

  const money = [
    { label: "Paid this month", value: formatMoneyExact(sum(paidThisMonth)) },
    {
      label: "Outstanding (incl. overdue)",
      value: formatMoneyExact(sum(outstanding)),
    },
    {
      label: "Overdue",
      value: formatMoneyExact(sum(overduePayments)),
      danger: overduePayments.length > 0,
    },
  ];

  return (
    <div>
      <p className="text-sm text-muted-foreground mb-1">Dashboard</p>
      <h1 className="font-display text-3xl md:text-4xl leading-tight mb-10">
        {firstName ? `Hi, ${firstName}.` : "Welcome."}
      </h1>

      <div className="grid gap-4 sm:grid-cols-3 mb-4">
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

      <div className="grid gap-4 sm:grid-cols-3 mb-10">
        {money.map((c) => (
          <Card key={c.label}>
            <CardContent className="pt-5">
              <div className="text-sm text-muted-foreground">{c.label}</div>
              <div
                className={`font-display text-3xl mt-2 tabular-nums ${
                  c.danger ? "text-[var(--cl-danger)]" : ""
                }`}
              >
                {c.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <PaymentList
        title="Owed to you"
        empty="Nothing outstanding — you're all paid up."
        payments={outstanding}
        today={today}
      />

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

function PaymentList({
  title,
  empty,
  payments,
  today,
}: {
  title: string;
  empty: string;
  payments: PaymentWithDeal[];
  today: string;
}) {
  return (
    <section className="mb-8">
      <h2 className="font-display text-xl mb-3">{title}</h2>
      {payments.length === 0 ? (
        <p className="text-sm text-muted-foreground">{empty}</p>
      ) : (
        <div className="space-y-2">
          {payments.map((p) => {
            const eff = effectivePaymentStatus(p, today);
            return (
              <Link
                key={p.id}
                href={p.deals ? `/deals/${p.deals.id}` : "/deals"}
                className="flex items-center justify-between gap-4 rounded-lg border border-[var(--cl-line)] bg-[var(--cl-card)] px-4 py-3 transition hover:border-[var(--cl-accent)]/40"
              >
                <div className="min-w-0">
                  <div className="font-display text-lg tabular-nums">
                    {formatMoneyExact(p.amount, p.currency ?? "USD")}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {p.deals?.title ?? "—"}
                    {p.deals?.brands?.name ? ` · ${p.deals.brands.name}` : ""}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <PaymentStatusBadge status={eff} />
                  <span
                    className={
                      eff === "overdue"
                        ? "text-sm text-[var(--cl-danger)] tabular-nums"
                        : "text-sm text-muted-foreground tabular-nums"
                    }
                  >
                    {formatDate(p.due_date)}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
