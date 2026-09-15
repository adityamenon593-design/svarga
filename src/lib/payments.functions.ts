import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Supported billing currencies. Amounts are always in minor units (paise / cents). */
export const CURRENCIES = ["INR", "USD"] as const;
export type Currency = (typeof CURRENCIES)[number];

/** Paid tiers. Yearly plans bill two months free. */
export const PLANS = {
  starter_monthly: {
    id: "starter_monthly",
    tier: "starter",
    name: "Svarga Jijñāsu — Monthly",
    interval: "month",
    amounts: { INR: 14900, USD: 700 },
  },
  starter_yearly: {
    id: "starter_yearly",
    tier: "starter",
    name: "Svarga Jijñāsu — Yearly",
    interval: "year",
    amounts: { INR: 149000, USD: 7000 },
  },
  pro_monthly: {
    id: "pro_monthly",
    tier: "pro",
    name: "Svarga Pro — Monthly",
    interval: "month",
    amounts: { INR: 49900, USD: 1900 },
  },
  pro_yearly: {
    id: "pro_yearly",
    tier: "pro",
    name: "Svarga Pro — Yearly",
    interval: "year",
    amounts: { INR: 499000, USD: 19000 },
  },
  acharya_monthly: {
    id: "acharya_monthly",
    tier: "acharya",
    name: "Svarga Ācārya — Monthly",
    interval: "month",
    amounts: { INR: 149900, USD: 4900 },
  },
  acharya_yearly: {
    id: "acharya_yearly",
    tier: "acharya",
    name: "Svarga Ācārya — Yearly",
    interval: "year",
    amounts: { INR: 1499000, USD: 49000 },
  },
  /**
   * Hidden ₹1 order used to prove the live payment rail end-to-end.
   * Tier prefix stays "free" so a successful test grants no paid entitlement.
   */
  free_livetest: {
    id: "free_livetest",
    tier: "free",
    name: "Live payment test — ₹1",
    interval: "month",
    amounts: { INR: 100, USD: 100 },
  },
} as const;

/** Plans that must never appear in the public pricing grid. */
export const HIDDEN_PLANS: readonly PlanIdLike[] = ["free_livetest"];
type PlanIdLike = keyof typeof PLANS;

export type PlanId = keyof typeof PLANS;

const PLAN_IDS = Object.keys(PLANS) as [PlanId, ...PlanId[]];

/** What each tier includes. Free tier is not purchasable, so it has no plan entry. */
export const TIERS = [
  {
    id: "free",
    name: "Sādhaka",
    tagline: "Start free",
    price: { INR: { monthly: 0, yearly: 0 }, USD: { monthly: 0, yearly: 0 } },
    features: [
      "100 questions a day",
      "15 images a month",
      "Balanced + Reasoning modes",
      "Saved chat history",
    ],
  },
  {
    id: "starter",
    name: "Jijñāsu",
    tagline: "For daily curiosity",
    price: { INR: { monthly: 149, yearly: 1490 }, USD: { monthly: 7, yearly: 70 } },
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
    price: { INR: { monthly: 499, yearly: 4990 }, USD: { monthly: 19, yearly: 190 } },
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
    price: { INR: { monthly: 1499, yearly: 14990 }, USD: { monthly: 49, yearly: 490 } },
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
  .inputValidator((input: unknown) =>
    z.object({ plan: z.enum(PLAN_IDS), currency: z.enum(CURRENCIES).default("INR") }).parse(input),
  )
  .handler(async ({ data, context }) => {
    // Trim: keys pasted from a dashboard often carry stray whitespace/newlines,
    // which makes Razorpay reject them with a 401 "Authentication failed".
    const keyId = process.env["RAZORPAY_KEY_ID"]?.trim();
    const keySecret = process.env["RAZORPAY_KEY_SECRET"]?.trim();
    if (!keyId || !keySecret) throw new Error("Payments are not configured yet.");

    const plan = PLANS[data.plan as PlanId];
    // The ₹1 live-rail test belongs to the founder account only.
    if (plan.id === "free_livetest") {
      const email = String(context.claims?.["email"] ?? "").toLowerCase();
      if (email !== "adityamenon593@gmail.com") throw new Error("That plan is not available.");
    }
    const currency = data.currency as Currency;
    const amount = plan.amounts[currency];
    const res = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${btoa(`${keyId}:${keySecret}`)}`,
      },
      body: JSON.stringify({
        amount,
        currency,
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
      amount_paise: amount,
      currency,
      status: "created",
    });
    if (error) throw new Error("Could not record the order. Please try again.");

    return { orderId: order.id, amountPaise: amount, currency, keyId };
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

/**
 * Live status check for one order. Reads Razorpay directly, so a payment that
 * succeeded but never reported back (closed tab, webhook delay) still unlocks.
 */
export const checkOrderStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ orderId: z.string().min(1) }).parse(input))
  .handler(async ({ data, context }) => {
    const keyId = process.env["RAZORPAY_KEY_ID"];
    const keySecret = process.env["RAZORPAY_KEY_SECRET"];
    if (!keyId || !keySecret) throw new Error("Payments are not configured yet.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin
      .from("payments")
      .select("status, plan")
      .eq("order_id", data.orderId)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (!row) throw new Error("We could not find that order.");
    if (row.status === "paid") return { status: "paid" as const, plan: row.plan };

    const res = await fetch(`https://api.razorpay.com/v1/orders/${data.orderId}/payments`, {
      headers: { Authorization: `Basic ${btoa(`${keyId}:${keySecret}`)}` },
    });
    if (!res.ok) {
      const body = await res.text();
      console.error(`Razorpay status check failed [${res.status}]: ${body}`);
      throw new Error("Could not check the payment right now. Please try again shortly.");
    }
    const json = (await res.json()) as {
      items?: Array<{ id: string; status: string; error_description?: string }>;
    };
    const items = json.items ?? [];
    const captured = items.find((p) => p.status === "captured" || p.status === "authorized");

    if (captured) {
      await supabaseAdmin
        .from("payments")
        .update({ status: "paid", payment_id: captured.id })
        .eq("order_id", data.orderId)
        .eq("user_id", context.userId);
      return { status: "paid" as const, plan: row.plan };
    }

    const failed = items.find((p) => p.status === "failed");
    if (failed) {
      await supabaseAdmin
        .from("payments")
        .update({ status: "failed", payment_id: failed.id })
        .eq("order_id", data.orderId)
        .eq("user_id", context.userId);
      return {
        status: "failed" as const,
        plan: row.plan,
        reason: failed.error_description ?? "The bank or card declined the payment.",
      };
    }

    return { status: "pending" as const, plan: row.plan };
  });
