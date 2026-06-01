import type { SupabaseClient } from "@supabase/supabase-js";
import {
  OPEN_DELIVERABLE_STATUSES,
  isOutstanding,
  type DeliverableStatus,
  type PaymentStatus,
} from "@/lib/types";

// One creator's reminder digest for a given day. Built only when it has at
// least one item — an empty digest is never emailed (no "you have nothing"
// noise; the daily-habit hook only fires when there's something to act on).
export type ReminderDigest = {
  userId: string;
  email: string;
  firstName: string;
  overdueDeliverables: DeliverableItem[];
  dueSoonDeliverables: DeliverableItem[];
  overduePayments: PaymentItem[];
  dueSoonPayments: PaymentItem[];
  total: number;
};

export type DeliverableItem = {
  id: string;
  title: string;
  dueDate: string;
  dealId: string | null;
  dealTitle: string | null;
  brandName: string | null;
};

export type PaymentItem = {
  id: string;
  amount: number | string;
  currency: string | null;
  dueDate: string;
  dealId: string | null;
  dealTitle: string | null;
  brandName: string | null;
};

type DealJoin = { id: string; title: string; brands: { name: string } | null } | null;

type DeliverableRow = {
  id: string;
  owner_id: string;
  title: string;
  due_date: string;
  status: DeliverableStatus;
  deals: DealJoin;
};

type PaymentRow = {
  id: string;
  owner_id: string;
  amount: number | string;
  currency: string | null;
  due_date: string;
  status: PaymentStatus;
  deals: DealJoin;
};

// Build every non-empty digest for the run. `today` / `weekEnd` are passed in
// (from lib/dates) so the timezone assumption stays centralized — same window
// as the dashboard's "Due this week" (today .. today+7), so the email and the
// app agree. Uses the service-role client: it reads across all creators
// (bypassing RLS) and joins auth.users for the email, neither of which a
// session-scoped client can do.
export async function buildDigests(
  admin: SupabaseClient,
  today: string,
  weekEnd: string,
): Promise<ReminderDigest[]> {
  // Only creators who haven't opted out.
  const { data: profiles, error: pErr } = await admin
    .from("profiles")
    .select("id, display_name, email_reminders")
    .eq("email_reminders", true);
  if (pErr) throw new Error(`profiles query failed: ${pErr.message}`);

  const optedIn = new Map(
    (profiles ?? []).map((p) => [
      p.id as string,
      ((p.display_name as string | null) ?? "").split(" ")[0],
    ]),
  );
  if (optedIn.size === 0) return [];

  // Relevant deliverables: open + dated + due on/before the 7-day horizon
  // (this set already contains everything overdue, since overdue < today < weekEnd).
  const { data: delivs, error: dErr } = await admin
    .from("deliverables")
    .select("id, owner_id, title, due_date, status, deals(id, title, brands(name))")
    .in("status", OPEN_DELIVERABLE_STATUSES)
    .not("due_date", "is", null)
    .lte("due_date", weekEnd)
    .order("due_date", { ascending: true });
  if (dErr) throw new Error(`deliverables query failed: ${dErr.message}`);

  // Relevant payments: outstanding (expected/invoiced) + dated + due on/before
  // the horizon. "overdue" is derived (D-017), never a stored status.
  const { data: pays, error: payErr } = await admin
    .from("payments")
    .select("id, owner_id, amount, currency, due_date, status, deals(id, title, brands(name))")
    .in("status", ["expected", "invoiced"])
    .not("due_date", "is", null)
    .lte("due_date", weekEnd)
    .order("due_date", { ascending: true });
  if (payErr) throw new Error(`payments query failed: ${payErr.message}`);

  // Emails live in auth.users, not queryable via PostgREST — pull them with the
  // admin API and map id -> email (paginated to be safe as the user base grows).
  const emailById = new Map<string, string>();
  for (let page = 1; ; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw new Error(`listUsers failed: ${error.message}`);
    for (const u of data.users) if (u.email) emailById.set(u.id, u.email);
    if (data.users.length < 1000) break;
  }

  const toDeliverable = (r: DeliverableRow): DeliverableItem => ({
    id: r.id,
    title: r.title,
    dueDate: r.due_date,
    dealId: r.deals?.id ?? null,
    dealTitle: r.deals?.title ?? null,
    brandName: r.deals?.brands?.name ?? null,
  });
  const toPayment = (r: PaymentRow): PaymentItem => ({
    id: r.id,
    amount: r.amount,
    currency: r.currency,
    dueDate: r.due_date,
    dealId: r.deals?.id ?? null,
    dealTitle: r.deals?.title ?? null,
    brandName: r.deals?.brands?.name ?? null,
  });

  const digests: ReminderDigest[] = [];
  for (const [userId, firstName] of optedIn) {
    const email = emailById.get(userId);
    if (!email) continue; // no address → nothing to send

    // Cast through unknown: the untyped admin client infers the `deals` embed
    // as an array, but a deliverable/payment → deal is a to-one FK, so PostgREST
    // returns a single object (or null) at runtime — which DeliverableRow models.
    const myDelivs = ((delivs ?? []) as unknown as DeliverableRow[]).filter(
      (r) => r.owner_id === userId,
    );
    const myPays = ((pays ?? []) as unknown as PaymentRow[]).filter(
      (r) => r.owner_id === userId && isOutstanding(r),
    );

    const overdueDeliverables = myDelivs
      .filter((r) => r.due_date < today)
      .map(toDeliverable);
    const dueSoonDeliverables = myDelivs
      .filter((r) => r.due_date >= today)
      .map(toDeliverable);
    const overduePayments = myPays
      .filter((r) => r.due_date < today)
      .map(toPayment);
    const dueSoonPayments = myPays
      .filter((r) => r.due_date >= today)
      .map(toPayment);

    const total =
      overdueDeliverables.length +
      dueSoonDeliverables.length +
      overduePayments.length +
      dueSoonPayments.length;
    if (total === 0) continue; // never email an empty digest

    digests.push({
      userId,
      email,
      firstName,
      overdueDeliverables,
      dueSoonDeliverables,
      overduePayments,
      dueSoonPayments,
      total,
    });
  }

  return digests;
}
