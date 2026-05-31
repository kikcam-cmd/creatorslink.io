import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Resolve the signed-in user (or bounce to login). Use in server components
// and server actions before any owner-scoped read/write.
export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}
