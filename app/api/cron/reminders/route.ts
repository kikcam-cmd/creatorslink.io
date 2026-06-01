import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildDigests } from "@/lib/reminders";
import { sendReminderDigest } from "@/lib/email";
import { todayStr, daysFromTodayStr } from "@/lib/dates";

// Node runtime: uses the service-role supabase-js client + the Resend SDK,
// neither of which belongs on the Edge (and our @supabase/ssr Edge-bundling
// history says keep server work on Node).
export const runtime = "nodejs";
// Never prerender/cache — this is invoked by the scheduler, runs live each time.
export const dynamic = "force-dynamic";

// Daily reminder digest. Triggered by Vercel Cron (see vercel.json); Vercel
// injects `Authorization: Bearer ${CRON_SECRET}` automatically when CRON_SECRET
// is set. We reject anything without it so the endpoint isn't world-runnable.
//
// `?dryRun=1` builds the digests and returns them as JSON WITHOUT sending —
// the verification lever for this phase, since neither a push nor a headless
// agent can confirm real mail. Same auth gate as the live run.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dryRun = req.nextUrl.searchParams.get("dryRun") === "1";
  const today = todayStr();
  const weekEnd = daysFromTodayStr(7);

  let digests;
  try {
    const admin = createAdminClient();
    digests = await buildDigests(admin, today, weekEnd);
  } catch (e) {
    const message = e instanceof Error ? e.message : "unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  if (dryRun) {
    return NextResponse.json({
      dryRun: true,
      today,
      weekEnd,
      recipientCount: digests.length,
      digests: digests.map((d) => ({
        email: d.email,
        firstName: d.firstName,
        total: d.total,
        overdueDeliverables: d.overdueDeliverables.length,
        dueSoonDeliverables: d.dueSoonDeliverables.length,
        overduePayments: d.overduePayments.length,
        dueSoonPayments: d.dueSoonPayments.length,
      })),
    });
  }

  // Send sequentially and tally — one creator's failure shouldn't abort the rest.
  let sent = 0;
  const failures: { email: string; error: string }[] = [];
  for (const digest of digests) {
    try {
      await sendReminderDigest(digest);
      sent++;
    } catch (e) {
      failures.push({
        email: digest.email,
        error: e instanceof Error ? e.message : "unknown error",
      });
    }
  }

  return NextResponse.json({
    today,
    recipientCount: digests.length,
    sent,
    failed: failures.length,
    failures,
  });
}
