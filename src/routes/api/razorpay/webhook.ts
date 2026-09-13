import { verifyWebhookSignature } from "@/lib/payments/razorpay";

export async function POST({ request }: { request: Request }) {
  const body = await request.text();
  const signature = request.headers.get("x-razorpay-signature") ?? "";
  if (!verifyWebhookSignature(body, signature)) return new Response("Invalid signature", { status: 400 });

  const event = JSON.parse(body) as { event?: string; payload?: unknown };
  console.info("Razorpay webhook received", { event: event.event });
  return new Response("ok", { status: 200 });
}
