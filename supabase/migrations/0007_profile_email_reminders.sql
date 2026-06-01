-- Phase 4 — Reminders. Per-creator opt-out for the daily reminder digest.
-- Defaults true (opt-out, not opt-in) so existing + new creators get the
-- retention email unless they turn it off in Settings. The cron job filters on
-- this column before emailing. Added now because retrofitting a notification
-- preference after mail is already going out is the awkward path.
alter table profiles
  add column if not exists email_reminders boolean not null default true;
