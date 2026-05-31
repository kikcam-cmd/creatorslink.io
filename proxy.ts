import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Next 16 renamed the `middleware` convention to `proxy`, which runs on the
// Node.js runtime by default — required here because @supabase/ssr pulls in
// modules the Edge runtime can't bundle (the old middleware.ts failed to deploy
// with "Edge Function is referencing unsupported modules").
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    // Run on everything except static assets and image files.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
