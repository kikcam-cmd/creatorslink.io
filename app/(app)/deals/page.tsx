import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createDeal } from "@/lib/actions/deals";
import {
  DEAL_STATUSES,
  DEAL_STATUS_LABELS,
  DEAL_TYPE_LABELS,
  type Brand,
  type Deal,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type DealWithBrand = Deal & { brands: { name: string } | null };

export default async function DealsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const { supabase } = await requireUser();

  const [{ data: deals }, { data: brands }] = await Promise.all([
    supabase
      .from("deals")
      .select("*, brands(name)")
      .order("created_at", { ascending: false }),
    supabase.from("brands").select("id, name").order("name"),
  ]);

  const list = (deals ?? []) as DealWithBrand[];
  const brandList = (brands ?? []) as Pick<Brand, "id" | "name">[];

  return (
    <div>
      <p className="text-sm text-muted-foreground mb-1">Deals</p>
      <h1 className="font-display text-3xl md:text-4xl leading-tight mb-8">
        Deals
      </h1>

      {error ? <Notice>{error}</Notice> : null}

      <Card className="mb-10">
        <CardHeader>
          <CardTitle className="font-display text-xl">New deal</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createDeal} className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="title" className="mb-1.5">
                Title
              </Label>
              <Input
                id="title"
                name="title"
                required
                placeholder="e.g. Summer campaign — 3 TikToks"
              />
            </div>
            <div>
              <Label htmlFor="brand_id" className="mb-1.5">
                Brand
              </Label>
              <NativeSelect id="brand_id" name="brand_id" defaultValue="">
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
              <NativeSelect id="type" name="type" defaultValue="one_off">
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
              <NativeSelect id="status" name="status" defaultValue="negotiating">
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
                placeholder="0"
              />
            </div>
            <div>
              <Label htmlFor="start_date" className="mb-1.5">
                Start date
              </Label>
              <Input id="start_date" name="start_date" type="date" />
            </div>
            <div>
              <Label htmlFor="end_date" className="mb-1.5">
                End date
              </Label>
              <Input id="end_date" name="end_date" type="date" />
            </div>
            <input type="hidden" name="currency" value="USD" />
            <div className="sm:col-span-2">
              <Label htmlFor="notes" className="mb-1.5">
                Notes
              </Label>
              <Textarea id="notes" name="notes" rows={3} />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit">Create deal</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {list.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--cl-line)] p-8 text-center">
          <p className="font-display text-xl mb-1">No deals yet</p>
          <p className="text-sm text-muted-foreground">
            Create your first deal above, then add its deliverables.
          </p>
        </div>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Deal</TableHead>
                <TableHead>Brand</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Value</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/deals/${d.id}`}
                      className="hover:text-[var(--cl-accent)] hover:underline underline-offset-4"
                    >
                      {d.title}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {d.brands?.name ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {DEAL_TYPE_LABELS[d.type]}
                  </TableCell>
                  <TableCell>
                    <DealStatusBadge status={d.status} />
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatMoney(d.total_value, d.currency ?? "USD")}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(d.created_at)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
