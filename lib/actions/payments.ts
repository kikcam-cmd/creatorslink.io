"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { num, s, sn, withError } from "@/lib/form";
import { todayStr } from "@/lib/dates";

// Stored status is the workflow the creator sets. "overdue" is NOT a choice —
// it's derived for display (D-017 / effectivePaymentStatus), so it can't go
// stale. Removing it from the enum would be a migration for no benefit.
const STATUS = z.enum(["expected", "invoiced", "paid"]);

const paymentSchema = z.object({
  // num() yields null when the field is empty → the type error doubles as the
  // "required" message. (zod v4: use `error`, not invalid_type_error.)
  amount: z
    .number({ error: "Amount is required" })
    .nonnegative("Amount can't be negative"),
  currency: z.string().min(1),
  due_date: z.string().nullable(),
  status: STATUS,
  paid_date: z.string().nullable(),
});

type PaymentData = z.infer<typeof paymentSchema>;

function parse(fd: FormData) {
  const currency = s(fd, "currency");
  return paymentSchema.safeParse({
    amount: num(fd, "amount"),
    currency: currency || "USD",
    due_date: sn(fd, "due_date"),
    status: s(fd, "status") || "expected",
    paid_date: sn(fd, "paid_date"),
  });
}

// Keep paid_date consistent with status: stamp today when marked paid and none
// was given; clear it whenever the payment isn't paid (so an unpaid row never
// renders a stale paid date).
function normalizePaidDate(data: PaymentData): PaymentData {
  if (data.status === "paid") {
    return { ...data, paid_date: data.paid_date || todayStr() };
  }
  return { ...data, paid_date: null };
}

export async function createPayment(fd: FormData) {
  const { supabase, user } = await requireUser();
  const dealId = s(fd, "deal_id");
  if (!dealId) redirect(withError("/deals", "Missing deal id"));

  const parsed = parse(fd);
  if (!parsed.success) {
    redirect(withError(`/deals/${dealId}`, parsed.error.issues[0].message));
  }

  const { error } = await supabase
    .from("payments")
    .insert({ owner_id: user.id, deal_id: dealId, ...normalizePaidDate(parsed.data) });
  if (error) redirect(withError(`/deals/${dealId}`, error.message));

  revalidatePath(`/deals/${dealId}`);
  revalidatePath("/dashboard");
  redirect(`/deals/${dealId}`);
}

export async function updatePayment(fd: FormData) {
  const { supabase } = await requireUser();
  const id = s(fd, "id");
  const dealId = s(fd, "deal_id");
  if (!id || !dealId) redirect(withError("/deals", "Missing payment id"));

  const parsed = parse(fd);
  if (!parsed.success) {
    redirect(
      withError(`/deals/${dealId}?edit_payment=${id}`, parsed.error.issues[0].message),
    );
  }

  const { error } = await supabase
    .from("payments")
    .update(normalizePaidDate(parsed.data))
    .eq("id", id);
  if (error) redirect(withError(`/deals/${dealId}`, error.message));

  revalidatePath(`/deals/${dealId}`);
  revalidatePath("/dashboard");
  redirect(`/deals/${dealId}`);
}

// Quick status change from the payments list (single field). Stamps/clears
// paid_date the same way the full form does.
export async function setPaymentStatus(fd: FormData) {
  const { supabase } = await requireUser();
  const id = s(fd, "id");
  const dealId = s(fd, "deal_id");
  const status = STATUS.safeParse(s(fd, "status"));
  if (!id || !dealId) redirect(withError("/deals", "Missing payment id"));
  if (!status.success) redirect(withError(`/deals/${dealId}`, "Invalid status"));

  const paid_date = status.data === "paid" ? todayStr() : null;
  const { error } = await supabase
    .from("payments")
    .update({ status: status.data, paid_date })
    .eq("id", id);
  if (error) redirect(withError(`/deals/${dealId}`, error.message));

  revalidatePath(`/deals/${dealId}`);
  revalidatePath("/dashboard");
  redirect(`/deals/${dealId}`);
}

export async function deletePayment(fd: FormData) {
  const { supabase } = await requireUser();
  const id = s(fd, "id");
  const dealId = s(fd, "deal_id");
  if (!id || !dealId) redirect(withError("/deals", "Missing payment id"));

  const { error } = await supabase.from("payments").delete().eq("id", id);
  if (error) redirect(withError(`/deals/${dealId}`, error.message));

  revalidatePath(`/deals/${dealId}`);
  revalidatePath("/dashboard");
  redirect(`/deals/${dealId}`);
}
