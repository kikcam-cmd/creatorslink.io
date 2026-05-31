import { format, isValid, parseISO } from "date-fns";

// Money: total_value/amount are numeric in Postgres → arrive as number | string.
export function formatMoney(
  value: number | string | null | undefined,
  currency = "USD",
): string {
  if (value === null || value === undefined || value === "") return "—";
  const n = typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(n)) return "—";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return `$${n.toLocaleString()}`;
  }
}

// Dates are stored as `date` (YYYY-MM-DD). Render without timezone drift.
export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const d = parseISO(value);
  return isValid(d) ? format(d, "MMM d, yyyy") : "—";
}

export function formatDateShort(value: string | null | undefined): string {
  if (!value) return "—";
  const d = parseISO(value);
  return isValid(d) ? format(d, "MMM d") : "—";
}
