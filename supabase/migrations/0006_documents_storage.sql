-- Phase 3 — Document vault: Supabase Storage bucket + storage RLS.
-- The `documents` metadata table already shipped in 0001_init; this adds the
-- private bucket the files live in and the row-level policies that scope every
-- object to its owner.

-- Private bucket. file_size_limit + allowed_mime_types give defense-in-depth:
-- storage rejects oversized/wrong-type uploads even if the app check is bypassed.
-- The 4 MiB limit is held *under* Vercel's ~4.5 MB serverless request-body cap
-- (the upload runs through a server action) and matches MAX_DOCUMENT_BYTES /
-- next.config's serverActions.bodySizeLimit.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'documents',
  'documents',
  false,
  4194304, -- 4 MiB
  array[
    'application/pdf',
    'image/png', 'image/jpeg', 'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain'
  ]
)
on conflict (id) do nothing;

-- Storage RLS: a creator may only touch objects whose first path segment is
-- their own user id. Keys are written as `{owner_id}/{deal_id}/{uuid}{.ext}`
-- (see lib/actions/documents.ts), so (storage.foldername(name))[1] = the owner.
-- This is defense-in-depth on top of the public.documents `owner_id = auth.uid()`
-- policy: even a forged storage_path can't reach another creator's files.
-- RLS is already enabled on storage.objects by Supabase.

create policy "own document objects read" on storage.objects
  for select using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "own document objects insert" on storage.objects
  for insert with check (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "own document objects update" on storage.objects
  for update using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "own document objects delete" on storage.objects
  for delete using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
