import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Paid tiers, priced in Indian rupees. Yearly plans bill two months free. */
export const PLANS = {
  starter_monthly: {
    id: "starter_monthly",
    tier: "starter",
    name: "Svarga Starter — Monthly",
    amountPaise: 14900,
    currency: "INR",
    interval: "month",
  },
  starter_yearly: {
    id: "starter_yearly",
    tier: "starter",
    name: "Svarga Starter — Yearly",
    amountPaise: 149000,
    currency: "INR",
    interval: "year",
  },
  pro_monthly: {
    id: "pro_monthly",
    tier: "pro",
    name: "Svarga Pro — Monthly",
    amountPaise: 49900,
    currency: "INR",
    interval: "month",
  },
  pro_yearly: {
    id: "pro_yearly",
    tier: "pro",
    name: "Svarga Pro — Yearly",
    amountPaise: 499000,
    currency: "INR",
    interval: "year",
  },
  acharya_monthly: {
    id: "acharya_monthly",
    tier: "acharya",
    name: "Svarga Ācārya — Monthly",
    amountPaise: 149900,
    currency: "INR",
    interval: "month",
  },
  acharya_yearly: {
    id: "acharya_yearly",
    tier: "acharya",
    name: "Svarga Ācārya — Yearly",
    amountPaise: 1499000,
    currency: "INR",
    interval: "year",
  },
} as const;

export type PlanId = keyof typeof PLANS;

const PLAN_IDS = Object.keys(PLANS) as [PlanId, ...PlanId[]];

/** What each tier includes. Free tier is not purchasable, so it has no plan entry. */
export const TIERS = [
  {
    id: "free",
    name: "Sādhaka",
    tagline: "Start free",
    monthly: 0,
    yearly: 0,
    features: [
      "25 questions a day",
      "5 images a month",
      "Balanced mode",
      "Saved chat history",
    ],
  },
  {
    id: "starter",
    name: "Jijñāsu",
    tagline: "For daily curiosity",
    monthly: 149,
    yearly: 1490,
    features: [
      "300 questions a month",
      "50 images a month",
      "Reasoning + Research modes",
      "Svarga remembers your preferences",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "Most popular",
    monthly: 499,
    yearly: 4990,
    popular: true,
    features: [
      "Unlimited questions (fair use)",
      "300 images a month",
      "Every mode, including Creative",
      "Long-term memory and priority answers",
    ],
  },
  {
    id: "acharya",
    name: "Ācārya",
    tagline: "For teams and builders",
    monthly: 1499,
    yearly: 14990,
    features: [
      "Everything in Pro, unlimited",
      "1,500 images a month",
      "Fastest queue and longest context",
      "Early features and email support",
    ],
  },
] as const;

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

export const createOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ plan: z.enum(["pro"]) }).parse(input))
  .handler(async ({ data, context }) => {
    const keyId = process.env["RAZORPAY_KEY_ID"];
    const keySecret = process.env["RAZORPAY_KEY_SECRET"];
    if (!keyId || !keySecret) throw new Error("Payments are not configured yet.");

    const plan = PLANS[data.plan as PlanId];
    const res = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${btoa(`${keyId}:${keySecret}`)}`,
      },
      body: JSON.stringify({
        amount: plan.amountPaise,
        currency: plan.currency,
        receipt: `svarga_${context.userId.slice(0, 8)}_${Date.now()}`,
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error(`Razorpay order failed [${res.status}]: ${body}`);
      throw new Error("Could not start the payment. Please try again.");
    }
    const order = (await res.json()) as { id: string };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("payments").insert({
      user_id: context.userId,
      order_id: order.id,
      plan: plan.id,
      amount_paise: plan.amountPaise,
      currency: plan.currency,
      status: "created",
    });
    if (error) throw new Error("Could not record the order. Please try again.");

    return { orderId: order.id, amountPaise: plan.amountPaise, currency: plan.currency, keyId };
  });

export const verifyPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        orderId: z.string().min(1),
        paymentId: z.string().min(1),
        signature: z.string().min(1),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const keySecret = process.env["RAZORPAY_KEY_SECRET"];
    if (!keySecret) throw new Error("Payments are not configured yet.");

    const expected = await hmacSha256Hex(keySecret, `${data.orderId}|${data.paymentId}`);
    if (expected !== data.signature) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await supabaseAdmin
        .from("payments")
        .update({ status: "failed", payment_id: data.paymentId })
        .eq("order_id", data.orderId)
        .eq("user_id", context.userId);
      throw new Error("Payment verification failed. If money was debited, contact support.");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("payments")
      .update({ status: "paid", payment_id: data.paymentId })
      .eq("order_id", data.orderId)
      .eq("user_id", context.userId);
    if (error) throw new Error("Payment verified but could not be recorded.");
    return { ok: true };
  });

export const listMyPayments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("payments")
      .select("id, plan, amount_paise, currency, status, created_at")
      .order("created_at", { ascending: false })
      .limit(10);
    if (error) throw new Error(error.message);
    return data;
  });
