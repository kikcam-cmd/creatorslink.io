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
  DEAL_STATUSES,
  DEAL_STATUS_LABELS,
  DEAL_TYPE_LABELS,
  DELIVERABLE_STATUSES,
  DELIVERABLE_STATUS_LABELS,
  type Brand,
  type Deal,
  type Deliverable,
} from "@/lib/types";
import { formatDate, formatMoney } from "@/lib/format";
import { DealStatusBadge } from "@/components/status-badge";
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
  }>;
}) {
  const { id } = await params;
  const { error, edit, edit_deliverable } = await searchParams;
  const { supabase } = await requireUser();

  const [{ data: deal }, { data: deliverables }, { data: brands }] =
    await Promise.all([
      supabase.from("deals").select("*, brands(name)").eq("id", id).single(),
      supabase
        .from("deliverables")
        .select("*")
        .eq("deal_id", id)
        .order("due_date", { ascending: true, nullsFirst: false }),
      supabase.from("brands").select("id, name").order("name"),
    ]);

  if (!deal) notFound();

  const d = deal as DealWithBrand;
  const items = (deliverables ?? []) as Deliverable[];
  const brandList = (brands ?? []) as Pick<Brand, "id" | "name">[];
  const editingDeliverable = edit_deliverable
    ? items.find((x) => x.id === edit_deliverable)
    : undefined;

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
                  Total value
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

          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="pt-5">
                <div className="text-sm text-muted-foreground">Value</div>
                <div className="font-display text-2xl mt-1">
                  {formatMoney(d.total_value, d.currency ?? "USD")}
                </div>
              </CardContent>
            </Card>
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
              <Label htmlFor="due_date" className="mb-1.5">
                Due date
              </Label>
              <Input
                id="due_date"
                name="due_date"
                type="date"
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

      {/* ===== Phase 2 / 3 placeholders ===== */}
      <div className="grid gap-4 sm:grid-cols-2 mt-10">
        <Card>
          <CardContent className="pt-5">
            <div className="text-sm font-medium">Payments</div>
            <p className="text-sm text-muted-foreground mt-1">
              Tracking who owes what lands in Phase 2.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="text-sm font-medium">Documents</div>
            <p className="text-sm text-muted-foreground mt-1">
              Contracts &amp; briefs vault lands in Phase 3.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
