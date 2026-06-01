import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { updateDeal, deleteDeal } from "@/lib/actions/deals";
import {
  createDeliverable,
  updateDeliverable,
  setDeliverableStatus,
  deleteDeliverable,
} from "@/lib/actions/deliverables";
import {
  createPayment,
  updatePayment,
  setPaymentStatus,
  deletePayment,
} from "@/lib/actions/payments";
import {
  DEAL_STATUSES,
  DEAL_STATUS_LABELS,
  DEAL_TYPE_LABELS,
  DELIVERABLE_STATUSES,
  DELIVERABLE_STATUS_LABELS,
  PAYMENT_STATUSES,
  PAYMENT_STATUS_LABELS,
  USAGE_RIGHTS_BASIS_SUFFIX,
  effectivePaymentStatus,
  isOutstanding,
  isSubmittedToBrand,
  type Brand,
  type Deal,
  type Deliverable,
  type Payment,
} from "@/lib/types";
import { todayStr } from "@/lib/dates";
import { formatDate, formatMoney, formatMoneyExact } from "@/lib/format";
import { DealStatusBadge, PaymentStatusBadge } from "@/components/status-badge";
import { UsageRightsField } from "@/components/usage-rights-field";
import { DueDateField } from "@/components/due-date-field";
import { Notice } from "@/components/notice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/ui/native-select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type DealWithBrand = Deal & { brands: { name: string } | null };

export default async function DealDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    error?: string;
    edit?: string;
    edit_deliverable?: string;
    edit_payment?: string;
  }>;
}) {
  const { id } = await params;
  const { error, edit, edit_deliverable, edit_payment } = await searchParams;
  const { supabase } = await requireUser();

  const [
    { data: deal },
    { data: deliverables },
    { data: payments },
    { data: brands },
  ] = await Promise.all([
    supabase.from("deals").select("*, brands(name)").eq("id", id).single(),
    supabase
      .from("deliverables")
      .select("*")
      .eq("deal_id", id)
      .order("due_date", { ascending: true, nullsFirst: false }),
    supabase
      .from("payments")
      .select("*")
      .eq("deal_id", id)
      .order("due_date", { ascending: true, nullsFirst: false }),
    supabase.from("brands").select("id, name").order("name"),
  ]);

  if (!deal) notFound();

  const d = deal as DealWithBrand;
  const items = (deliverables ?? []) as Deliverable[];
  const pays = (payments ?? []) as Payment[];
  const brandList = (brands ?? []) as Pick<Brand, "id" | "name">[];
  const editingDeliverable = edit_deliverable
    ? items.find((x) => x.id === edit_deliverable)
    : undefined;
  const editingPayment = edit_payment
    ? pays.find((x) => x.id === edit_payment)
    : undefined;

  const today = todayStr();
  const dealCurrency = d.currency ?? "USD";
  const paidTotal = pays
    .filter((p) => p.status === "paid")
    .reduce((t, p) => t + (Number(p.amount) || 0), 0);
  const outstandingTotal = pays
    .filter(isOutstanding)
    .reduce((t, p) => t + (Number(p.amount) || 0), 0);

  // Submission progress. Numerator = deliverables submitted to the brand;
  // denominator = the contracted target if set, else the rows that exist.
  const submittedCount = items.filter((x) =>
    isSubmittedToBrand(x.status),
  ).length;
  const progressTarget = d.deliverable_target ?? items.length;
  const progressPct =
    progressTarget > 0
      ? Math.min(100, Math.round((submittedCount / progressTarget) * 100))
      : 0;
  const remaining = Math.max(0, progressTarget - submittedCount);

  const byStatus = new Map<string, Deliverable[]>(
    DELIVERABLE_STATUSES.map((s) => [s, [] as Deliverable[]]),
  );
  for (const item of items) byStatus.get(item.status)?.push(item);

  return (
    <div>
      <p className="text-sm text-muted-foreground mb-1">
        <Link href="/deals" className="hover:underline underline-offset-4">
          Deals
        </Link>{" "}
        / {d.title}
      </p>

      {error ? <Notice className="mt-4">{error}</Notice> : null}

      {/* ===== Deal summary / edit ===== */}
      {edit ? (
        <Card className="mb-8 mt-4">
          <CardHeader>
            <CardTitle className="font-display text-xl">Edit deal</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={updateDeal} className="grid gap-4 sm:grid-cols-2">
              <input type="hidden" name="id" value={d.id} />
              <div className="sm:col-span-2">
                <Label htmlFor="title" className="mb-1.5">
                  Title
                </Label>
                <Input id="title" name="title" required defaultValue={d.title} />
              </div>
              <div>
                <Label htmlFor="brand_id" className="mb-1.5">
                  Brand
                </Label>
                <NativeSelect
                  id="brand_id"
                  name="brand_id"
                  defaultValue={d.brand_id ?? ""}
                >
                  <option value="">— No brand —</option>
                  {brandList.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </NativeSelect>
              </div>
              <div>
                <Label htmlFor="type" className="mb-1.5">
                  Type
                </Label>
                <NativeSelect id="type" name="type" defaultValue={d.type}>
                  {Object.entries(DEAL_TYPE_LABELS).map(([v, label]) => (
                    <option key={v} value={v}>
                      {label}
                    </option>
                  ))}
                </NativeSelect>
              </div>
              <div>
                <Label htmlFor="status" className="mb-1.5">
                  Status
                </Label>
                <NativeSelect id="status" name="status" defaultValue={d.status}>
                  {DEAL_STATUSES.map((v) => (
                    <option key={v} value={v}>
                      {DEAL_STATUS_LABELS[v]}
                    </option>
                  ))}
                </NativeSelect>
              </div>
              <div>
                <Label htmlFor="total_value" className="mb-1.5">
                  Retainer Amount
                </Label>
                <Input
                  id="total_value"
                  name="total_value"
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue={d.total_value ?? ""}
                />
              </div>
              <div>
                <Label htmlFor="start_date" className="mb-1.5">
                  Start date
                </Label>
                <Input
                  id="start_date"
                  name="start_date"
                  type="date"
                  defaultValue={d.start_date ?? ""}
                />
              </div>
              <div>
                <Label htmlFor="end_date" className="mb-1.5">
                  End date
                </Label>
                <Input
                  id="end_date"
                  name="end_date"
                  type="date"
                  defaultValue={d.end_date ?? ""}
                />
              </div>
              <div>
                <Label htmlFor="deliverable_target" className="mb-1.5">
                  Number of videos
                </Label>
                <Input
                  id="deliverable_target"
                  name="deliverable_target"
                  type="number"
                  min="0"
                  step="1"
                  defaultValue={d.deliverable_target ?? ""}
                  placeholder="e.g. 10"
                />
              </div>
              <UsageRightsField
                defaultChecked={d.usage_rights}
                defaultAmount={
                  d.usage_rights_amount != null
                    ? String(d.usage_rights_amount)
                    : ""
                }
                defaultBasis={d.usage_rights_basis}
                currency={d.currency ?? "USD"}
              />
              <input type="hidden" name="currency" value={d.currency ?? "USD"} />
              <div className="sm:col-span-2">
                <Label htmlFor="notes" className="mb-1.5">
                  Notes
                </Label>
                <Textarea
                  id="notes"
                  name="notes"
                  rows={3}
                  defaultValue={d.notes ?? ""}
                />
              </div>
              <div className="sm:col-span-2 flex gap-3">
                <Button type="submit">Save changes</Button>
                <Button variant="outline" render={<Link href={`/deals/${d.id}`} />}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <div className="mt-4 mb-8">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
            <div>
              <h1 className="font-display text-3xl md:text-4xl leading-tight mb-2">
                {d.title}
              </h1>
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <DealStatusBadge status={d.status} />
                <span>{DEAL_TYPE_LABELS[d.type]}</span>
                {d.brands?.name ? <span>· {d.brands.name}</span> : null}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                render={<Link href={`/deals/${d.id}?edit=1`} />}
              >
                Edit deal
              </Button>
              <form action={deleteDeal}>
                <input type="hidden" name="id" value={d.id} />
                <Button variant="outline" size="sm" type="submit">
                  Delete
                </Button>
              </form>
            </div>
          </div>

          <div
            className={`grid gap-4 ${
              d.usage_rights ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-3"
            }`}
          >
            <Card>
              <CardContent className="pt-5">
                <div className="text-sm text-muted-foreground">
                  Retainer Amount
                </div>
                <div className="font-display text-2xl mt-1">
                  {formatMoney(d.total_value, d.currency ?? "USD")}
                </div>
              </CardContent>
            </Card>
            {d.usage_rights ? (
              <Card>
                <CardContent className="pt-5">
                  <div className="text-sm text-muted-foreground">
                    Usage rights
                  </div>
                  <div className="font-display text-2xl mt-1">
                    {d.usage_rights_amount != null ? (
                      <>
                        {formatMoneyExact(
                          d.usage_rights_amount,
                          d.currency ?? "USD",
                        )}
                        {d.usage_rights_basis ? (
                          <span className="text-sm text-muted-foreground">
                            {" "}
                            {USAGE_RIGHTS_BASIS_SUFFIX[d.usage_rights_basis]}
                          </span>
                        ) : null}
                      </>
                    ) : (
                      "—"
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : null}
            <Card>
              <CardContent className="pt-5">
                <div className="text-sm text-muted-foreground">Start</div>
                <div className="font-display text-2xl mt-1">
                  {formatDate(d.start_date)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5">
                <div className="text-sm text-muted-foreground">End</div>
                <div className="font-display text-2xl mt-1">
                  {formatDate(d.end_date)}
                </div>
              </CardContent>
            </Card>
          </div>

          {d.notes ? (
            <p className="mt-4 text-sm text-muted-foreground whitespace-pre-wrap">
              {d.notes}
            </p>
          ) : null}
        </div>
      )}

      {/* ===== Submission progress ===== */}
      {progressTarget > 0 ? (
        <div className="mb-8 rounded-xl border border-[var(--cl-line)] bg-[var(--cl-card)] p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Deliverables submitted</span>
            <span className="text-sm tabular-nums">
              {submittedCount}/{progressTarget}
              {d.deliverable_target == null ? (
                <span className="text-muted-foreground"> (no target set)</span>
              ) : remaining > 0 ? (
                <span className="text-muted-foreground">
                  {" "}
                  · {remaining} remaining
                </span>
              ) : (
                <span className="text-[var(--cl-accent-ink)]"> · complete</span>
              )}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-[var(--cl-accent)] transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      ) : null}

      {/* ===== Add / edit deliverable ===== */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="font-display text-xl">
            {editingDeliverable ? "Edit deliverable" : "Add a deliverable"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form
            action={editingDeliverable ? updateDeliverable : createDeliverable}
            className="grid gap-4 sm:grid-cols-2"
          >
            <input type="hidden" name="deal_id" value={d.id} />
            {editingDeliverable ? (
              <input type="hidden" name="id" value={editingDeliverable.id} />
            ) : null}
            <div className="sm:col-span-2">
              <Label htmlFor="dtitle" className="mb-1.5">
                Title
              </Label>
              <Input
                id="dtitle"
                name="title"
                required
                defaultValue={editingDeliverable?.title ?? ""}
                placeholder="e.g. TikTok #1 — unboxing"
              />
            </div>
            <div>
              <Label htmlFor="platform" className="mb-1.5">
                Platform
              </Label>
              <Input
                id="platform"
                name="platform"
                defaultValue={editingDeliverable?.platform ?? ""}
                placeholder="TikTok, Instagram…"
              />
            </div>
            <div>
              <DueDateField
                defaultChecked={editingDeliverable?.due_date != null}
                defaultValue={editingDeliverable?.due_date ?? ""}
              />
            </div>
            <div>
              <Label htmlFor="dstatus" className="mb-1.5">
                Status
              </Label>
              <NativeSelect
                id="dstatus"
                name="status"
                defaultValue={editingDeliverable?.status ?? "todo"}
              >
                {DELIVERABLE_STATUSES.map((v) => (
                  <option key={v} value={v}>
                    {DELIVERABLE_STATUS_LABELS[v]}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <div>
              <Label htmlFor="content_url" className="mb-1.5">
                Content URL
              </Label>
              <Input
                id="content_url"
                name="content_url"
                type="url"
                defaultValue={editingDeliverable?.content_url ?? ""}
                placeholder="https://…"
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="description" className="mb-1.5">
                Description
              </Label>
              <Textarea
                id="description"
                name="description"
                rows={2}
                defaultValue={editingDeliverable?.description ?? ""}
              />
            </div>
            <div className="sm:col-span-2 flex gap-3">
              <Button type="submit">
                {editingDeliverable ? "Save deliverable" : "Add deliverable"}
              </Button>
              {editingDeliverable ? (
                <Button
                  variant="outline"
                  render={<Link href={`/deals/${d.id}`} />}
                >
                  Cancel
                </Button>
              ) : null}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* ===== Deliverables board ===== */}
      <h2 className="font-display text-2xl mb-4">
        Deliverables{" "}
        <span className="text-muted-foreground text-lg">({items.length})</span>
      </h2>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--cl-line)] p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No deliverables yet. Add the first one above.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 items-start">
          {DELIVERABLE_STATUSES.map((status) => {
            const col = byStatus.get(status) ?? [];
            return (
              <div key={status} className="rounded-xl bg-muted/60 p-3">
                <div className="flex items-center justify-between px-1 mb-3">
                  <span className="text-sm font-medium">
                    {DELIVERABLE_STATUS_LABELS[status]}
                  </span>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {col.length}
                  </span>
                </div>
                <div className="space-y-3">
                  {col.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-lg border border-[var(--cl-line)] bg-[var(--cl-card)] p-3"
                    >
                      <div className="text-sm font-medium leading-snug">
                        {item.title}
                      </div>
                      <div className="mt-1 flex flex-wrap gap-x-2 text-xs text-muted-foreground">
                        {item.platform ? <span>{item.platform}</span> : null}
                        {item.due_date ? (
                          <span>· due {formatDate(item.due_date)}</span>
                        ) : null}
                      </div>
                      {item.content_url ? (
                        <a
                          href={item.content_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 block text-xs text-[var(--cl-accent)] hover:underline underline-offset-4 truncate"
                        >
                          View content ↗
                        </a>
                      ) : null}

                      <form action={setDeliverableStatus} className="mt-3">
                        <input type="hidden" name="id" value={item.id} />
                        <input type="hidden" name="deal_id" value={d.id} />
                        <div className="flex items-center gap-1.5">
                          <NativeSelect
                            name="status"
                            defaultValue={item.status}
                            className="h-7 text-xs"
                          >
                            {DELIVERABLE_STATUSES.map((v) => (
                              <option key={v} value={v}>
                                {DELIVERABLE_STATUS_LABELS[v]}
                              </option>
                            ))}
                          </NativeSelect>
                          <Button type="submit" size="xs" variant="outline">
                            Move
                          </Button>
                        </div>
                      </form>

                      <div className="mt-2 flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="xs"
                          render={
                            <Link
                              href={`/deals/${d.id}?edit_deliverable=${item.id}`}
                            />
                          }
                        >
                          Edit
                        </Button>
                        <form action={deleteDeliverable}>
                          <input type="hidden" name="id" value={item.id} />
                          <input type="hidden" name="deal_id" value={d.id} />
                          <Button variant="ghost" size="xs" type="submit">
                            Delete
                          </Button>
                        </form>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ===== Payments ===== */}
      <div className="mt-10 flex flex-wrap items-end justify-between gap-3 mb-4">
        <h2 className="font-display text-2xl">
          Payments{" "}
          <span className="text-muted-foreground text-lg">({pays.length})</span>
        </h2>
        <div className="flex gap-6 text-sm">
          <div>
            <span className="text-muted-foreground">Paid </span>
            <span className="tabular-nums font-medium">
              {formatMoneyExact(paidTotal, dealCurrency)}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Outstanding </span>
            <span className="tabular-nums font-medium">
              {formatMoneyExact(outstandingTotal, dealCurrency)}
            </span>
          </div>
        </div>
      </div>

      {/* Add / edit payment */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="font-display text-xl">
            {editingPayment ? "Edit payment" : "Add a payment"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form
            action={editingPayment ? updatePayment : createPayment}
            className="grid gap-4 sm:grid-cols-2"
          >
            <input type="hidden" name="deal_id" value={d.id} />
            <input type="hidden" name="currency" value={dealCurrency} />
            {editingPayment ? (
              <input type="hidden" name="id" value={editingPayment.id} />
            ) : null}
            <div>
              <Label htmlFor="amount" className="mb-1.5">
                Amount ({dealCurrency})
              </Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                min="0"
                step="0.01"
                required
                defaultValue={
                  editingPayment ? String(editingPayment.amount) : ""
                }
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="pstatus" className="mb-1.5">
                Status
              </Label>
              <NativeSelect
                id="pstatus"
                name="status"
                defaultValue={editingPayment?.status ?? "expected"}
              >
                {PAYMENT_STATUSES.map((v) => (
                  <option key={v} value={v}>
                    {PAYMENT_STATUS_LABELS[v]}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <div>
              <Label htmlFor="pdue_date" className="mb-1.5">
                Due date
              </Label>
              <Input
                id="pdue_date"
                name="due_date"
                type="date"
                defaultValue={editingPayment?.due_date ?? ""}
              />
            </div>
            <div>
              <Label htmlFor="paid_date" className="mb-1.5">
                Paid date{" "}
                <span className="text-muted-foreground font-normal">
                  (auto-set when marked paid)
                </span>
              </Label>
              <Input
                id="paid_date"
                name="paid_date"
                type="date"
                defaultValue={editingPayment?.paid_date ?? ""}
              />
            </div>
            <div className="sm:col-span-2 flex gap-3">
              <Button type="submit">
                {editingPayment ? "Save payment" : "Add payment"}
              </Button>
              {editingPayment ? (
                <Button
                  variant="outline"
                  render={<Link href={`/deals/${d.id}`} />}
                >
                  Cancel
                </Button>
              ) : null}
            </div>
          </form>
        </CardContent>
      </Card>

      {pays.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--cl-line)] p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No payments tracked yet. Add what this deal pays — and when — above.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[var(--cl-line)]">
          {pays.map((p, i) => {
            const eff = effectivePaymentStatus(p, today);
            return (
              <div
                key={p.id}
                className={`flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 ${
                  i > 0 ? "border-t border-[var(--cl-line)]" : ""
                }`}
              >
                <div className="font-display text-lg tabular-nums w-28">
                  {formatMoneyExact(p.amount, p.currency ?? dealCurrency)}
                </div>
                <PaymentStatusBadge status={eff} />
                <div className="text-sm text-muted-foreground min-w-0 flex-1">
                  {p.status === "paid"
                    ? `Paid ${formatDate(p.paid_date)}`
                    : `Due ${formatDate(p.due_date)}`}
                </div>

                <form action={setPaymentStatus} className="flex items-center gap-1.5">
                  <input type="hidden" name="id" value={p.id} />
                  <input type="hidden" name="deal_id" value={d.id} />
                  <NativeSelect
                    name="status"
                    defaultValue={p.status}
                    className="h-7 text-xs"
                  >
                    {PAYMENT_STATUSES.map((v) => (
                      <option key={v} value={v}>
                        {PAYMENT_STATUS_LABELS[v]}
                      </option>
                    ))}
                  </NativeSelect>
                  <Button type="submit" size="xs" variant="outline">
                    Set
                  </Button>
                </form>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="xs"
                    render={
                      <Link href={`/deals/${d.id}?edit_payment=${p.id}`} />
                    }
                  >
                    Edit
                  </Button>
                  <form action={deletePayment}>
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="deal_id" value={d.id} />
                    <Button variant="ghost" size="xs" type="submit">
                      Delete
                    </Button>
                  </form>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ===== Phase 3 placeholder ===== */}
      <Card className="mt-10">
        <CardContent className="pt-5">
          <div className="text-sm font-medium">Documents</div>
          <p className="text-sm text-muted-foreground mt-1">
            Contracts &amp; briefs vault lands in Phase 3.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
