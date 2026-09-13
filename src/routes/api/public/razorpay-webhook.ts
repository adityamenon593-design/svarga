import { createFileRoute } from "@tanstack/react-router";

/**
 * Razorpay webhook receiver.
 *
 * Configure this URL in the Razorpay dashboard (Settings -> Webhooks) with the
 * events `payment.captured`, `payment.failed` and `order.paid`, using the same
 * secret stored as RAZORPAY_WEBHOOK_SECRET.
 */
export const Route = createFileRoute("/api/public/razorpay-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["RAZORPAY_WEBHOOK_SECRET"];
        if (!secret) return new Response("Webhook not configured", { status: 503 });

        const signature = request.headers.get("x-razorpay-signature") ?? "";
        const raw = await request.text();

        const key = await crypto.subtle.importKey(
          "raw",
          new TextEncoder().encode(secret),
          { name: "HMAC", hash: "SHA-256" },
          false,
          ["sign"],
        );
        const sigBytes = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(raw));
        const expected = Array.from(new Uint8Array(sigBytes))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");

        // Constant-time comparison.
        if (signature.length !== expected.length) {
          return new Response("Invalid signature", { status: 401 });
        }
        let diff = 0;
        for (let i = 0; i < expected.length; i += 1) {
          diff |= signature.charCodeAt(i) ^ expected.charCodeAt(i);
        }
        if (diff !== 0) return new Response("Invalid signature", { status: 401 });

        let payload: {
          event?: string;
          payload?: {
            payment?: { entity?: { id?: string; order_id?: string; notes?: Record<string, string> } };
            order?: { entity?: { id?: string } };
          };
        };
        try {
          payload = JSON.parse(raw);
        } catch {
          return new Response("Bad payload", { status: 400 });
        }

        const event = payload.event ?? "";
        const payment = payload.payload?.payment?.entity;
        const orderId = payment?.order_id ?? payload.payload?.order?.entity?.id;
        if (!orderId) return new Response("ok");

        const status =
          event === "payment.captured" || event === "order.paid"
            ? "paid"
            : event === "payment.failed"
              ? "failed"
              : null;
        if (!status) return new Response("ok");

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const isDonation = payment?.notes?.["purpose"] === "donation";
        const table = isDonation ? "donations" : "payments";

        const update: { status: string; payment_id?: string } = { status };
        if (payment?.id) update.payment_id = payment.id;

        const { error } = await supabaseAdmin.from(table).update(update).eq("order_id", orderId);
        if (error) {
          console.error(`Razorpay webhook update failed for ${orderId}: ${error.message}`);
          return new Response("Update failed", { status: 500 });
        }

        return new Response("ok");
      },
    },
  },
});
