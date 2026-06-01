import { NextResponse, type NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";

// GET /deals/[id]/documents/[docId]
// The `documents` bucket is private, so downloads go through a short-lived
// signed URL minted on demand (link-friendly: right-click / new-tab work, and
// the URL isn't baked into page HTML). requireUser + RLS on the documents
// table mean only the owner can resolve a doc id to its storage key.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> },
) {
  const { docId } = await params;
  const { supabase } = await requireUser();

  const { data: doc } = await supabase
    .from("documents")
    .select("storage_path, name")
    .eq("id", docId)
    .single();
  if (!doc) return new NextResponse("Not found", { status: 404 });

  const { data, error } = await supabase.storage
    .from("documents")
    .createSignedUrl(doc.storage_path, 60, { download: doc.name });
  if (error || !data) {
    return new NextResponse("Could not generate download link", { status: 500 });
  }

  return NextResponse.redirect(data.signedUrl);
}
