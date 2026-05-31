"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { num, s, sn, withError } from "@/lib/form";

const dealSchema = z.object({
  title: z.string().min(1, "Deal title is required"),
  brand_id: z.string().uuid("Invalid brand").nullable(),
  type: z.enum(["one_off", "retainer"]),
  status: z.enum(["negotiating", "active", "completed", "cancelled"]),
  start_date: z.string().nullable(),
  end_date: z.string().nullable(),
  total_value: z.number().nonnegative("Value can't be negative").nullable(),
  currency: z.string().min(1),
  notes: z.string().nullable(),
});

function parse(fd: FormData) {
  const currency = s(fd, "currency");
  return dealSchema.safeParse({
    title: s(fd, "title"),
    brand_id: sn(fd, "brand_id"),
    type: s(fd, "type"),
    status: s(fd, "status"),
    start_date: sn(fd, "start_date"),
    end_date: sn(fd, "end_date"),
    total_value: num(fd, "total_value"),
    currency: currency || "USD",
    notes: sn(fd, "notes"),
  });
}

export async function createDeal(fd: FormData) {
  const { supabase, user } = await requireUser();
  const parsed = parse(fd);
  if (!parsed.success) {
    redirect(withError("/deals", parsed.error.issues[0].message));
  }

  const { data, error } = await supabase
    .from("deals")
    .insert({ owner_id: user.id, ...parsed.data })
    .select("id")
    .single();
  if (error) redirect(withError("/deals", error.message));

  revalidatePath("/deals");
  redirect(`/deals/${data.id}`);
}

export async function updateDeal(fd: FormData) {
  const { supabase } = await requireUser();
  const id = s(fd, "id");
  if (!id) redirect(withError("/deals", "Missing deal id"));

  const parsed = parse(fd);
  if (!parsed.success) {
    redirect(withError(`/deals/${id}?edit=1`, parsed.error.issues[0].message));
  }

  const { error } = await supabase.from("deals").update(parsed.data).eq("id", id);
  if (error) redirect(withError(`/deals/${id}?edit=1`, error.message));

  revalidatePath("/deals");
  revalidatePath(`/deals/${id}`);
  redirect(`/deals/${id}`);
}

export async function deleteDeal(fd: FormData) {
  const { supabase } = await requireUser();
  const id = s(fd, "id");
  if (!id) redirect(withError("/deals", "Missing deal id"));

  // Deliverables/payments/documents cascade-delete via FK in 0001_init.sql.
  const { error } = await supabase.from("deals").delete().eq("id", id);
  if (error) redirect(withError(`/deals/${id}`, error.message));

  revalidatePath("/deals");
  redirect("/deals");
}
