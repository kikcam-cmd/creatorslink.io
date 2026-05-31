"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { s, sn, withError } from "@/lib/form";

const STATUS = z.enum([
  "todo",
  "in_progress",
  "submitted",
  "approved",
  "revision",
]);

const deliverableSchema = z.object({
  title: z.string().min(1, "Deliverable title is required"),
  description: z.string().nullable(),
  platform: z.string().nullable(),
  due_date: z.string().nullable(),
  status: STATUS,
  content_url: z.string().url("Content URL looks invalid").nullable(),
});

function parse(fd: FormData) {
  return deliverableSchema.safeParse({
    title: s(fd, "title"),
    description: sn(fd, "description"),
    platform: sn(fd, "platform"),
    due_date: sn(fd, "due_date"),
    status: s(fd, "status") || "todo",
    content_url: sn(fd, "content_url"),
  });
}

export async function createDeliverable(fd: FormData) {
  const { supabase, user } = await requireUser();
  const dealId = s(fd, "deal_id");
  if (!dealId) redirect(withError("/deals", "Missing deal id"));

  const parsed = parse(fd);
  if (!parsed.success) {
    redirect(withError(`/deals/${dealId}`, parsed.error.issues[0].message));
  }

  const { error } = await supabase
    .from("deliverables")
    .insert({ owner_id: user.id, deal_id: dealId, ...parsed.data });
  if (error) redirect(withError(`/deals/${dealId}`, error.message));

  revalidatePath(`/deals/${dealId}`);
  revalidatePath("/dashboard");
  redirect(`/deals/${dealId}`);
}

export async function updateDeliverable(fd: FormData) {
  const { supabase } = await requireUser();
  const id = s(fd, "id");
  const dealId = s(fd, "deal_id");
  if (!id || !dealId) redirect(withError("/deals", "Missing deliverable id"));

  const parsed = parse(fd);
  if (!parsed.success) {
    redirect(
      withError(`/deals/${dealId}?edit_deliverable=${id}`, parsed.error.issues[0].message),
    );
  }

  const { error } = await supabase
    .from("deliverables")
    .update(parsed.data)
    .eq("id", id);
  if (error) redirect(withError(`/deals/${dealId}`, error.message));

  revalidatePath(`/deals/${dealId}`);
  revalidatePath("/dashboard");
  redirect(`/deals/${dealId}`);
}

// Quick status change from the board (single field).
export async function setDeliverableStatus(fd: FormData) {
  const { supabase } = await requireUser();
  const id = s(fd, "id");
  const dealId = s(fd, "deal_id");
  const status = STATUS.safeParse(s(fd, "status"));
  if (!id || !dealId) redirect(withError("/deals", "Missing deliverable id"));
  if (!status.success) redirect(withError(`/deals/${dealId}`, "Invalid status"));

  const { error } = await supabase
    .from("deliverables")
    .update({ status: status.data })
    .eq("id", id);
  if (error) redirect(withError(`/deals/${dealId}`, error.message));

  revalidatePath(`/deals/${dealId}`);
  revalidatePath("/dashboard");
  redirect(`/deals/${dealId}`);
}

export async function deleteDeliverable(fd: FormData) {
  const { supabase } = await requireUser();
  const id = s(fd, "id");
  const dealId = s(fd, "deal_id");
  if (!id || !dealId) redirect(withError("/deals", "Missing deliverable id"));

  const { error } = await supabase.from("deliverables").delete().eq("id", id);
  if (error) redirect(withError(`/deals/${dealId}`, error.message));

  revalidatePath(`/deals/${dealId}`);
  revalidatePath("/dashboard");
  redirect(`/deals/${dealId}`);
}
