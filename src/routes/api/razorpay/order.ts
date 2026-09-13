import { createRazorpayOrder, getRazorpayKeyId, razorpayConfigured } from "@/lib/payments/razorpay";

const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });

export async function POST({ request }: { request: Request }) {
  if (!razorpayConfigured()) return json({ error: "Razorpay is not configured" }, 503);
  const body = await request.json().catch(() => null) as { amount?: unknown; receipt?: unknown; plan?: unknown } | null;
  const amount = Number(body?.amount);
  const receipt = typeof body?.receipt === "string" ? body.receipt.slice(0, 40) : `svarga_${Date.now()}`;
  const plan = typeof body?.plan === "string" ? body.plan.slice(0, 40) : "default";
  if (!Number.isInteger(amount) || amount <= 0) return json({ error: "amount must be a positive integer in paise" }, 400);
  try {
    const order = await createRazorpayOrder({ amount, receipt, notes: { plan } });
    return json({ order, keyId: getRazorpayKeyId() });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Unable to create payment order" }, 502);
  }
}
