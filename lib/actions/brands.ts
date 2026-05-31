"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { s, sn, withError } from "@/lib/form";

const brandSchema = z.object({
  name: z.string().min(1, "Brand name is required"),
  contact_name: z.string().nullable(),
  contact_email: z
    .string()
    .email("Contact email looks invalid")
    .nullable(),
  notes: z.string().nullable(),
});

function parse(fd: FormData) {
  return brandSchema.safeParse({
    name: s(fd, "name"),
    contact_name: sn(fd, "contact_name"),
    contact_email: sn(fd, "contact_email"),
    notes: sn(fd, "notes"),
  });
}

export async function createBrand(fd: FormData) {
  const { supabase, user } = await requireUser();
  const parsed = parse(fd);
  if (!parsed.success) {
    redirect(withError("/brands", parsed.error.issues[0].message));
  }

  const { error } = await supabase
    .from("brands")
    .insert({ owner_id: user.id, ...parsed.data });
  if (error) redirect(withError("/brands", error.message));

  revalidatePath("/brands");
  redirect("/brands");
}

export async function updateBrand(fd: FormData) {
  const { supabase } = await requireUser();
  const id = s(fd, "id");
  if (!id) redirect(withError("/brands", "Missing brand id"));

  const parsed = parse(fd);
  if (!parsed.success) {
    redirect(withError(`/brands?edit=${id}`, parsed.error.issues[0].message));
  }

  // RLS guarantees only the owner's row can be updated.
  const { error } = await supabase.from("brands").update(parsed.data).eq("id", id);
  if (error) redirect(withError(`/brands?edit=${id}`, error.message));

  revalidatePath("/brands");
  redirect("/brands");
}

export async function deleteBrand(fd: FormData) {
  const { supabase } = await requireUser();
  const id = s(fd, "id");
  if (!id) redirect(withError("/brands", "Missing brand id"));

  const { error } = await supabase.from("brands").delete().eq("id", id);
  if (error) redirect(withError("/brands", error.message));

  revalidatePath("/brands");
  revalidatePath("/deals");
  redirect("/brands");
}
