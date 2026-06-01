"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { cb, sn, withError } from "@/lib/form";

export async function updateProfile(fd: FormData) {
  const { supabase, user } = await requireUser();

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: sn(fd, "display_name"),
      handle: sn(fd, "handle"),
      niche: sn(fd, "niche"),
      // Opt-out: an unchecked box is omitted from FormData, so cb() → false.
      email_reminders: cb(fd, "email_reminders"),
    })
    .eq("id", user.id);
  if (error) redirect(withError("/settings", error.message));

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  redirect("/settings?saved=1");
}
