import crypto from "node:crypto";

const keyId = () => process.env["RAZORPAY_KEY_ID"]?.trim() ?? "";
const keySecret = () => process.env["RAZORPAY_KEY_SECRET"]?.trim() ?? "";

export function razorpayConfigured() {
  return Boolean(keyId() && keySecret());
}

export function getRazorpayKeyId() {
  return keyId();
}

export async function createRazorpayOrder(input: {
  amount: number;
  currency?: string;
  receipt: string;
  notes?: Record<string, string>;
}) {
  if (!razorpayConfigured()) throw new Error("Razorpay is not configured");
  const auth = Buffer.from(`${keyId()}:${keySecret()}`).toString("base64");
  const response = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
    body: JSON.stringify({ amount: input.amount, currency: input.currency ?? "INR", receipt: input.receipt, notes: input.notes }),
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(typeof body?.error?.description === "string" ? body.error.description : "Razorpay order creation failed");
  return body;
}

export function verifyPaymentSignature(input: { orderId: string; paymentId: string; signature: string }) {
  if (!keySecret() || !input.signature) return false;
  const expected = crypto.createHmac("sha256", keySecret()).update(`${input.orderId}|${input.paymentId}`).digest("hex");
  const actual = Buffer.from(input.signature, "utf8");
  const expectedBuffer = Buffer.from(expected, "utf8");
  return actual.length === expectedBuffer.length && crypto.timingSafeEqual(expectedBuffer, actual);
}

export function verifyWebhookSignature(body: string, signature: string) {
  const secret = process.env["RAZORPAY_WEBHOOK_SECRET"]?.trim() ?? "";
  if (!secret || !signature) return false;
  const expected = crypto.createHmac("sha256", secret).update(body).digest("hex");
  const actual = Buffer.from(signature, "utf8");
  const expectedBuffer = Buffer.from(expected, "utf8");
  return actual.length === expectedBuffer.length && crypto.timingSafeEqual(expectedBuffer, actual);
}
