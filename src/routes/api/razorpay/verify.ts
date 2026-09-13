import { verifyPaymentSignature } from "@/lib/payments/razorpay";

const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });

export async function POST({ request }: { request: Request }) {
  const body = await request.json().catch(() => null) as { razorpay_order_id?: unknown; razorpay_payment_id?: unknown; razorpay_signature?: unknown } | null;
  const orderId = typeof body?.razorpay_order_id === "string" ? body.razorpay_order_id : "";
  const paymentId = typeof body?.razorpay_payment_id === "string" ? body.razorpay_payment_id : "";
  const signature = typeof body?.razorpay_signature === "string" ? body.razorpay_signature : "";
  if (!orderId || !paymentId || !signature) return json({ verified: false, error: "Missing payment verification fields" }, 400);
  const verified = verifyPaymentSignature({ orderId, paymentId, signature });
  return json({ verified }, verified ? 200 : 400);
}
