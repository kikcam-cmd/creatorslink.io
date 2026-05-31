import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createBrand, updateBrand, deleteBrand } from "@/lib/actions/brands";
import type { Brand } from "@/lib/types";
import { formatDate } from "@/lib/format";
import { Notice } from "@/components/notice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function BrandsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; edit?: string }>;
}) {
  const { error, edit } = await searchParams;
  const { supabase } = await requireUser();

  const { data: brands } = await supabase
    .from("brands")
    .select("*")
    .order("created_at", { ascending: false });
  const { data: dealRows } = await supabase.from("deals").select("brand_id");

  const list = (brands ?? []) as Brand[];
  const dealCounts = new Map<string, number>();
  for (const r of dealRows ?? []) {
    if (r.brand_id) dealCounts.set(r.brand_id, (dealCounts.get(r.brand_id) ?? 0) + 1);
  }

  const editing = edit ? list.find((b) => b.id === edit) : undefined;

  return (
    <div>
      <p className="text-sm text-muted-foreground mb-1">Brands</p>
      <h1 className="font-display text-3xl md:text-4xl leading-tight mb-8">
        {editing ? "Edit brand" : "Brands"}
      </h1>

      {error ? <Notice>{error}</Notice> : null}

      <Card className="mb-10">
        <CardHeader>
          <CardTitle className="font-display text-xl">
            {editing ? `Edit ${editing.name}` : "Add a brand"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form
            action={editing ? updateBrand : createBrand}
            className="grid gap-4 sm:grid-cols-2"
          >
            {editing ? (
              <input type="hidden" name="id" value={editing.id} />
            ) : null}
            <div className="sm:col-span-2">
              <Label htmlFor="name" className="mb-1.5">
                Brand name
              </Label>
              <Input
                id="name"
                name="name"
                required
                defaultValue={editing?.name ?? ""}
                placeholder="e.g. Glow Cosmetics"
              />
            </div>
            <div>
              <Label htmlFor="contact_name" className="mb-1.5">
                Contact name
              </Label>
              <Input
                id="contact_name"
                name="contact_name"
                defaultValue={editing?.contact_name ?? ""}
              />
            </div>
            <div>
              <Label htmlFor="contact_email" className="mb-1.5">
                Contact email
              </Label>
              <Input
                id="contact_email"
                name="contact_email"
                type="email"
                defaultValue={editing?.contact_email ?? ""}
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="notes" className="mb-1.5">
                Notes
              </Label>
              <Textarea
                id="notes"
                name="notes"
                rows={3}
                defaultValue={editing?.notes ?? ""}
              />
            </div>
            <div className="sm:col-span-2 flex gap-3">
              <Button type="submit">
                {editing ? "Save changes" : "Add brand"}
              </Button>
              {editing ? (
                <Button variant="outline" render={<Link href="/brands" />}>
                  Cancel
                </Button>
              ) : null}
            </div>
          </form>
        </CardContent>
      </Card>

      {list.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--cl-line)] p-8 text-center">
          <p className="font-display text-xl mb-1">No brands yet</p>
          <p className="text-sm text-muted-foreground">
            Add the brands you work with, then link deals to them.
          </p>
        </div>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Brand</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead className="text-right">Deals</TableHead>
                <TableHead>Added</TableHead>
                <TableHead className="w-px" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="font-medium">{b.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {b.contact_name || b.contact_email ? (
                      <span>
                        {b.contact_name}
                        {b.contact_name && b.contact_email ? " · " : ""}
                        {b.contact_email}
                      </span>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {dealCounts.get(b.id) ?? 0}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(b.created_at)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        render={<Link href={`/brands?edit=${b.id}`} />}
                      >
                        Edit
                      </Button>
                      <form action={deleteBrand}>
                        <input type="hidden" name="id" value={b.id} />
                        <Button variant="ghost" size="sm" type="submit">
                          Delete
                        </Button>
                      </form>
                    </div>
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
