// Row types mirroring supabase/migrations/0001_init.sql.
// Hand-maintained for now; can be swapped for generated types later.

export type DealType = "one_off" | "retainer";
export type DealStatus = "negotiating" | "active" | "completed" | "cancelled";
export type UsageRightsBasis = "per_video" | "package";
export type DeliverableStatus =
  | "todo"
  | "in_progress"
  | "submitted"
  | "approved"
  | "revision";
export type PaymentStatus = "expected" | "invoiced" | "paid" | "overdue";
export type DocumentType = "contract" | "brief" | "invoice" | "other";

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
  total_value: number | null; // the retainer amount (UI label: "Retainer Amount")
  currency: string | null;
  notes: string | null;
  // How many deliverables (videos) the deal is contracted for; drives the
  // submission progress bar. Null = no agreed count.
  deliverable_target: number | null;
  // Usage rights: a separately-priced component of the deal (D-018).
  usage_rights: boolean;
  usage_rights_amount: number | string | null;
  usage_rights_basis: UsageRightsBasis | null;
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

export type Document = {
  id: string;
  owner_id: string;
  deal_id: string | null;
  name: string; // display name (original filename unless the creator overrode it)
  storage_path: string; // key in the private `documents` bucket — never the filename (D-020)
  type: DocumentType | null;
  created_at: string;
};

export const DOCUMENT_TYPES: DocumentType[] = [
  "contract",
  "brief",
  "invoice",
  "other",
];

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  contract: "Contract",
  brief: "Brief",
  invoice: "Invoice",
  other: "Other",
};

// Upload constraints (D-020). The upload runs through a server action, so it
// must stay under next.config's serverActions.bodySizeLimit ("4mb" = 4,194,304B)
// AND Vercel's ~4.5MB serverless request-body cap. This app-level cap sits
// *below* bodySizeLimit (4,000,000 < 4,194,304) on purpose: bodySizeLimit gates
// the WHOLE multipart body (file + boundaries + the name/type fields), so a file
// sized exactly at the limit would push the body over it and trip Next's own
// error before this action runs — leaving headroom keeps our friendly message
// the one the user sees. The bucket's file_size_limit (4 MiB) is the backstop.
// Large-file uploads (direct-to-storage via a signed upload URL, bypassing the
// function body) are deferred — see D-020.
export const MAX_DOCUMENT_BYTES = 4_000_000; // ~3.8 MiB, under the 4mb body limit

export const ALLOWED_DOCUMENT_MIME: string[] = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
];

// `accept` attribute for the file <input> — mirrors the bucket's allowed_mime_types.
export const DOCUMENT_ACCEPT = ALLOWED_DOCUMENT_MIME.join(",");

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

export const USAGE_RIGHTS_BASES: UsageRightsBasis[] = ["per_video", "package"];

export const USAGE_RIGHTS_BASIS_LABELS: Record<UsageRightsBasis, string> = {
  per_video: "Per video",
  package: "Package",
};

// Suffix appended after the amount when displaying usage rights, e.g.
// "$250.00 / video" or "$1,000.00 (package)".
export const USAGE_RIGHTS_BASIS_SUFFIX: Record<UsageRightsBasis, string> = {
  per_video: "/ video",
  package: "(package)",
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

// "Submitted to the brand": has been sent at least once. `revision` still
// counts — it was submitted, the brand just wants changes. Drives the deal's
// submission progress bar (submitted ÷ deliverable_target). Forward-compatible
// with the real brand-portal submission flow (a "submit" action will move a
// deliverable into one of these states).
export const SUBMITTED_DELIVERABLE_STATUSES: DeliverableStatus[] = [
  "submitted",
  "approved",
  "revision",
];

export function isSubmittedToBrand(status: DeliverableStatus): boolean {
  return SUBMITTED_DELIVERABLE_STATUSES.includes(status);
}

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
