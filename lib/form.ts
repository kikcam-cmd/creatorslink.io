// Small helpers for reading FormData in server actions.

/** Trimmed string ("" if missing). */
export function s(fd: FormData, key: string): string {
  return String(fd.get(key) ?? "").trim();
}

/** Trimmed string, or null when empty. */
export function sn(fd: FormData, key: string): string | null {
  const v = s(fd, key);
  return v === "" ? null : v;
}

/** Number, or null when empty/invalid. */
export function num(fd: FormData, key: string): number | null {
  const v = s(fd, key);
  if (v === "") return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
}

/** Build a redirect target with an `error` query param. */
export function withError(path: string, message: string): string {
  const sep = path.includes("?") ? "&" : "?";
  return `${path}${sep}error=${encodeURIComponent(message)}`;
}
