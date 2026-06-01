"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { s, withError } from "@/lib/form";
import { ALLOWED_DOCUMENT_MIME, MAX_DOCUMENT_BYTES } from "@/lib/types";

const BUCKET = "documents";

const metaSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  type: z.enum(["contract", "brief", "invoice", "other"]),
});

// Keep the original filename in the `name` column; the storage KEY is a uuid
// (+ a sanitized extension) so spaces / unicode / # / ? in a filename can never
// break the key (advisor #1). Extension is cosmetic — content type is set on
// upload — but it keeps keys legible and lets clients infer a type.
function safeExt(filename: string): string {
  const i = filename.lastIndexOf(".");
  if (i < 0) return "";
  const ext = filename.slice(i + 1).toLowerCase();
  return /^[a-z0-9]{1,8}$/.test(ext) ? `.${ext}` : "";
}

export async function uploadDocument(fd: FormData) {
  const { supabase, user } = await requireUser();
  const dealId = s(fd, "deal_id");
  if (!dealId) redirect(withError("/deals", "Missing deal id"));

  const file = fd.get("file");
  if (!(file instanceof File) || file.size === 0) {
    redirect(withError(`/deals/${dealId}`, "Choose a file to upload"));
  }
  if (file.size > MAX_DOCUMENT_BYTES) {
    redirect(
      withError(`/deals/${dealId}`, "File is too large — 4MB max in this version"),
    );
  }
  // Trust the browser's MIME only as a fast pre-check; the bucket's
  // allowed_mime_types is the real gate. Empty type (some browsers) → let the
  // bucket decide rather than blocking a legitimate upload.
  if (file.type && !ALLOWED_DOCUMENT_MIME.includes(file.type)) {
    redirect(withError(`/deals/${dealId}`, "Unsupported file type"));
  }

  const parsed = metaSchema.safeParse({
    name: s(fd, "name") || file.name,
    type: s(fd, "type") || "other",
  });
  if (!parsed.success) {
    redirect(withError(`/deals/${dealId}`, parsed.error.issues[0].message));
  }

  const key = `${user.id}/${dealId}/${crypto.randomUUID()}${safeExt(file.name)}`;
  const { error: upErr } = await supabase.storage.from(BUCKET).upload(key, file, {
    contentType: file.type || "application/octet-stream",
    upsert: false,
  });
  if (upErr) redirect(withError(`/deals/${dealId}`, upErr.message));

  const { error: insErr } = await supabase.from("documents").insert({
    owner_id: user.id,
    deal_id: dealId,
    name: parsed.data.name,
    storage_path: key,
    type: parsed.data.type,
  });
  // Don't leave an orphaned object if the metadata row fails to write.
  if (insErr) {
    await supabase.storage.from(BUCKET).remove([key]);
    redirect(withError(`/deals/${dealId}`, insErr.message));
  }

  revalidatePath(`/deals/${dealId}`);
  redirect(`/deals/${dealId}`);
}

export async function deleteDocument(fd: FormData) {
  const { supabase } = await requireUser();
  const id = s(fd, "id");
  const dealId = s(fd, "deal_id");
  if (!id || !dealId) redirect(withError("/deals", "Missing document id"));

  // Look up the key (RLS scopes this to the owner), remove the object first,
  // then the row. Object-then-row is recoverable: a leftover row with a missing
  // object just deletes again (storage remove no-ops), whereas an orphaned
  // object is invisible and accrues cost.
  const { data: doc } = await supabase
    .from("documents")
    .select("storage_path")
    .eq("id", id)
    .single();

  if (doc?.storage_path) {
    const { error: rmErr } = await supabase.storage
      .from(BUCKET)
      .remove([doc.storage_path]);
    if (rmErr) redirect(withError(`/deals/${dealId}`, rmErr.message));
  }

  const { error } = await supabase.from("documents").delete().eq("id", id);
  if (error) redirect(withError(`/deals/${dealId}`, error.message));

  revalidatePath(`/deals/${dealId}`);
  redirect(`/deals/${dealId}`);
}
