// Row types mirroring supabase/migrations/0001_init.sql.
// Hand-maintained for now; can be swapped for generated types later.

export type DealType = "one_off" | "retainer";
export type DealStatus = "negotiating" | "active" | "completed" | "cancelled";
export type DeliverableStatus =
  | "todo"
  | "in_progress"
  | "submitted"
  | "approved"
  | "revision";
export type PaymentStatus = "expected" | "invoiced" | "paid" | "overdue";

export type Brand = {
  id: string;
  owner_id: string;
  name: string;
  contact_name: string | null;
  contact_email: string | null;
  notes: string | null;
  created_at: string;
};

export type Deal = {
  id: string;
  owner_id: string;
  brand_id: string | null;
  title: string;
  type: DealType;
  status: DealStatus;
  start_date: string | null;
  end_date: string | null;
  total_value: number | null;
  currency: string | null;
  notes: string | null;
  created_at: string;
};

export type Deliverable = {
  id: string;
  owner_id: string;
  deal_id: string;
  title: string;
  description: string | null;
  platform: string | null;
  due_date: string | null;
  status: DeliverableStatus;
  content_url: string | null;
  created_at: string;
};

export type Payment = {
  id: string;
  owner_id: string;
  deal_id: string;
  // numeric in Postgres → arrives as number | string.
  amount: number | string;
  currency: string | null;
  due_date: string | null;
  status: PaymentStatus;
  paid_date: string | null;
  created_at: string;
};

export const DEAL_TYPE_LABELS: Record<DealType, string> = {
  one_off: "One-off",
  retainer: "Retainer",
};

export const DEAL_STATUSES: DealStatus[] = [
  "negotiating",
  "active",
  "completed",
  "cancelled",
];

export const DEAL_STATUS_LABELS: Record<DealStatus, string> = {
  negotiating: "Negotiating",
  active: "Active",
  completed: "Completed",
  cancelled: "Cancelled",
};

// Order is the board flow, left → right.
export const DELIVERABLE_STATUSES: DeliverableStatus[] = [
  "todo",
  "in_progress",
  "submitted",
  "approved",
  "revision",
];

export const DELIVERABLE_STATUS_LABELS: Record<DeliverableStatus, string> = {
  todo: "To do",
  in_progress: "In progress",
  submitted: "Submitted",
  approved: "Approved",
  revision: "Revision",
};

// A deliverable counts as "open" (needs attention) unless approved.
export const OPEN_DELIVERABLE_STATUSES: DeliverableStatus[] = [
  "todo",
  "in_progress",
  "submitted",
  "revision",
];

// Selectable payment statuses. "overdue" is intentionally ABSENT — it is never
// stored, only derived for display (D-017). A creator sets the workflow state;
// overdue is computed from due_date + status so it can't go stale.
export const PAYMENT_STATUSES: PaymentStatus[] = [
  "expected",
  "invoiced",
  "paid",
];

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  expected: "Expected",
  invoiced: "Invoiced",
  paid: "Paid",
  overdue: "Overdue",
};

// "Outstanding" = owed but not yet paid (expected + invoiced). Overdue is the
// past-due *subset* of outstanding, not a separate bucket.
export function isOutstanding(p: { status: PaymentStatus }): boolean {
  return p.status === "expected" || p.status === "invoiced";
}

// Derived overdue: an unpaid payment whose due date is in the past. `today` is
// passed in (from lib/dates) so the timezone assumption stays centralized.
export function isPaymentOverdue(
  p: { status: PaymentStatus; due_date: string | null },
  today: string,
): boolean {
  return isOutstanding(p) && !!p.due_date && p.due_date < today;
}

// The status to *display*: the stored status, upgraded to "overdue" when due.
export function effectivePaymentStatus(
  p: { status: PaymentStatus; due_date: string | null },
  today: string,
): PaymentStatus {
  return isPaymentOverdue(p, today) ? "overdue" : p.status;
}
