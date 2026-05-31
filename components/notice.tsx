import { cn } from "@/lib/utils";

export function Notice({
  variant = "error",
  children,
  className,
}: {
  variant?: "error" | "success";
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-5 rounded-lg border px-4 py-3 text-sm",
        variant === "error"
          ? "border-[var(--cl-danger)]/30 bg-[var(--cl-danger)]/5 text-[var(--cl-danger)]"
          : "border-[var(--cl-accent)]/30 bg-[var(--cl-accent)]/8 text-[var(--cl-accent-ink)]",
        className,
      )}
    >
      {children}
    </div>
  );
}
