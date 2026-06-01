import { createClient } from "@supabase/supabase-js";

// Service-role Supabase client — BYPASSES Row-Level Security. Use ONLY in
// trusted server-only contexts with no user session (e.g. the reminders cron),
// never in a request handler that serves a user. The key is server-only and
// must never be exposed as NEXT_PUBLIC_*.
//
// This is a bare supabase-js client, not the @supabase/ssr cookie client: the
// cron has no cookies to read, and keeping it plain avoids the Edge-bundling
// issues that pushed our middleware to proxy.ts. Routes using this must run on
// the Node runtime.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY — the reminders cron can't run without the service-role key.",
    );
  }
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
