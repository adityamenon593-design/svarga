import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/** UPI id / phone number donations can be sent to directly. */
export const DONATE_UPI = "8139012237";
export const DONATE_NAME = "Aditya Mohan Menon";

/** Suggested one-time donation amounts, in rupees. */
export const DONATION_PRESETS = [101, 251, 501, 1100, 2500] as const;

async function hmacSha256Hex(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export const createDonationOrder = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        amount: z.number().int().min(10).max(500000),
        name: z.string().trim().max(80).optional(),
        email: z.string().trim().email().max(160).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const keyId = process.env["RAZORPAY_KEY_ID"];
    const keySecret = process.env["RAZORPAY_KEY_SECRET"];
    if (!keyId || !keySecret) throw new Error("Donations are not configured yet.");

    const amountPaise = data.amount * 100;
    const res = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${btoa(`${keyId}:${keySecret}`)}`,
      },
      body: JSON.stringify({
        amount: amountPaise,
        currency: "INR",
        receipt: `svarga_gift_${Date.now()}`,
        notes: { purpose: "donation" },
      }),
    });
    if (!res.ok) {
      console.error(`Razorpay donation order failed [${res.status}]: ${await res.text()}`);
      throw new Error("Could not start the donation. Please try UPI instead.");
    }
    const order = (await res.json()) as { id: string };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("donations").insert({
      order_id: order.id,
      amount_paise: amountPaise,
      currency: "INR",
      donor_name: data.name ?? null,
      donor_email: data.email ?? null,
      status: "created",
    });

    return { orderId: order.id, amountPaise, keyId };
  });

export const verifyDonation = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        orderId: z.string().min(1),
        paymentId: z.string().min(1),
        signature: z.string().min(1),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const keySecret = process.env["RAZORPAY_KEY_SECRET"];
    if (!keySecret) throw new Error("Donations are not configured yet.");

    const expected = await hmacSha256Hex(keySecret, `${data.orderId}|${data.paymentId}`);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (expected !== data.signature) {
      await supabaseAdmin
        .from("donations")
        .update({ status: "failed", payment_id: data.paymentId })
        .eq("order_id", data.orderId);
      throw new Error("Donation could not be verified. If money was debited, please contact us.");
    }

    await supabaseAdmin
      .from("donations")
      .update({ status: "paid", payment_id: data.paymentId })
      .eq("order_id", data.orderId);
    return { ok: true };
  });
