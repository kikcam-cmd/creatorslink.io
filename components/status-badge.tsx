import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  DEAL_STATUS_LABELS,
  DELIVERABLE_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  type DealStatus,
  type DeliverableStatus,
  type PaymentStatus,
} from "@/lib/types";

const DELIVERABLE_CLASSES: Record<DeliverableStatus, string> = {
  todo: "bg-muted text-muted-foreground",
  in_progress: "bg-amber-100 text-amber-900",
  submitted: "bg-blue-100 text-blue-900",
  approved: "bg-[var(--cl-accent)]/12 text-[var(--cl-accent-ink)]",
  revision: "bg-[var(--cl-danger)]/10 text-[var(--cl-danger)]",
};

const DEAL_CLASSES: Record<DealStatus, string> = {
  negotiating: "bg-amber-100 text-amber-900",
  active: "bg-[var(--cl-accent)]/12 text-[var(--cl-accent-ink)]",
  completed: "bg-muted text-muted-foreground",
  cancelled: "bg-[var(--cl-danger)]/10 text-[var(--cl-danger)]",
};

// `status` here is the *effective* status (see effectivePaymentStatus), so it
// can be "overdue" even though that's never stored on the row.
const PAYMENT_CLASSES: Record<PaymentStatus, string> = {
  expected: "bg-muted text-muted-foreground",
  invoiced: "bg-blue-100 text-blue-900",
  paid: "bg-[var(--cl-accent)]/12 text-[var(--cl-accent-ink)]",
  overdue: "bg-[var(--cl-danger)]/10 text-[var(--cl-danger)]",
};

export function DeliverableStatusBadge({
  status,
  className,
}: {
  status: DeliverableStatus;
  className?: string;
}) {
  return (
    <Badge className={cn(DELIVERABLE_CLASSES[status], className)}>
      {DELIVERABLE_STATUS_LABELS[status]}
    </Badge>
  );
}

export function DealStatusBadge({
  status,
  className,
}: {
  status: DealStatus;
  className?: string;
}) {
  return (
    <Badge className={cn(DEAL_CLASSES[status], className)}>
      {DEAL_STATUS_LABELS[status]}
    </Badge>
  );
}

export function PaymentStatusBadge({
  status,
  className,
}: {
  status: PaymentStatus;
  className?: string;
}) {
  return (
    <Badge className={cn(PAYMENT_CLASSES[status], className)}>
      {PAYMENT_STATUS_LABELS[status]}
    </Badge>
  );
}
