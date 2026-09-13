import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";

import { useAuth } from "@/hooks/use-auth";
import { createOrder, verifyPayment, PLANS } from "@/lib/payments.functions";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (event: string, cb: (resp: unknown) => void) => void;
    };
  }
}

let razorpayScriptPromise: Promise<void> | null = null;

function loadRazorpayScript(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  if (!razorpayScriptPromise) {
    razorpayScriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve();
      script.onerror = () => {
        razorpayScriptPromise = null;
        reject(new Error("Could not load the payment window. Check your connection and retry."));
      };
      document.body.appendChild(script);
    });
  }
  return razorpayScriptPromise;
}

export function Checkout() {
  const { user } = useAuth();
  const runCreateOrder = useServerFn(createOrder);
  const runVerifyPayment = useServerFn(verifyPayment);
  const [busy, setBusy] = useState(false);

  const plan = PLANS.pro;

  async function pay() {
    if (!user || busy) return;
    setBusy(true);
    try {
      const order = await runCreateOrder({ data: { plan: "pro" } });
      await loadRazorpayScript();
      if (!window.Razorpay) throw new Error("Payment window unavailable.");

      const rzp = new window.Razorpay({
        key: order.keyId,
        amount: order.amountPaise,
        currency: order.currency,
        name: "Svarga.ai",
        description: plan.name,
        order_id: order.orderId,
        prefill: { email: user.email ?? "" },
        theme: { color: "#C2410C" },
        handler: async (resp: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          try {
            await runVerifyPayment({
              data: {
                orderId: resp.razorpay_order_id,
                paymentId: resp.razorpay_payment_id,
                signature: resp.razorpay_signature,
              },
            });
            toast.success("Payment confirmed. Welcome to Svarga Pro.");
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Verification failed.");
          } finally {
            setBusy(false);
          }
        },
      });
      rzp.on("payment.failed", () => {
        toast.error("Payment failed. No amount was captured — please try again.");
        setBusy(false);
      });
      rzp.on("modal.ondismiss", () => setBusy(false));
      rzp.open();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not start the payment.");
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-5 md:grid-cols-2">
      <div className="rounded-2xl border border-ink/5 bg-sand/50 p-6">
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-crimson">
          {plan.name}
        </p>
        <p className="mt-3 font-display text-5xl font-semibold">
          ₹499
          <span className="text-lg font-normal text-ink/50"> / month</span>
        </p>
        <ul className="mt-4 space-y-2 text-sm text-ink/70">
          <li>Unlimited frontier reasoning with Parameshvara 1.0</li>
          <li>Full image studio with saved render gallery</li>
          <li>Priority answers across 39 languages</li>
        </ul>
        {user ? (
          <button
            type="button"
            onClick={() => void pay()}
            disabled={busy}
            className="mt-6 rounded-full bg-crimson px-6 py-3 text-sm font-semibold text-cream transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? "Opening secure checkout…" : "Subscribe with Razorpay"}
          </button>
        ) : (
          <Link
            to="/auth"
            className="mt-6 inline-block rounded-full bg-ink px-6 py-3 text-sm font-semibold text-cream"
          >
            Sign in to subscribe
          </Link>
        )}
      </div>
      <div className="rounded-2xl border border-ink/5 bg-sand/50 p-6">
        <h3 className="font-display text-2xl font-semibold">Cards and UPI, worldwide.</h3>
        <p className="mt-2 text-sm leading-relaxed text-ink/60">
          Checkout is handled by Razorpay: international Visa, Mastercard, RuPay and Amex cards,
          plus UPI and Google Pay for India. Payments are verified on our servers before your plan
          activates — nothing card-related ever touches your browser storage.
        </p>
        <p className="mt-4 font-mono text-xs text-ink/50">
          Secure 256-bit encrypted checkout · Cancel anytime
        </p>
      </div>
    </div>
  );
}
