import { Resend } from "resend";
import { formatDate, formatMoneyExact } from "@/lib/format";
import type {
  ReminderDigest,
  DeliverableItem,
  PaymentItem,
} from "@/lib/reminders";

// Lazy Resend client — only constructed when a key is present, so importing
// this module (e.g. for the dry-run path) never throws on a missing key.
function getResend(): Resend {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("Missing RESEND_API_KEY — can't send reminder email.");
  return new Resend(key);
}

// Sending identity + links. The from-address is env-driven so the Resend
// verified-domain decision (e.g. send.creatorslink.io) is config, not code.
function fromAddress(): string {
  return (
    process.env.REMINDER_FROM_EMAIL || "CreatorsLink <reminders@creatorslink.io>"
  );
}
function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || "https://creatorslink.io";
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function context(dealTitle: string | null, brandName: string | null): string {
  const bits = [dealTitle, brandName].filter(Boolean).map((b) => esc(b!));
  return bits.length ? ` <span style="color:#888">· ${bits.join(" · ")}</span>` : "";
}

function deliverableRow(item: DeliverableItem, base: string): string {
  const href = item.dealId ? `${base}/deals/${item.dealId}` : `${base}/deals`;
  return `<tr><td style="padding:8px 0;border-bottom:1px solid #eee">
    <a href="${href}" style="color:#111;text-decoration:none;font-weight:600">${esc(item.title)}</a>${context(item.dealTitle, item.brandName)}
    <div style="color:#888;font-size:13px">due ${formatDate(item.dueDate)}</div>
  </td></tr>`;
}

function paymentRow(item: PaymentItem, base: string): string {
  const href = item.dealId ? `${base}/deals/${item.dealId}` : `${base}/deals`;
  return `<tr><td style="padding:8px 0;border-bottom:1px solid #eee">
    <a href="${href}" style="color:#111;text-decoration:none;font-weight:600">${esc(formatMoneyExact(item.amount, item.currency ?? "USD"))}</a>${context(item.dealTitle, item.brandName)}
    <div style="color:#888;font-size:13px">due ${formatDate(item.dueDate)}</div>
  </td></tr>`;
}

function section(title: string, rows: string[], danger = false): string {
  if (rows.length === 0) return "";
  const color = danger ? "#c0392b" : "#111";
  return `<h2 style="font-size:15px;color:${color};margin:24px 0 4px">${title}</h2>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">${rows.join("")}</table>`;
}

// Render the digest to HTML. Exported so the cron's dry-run can return the
// rendered body for inspection without sending.
export function renderDigestHtml(digest: ReminderDigest): string {
  const base = siteUrl();
  const unsubscribe = `${base}/settings`;
  const body =
    section(
      "⚠️ Overdue deliverables",
      digest.overdueDeliverables.map((i) => deliverableRow(i, base)),
      true,
    ) +
    section(
      "⚠️ Overdue payments",
      digest.overduePayments.map((i) => paymentRow(i, base)),
      true,
    ) +
    section(
      "Deliverables due this week",
      digest.dueSoonDeliverables.map((i) => deliverableRow(i, base)),
    ) +
    section(
      "Payments due this week",
      digest.dueSoonPayments.map((i) => paymentRow(i, base)),
    );

  const hi = digest.firstName ? `Hi ${esc(digest.firstName)},` : "Hi,";
  return `<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;color:#111">
    <p style="font-size:16px">${hi}</p>
    <p style="color:#444">Here's what's on your plate. <a href="${base}/dashboard" style="color:#111">Open your dashboard →</a></p>
    ${body}
    <p style="color:#aaa;font-size:12px;margin-top:32px;border-top:1px solid #eee;padding-top:16px">
      You're getting this because reminders are on for your CreatorsLink account.
      <a href="${unsubscribe}" style="color:#aaa">Turn them off in Settings</a>.
    </p>
  </div>`;
}

export function digestSubject(digest: ReminderDigest): string {
  const overdue = digest.overdueDeliverables.length + digest.overduePayments.length;
  if (overdue > 0) {
    return `${overdue} overdue · ${digest.total} item${digest.total === 1 ? "" : "s"} need attention`;
  }
  return `${digest.total} item${digest.total === 1 ? "" : "s"} due this week`;
}

export async function sendReminderDigest(digest: ReminderDigest) {
  const { error } = await getResend().emails.send({
    from: fromAddress(),
    to: digest.email,
    subject: digestSubject(digest),
    html: renderDigestHtml(digest),
    headers: {
      // One-click unsubscribe target for mail clients (RFC 8058-ish); points at
      // Settings where the opt-out toggle lives.
      "List-Unsubscribe": `<${siteUrl()}/settings>`,
    },
  });
  if (error) throw new Error(`Resend send failed for ${digest.email}: ${error.message}`);
}
