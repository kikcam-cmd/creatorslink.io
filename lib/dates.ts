import { addDays, format } from "date-fns";

// Single source for "today"/relative dates so the known server-timezone
// limitation lives in ONE place instead of being copy-pasted.
//
// NOTE: uses the server clock (UTC on Vercel). For a US creator this can be off
// by a day in the evening. It governs deliverable overdue, payment overdue, and
// "paid this month". TODO: switch to the user's local date (store tz on profile
// or compute client-side) — until then, treat these as ~day-accurate.

export function todayStr(): string {
  return format(new Date(), "yyyy-MM-dd");
}

export function daysFromTodayStr(n: number): string {
  return format(addDays(new Date(), n), "yyyy-MM-dd");
}
