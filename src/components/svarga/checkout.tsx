import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";

import { useAuth } from "@/hooks/use-auth";
import {
  createOrder,
  checkOrderStatus,
  verifyPayment,
  PLANS,
  TIERS,
  type PlanId,
  type Currency,
} from "@/lib/payments.functions";

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

const money = (value: number, currency: Currency) =>
  currency === "INR" ? `₹${value.toLocaleString("en-IN")}` : `$${value.toLocaleString("en-US")}`;

/** Live payments only run on domains registered with Razorpay. */
const PAYMENT_HOSTS = new Set(["svarga.digital", "www.svarga.digital"]);

/** The ₹1 live-rail test is visible to the founder account only. */
const OWNER_EMAIL = "adityamenon593@gmail.com";

function paymentHostRegistered(): boolean {
  try {
    return PAYMENT_HOSTS.has(window.location.hostname);
  } catch {
    return false;
  }
}

function detectCurrency(): Currency {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone ?? "";
    return tz.startsWith("Asia/Calcutta") || tz.startsWith("Asia/Kolkata") ? "INR" : "USD";
  } catch {
    return "INR";
  }
}

export function Checkout() {
  const { user } = useAuth();
  const runCreateOrder = useServerFn(createOrder);
  const runVerifyPayment = useServerFn(verifyPayment);
  const runCheckStatus = useServerFn(checkOrderStatus);
  const [busy, setBusy] = useState<PlanId | null>(null);
  const [yearly, setYearly] = useState(false);
  const [currency, setCurrency] = useState<Currency>("INR");
  const [liveTest, setLiveTest] = useState(false);

  useEffect(() => {
    setCurrency(detectCurrency());
    try {
      setLiveTest(new URLSearchParams(window.location.search).get("livetest") === "1");
    } catch {
      setLiveTest(false);
    }
  }, []);

  async function pay(planId: PlanId) {
    if (!user || busy) return;
    if (!paymentHostRegistered()) {
      const target = `https://svarga.digital${window.location.search}${window.location.hash}`;
      toast.info("Payments only work on svarga.digital. Opening it now…", {
        action: { label: "Open", onClick: () => window.open(target, "_blank") },
      });
      window.open(target, "_blank");
      return;
    }
    setBusy(planId);
    const plan = PLANS[planId];
    try {
      const order = await runCreateOrder({ data: { plan: planId, currency } });
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
            toast.success(`Payment confirmed. Welcome to ${plan.name.split(" — ")[0]}.`);
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Verification failed.");
          } finally {
            setBusy(null);
          }
        },
      });
      rzp.on("payment.failed", () => {
        toast.error(
          "Payment failed. No amount was captured — you can also pay directly on GPay to 8139012237.",
        );
        setBusy(null);
      });
      // If the window is closed after paying, confirm with Razorpay directly so the
      // plan still unlocks.
      rzp.on("modal.ondismiss", () => {
        setBusy(null);
        void runCheckStatus({ data: { orderId: order.orderId } })
          .then((result) => {
            if (result.status === "paid") {
              toast.success(`Payment confirmed. Welcome to ${plan.name.split(" — ")[0]}.`);
            }
          })
          .catch(() => undefined);
      });
      rzp.open();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not start the payment.");
      setBusy(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => setYearly(false)}
          aria-pressed={!yearly}
          className={`rounded-full border px-4 py-1.5 text-xs transition-colors ${!yearly ? "border-crimson bg-crimson/10 text-crimson" : "border-ink/10 text-ink/50 hover:border-ink/30"}`}
        >
          Monthly
        </button>
        <button
          type="button"
          onClick={() => setYearly(true)}
          aria-pressed={yearly}
          className={`rounded-full border px-4 py-1.5 text-xs transition-colors ${yearly ? "border-crimson bg-crimson/10 text-crimson" : "border-ink/10 text-ink/50 hover:border-ink/30"}`}
        >
          Yearly · 2 months free
        </button>
      </div>

      <div className="flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => setCurrency("INR")}
          aria-pressed={currency === "INR"}
          className={`rounded-full border px-4 py-1.5 text-xs transition-colors ${currency === "INR" ? "border-leaf bg-leaf/10 text-leaf" : "border-ink/10 text-ink/50 hover:border-ink/30"}`}
        >
          India · ₹ INR
        </button>
        <button
          type="button"
          onClick={() => setCurrency("USD")}
          aria-pressed={currency === "USD"}
          className={`rounded-full border px-4 py-1.5 text-xs transition-colors ${currency === "USD" ? "border-leaf bg-leaf/10 text-leaf" : "border-ink/10 text-ink/50 hover:border-ink/30"}`}
        >
          Global · $ USD
        </button>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {TIERS.map((tier) => {
          const price = tier.price[currency][yearly ? "yearly" : "monthly"];
          const planId =
            tier.id === "free" ? null : (`${tier.id}_${yearly ? "yearly" : "monthly"}` as PlanId);
          const popular = "popular" in tier && tier.popular;
          return (
            <div
              key={tier.id}
              className={`flex flex-col rounded-2xl border p-6 ${popular ? "border-crimson/40 bg-sand/70 shadow-lg shadow-ink/5" : "border-ink/5 bg-sand/40"}`}
            >
              <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-crimson">
                {tier.tagline}
              </p>
              <h3 className="mt-2 font-display text-2xl font-semibold">{tier.name}</h3>
              <p className="mt-3 font-display text-4xl font-semibold">
                {price === 0 ? "Free" : money(price, currency)}
                {price === 0 ? null : (
                  <span className="text-base font-normal text-ink/50">
                    {yearly ? " / year" : " / month"}
                  </span>
                )}
              </p>
              <ul className="mt-4 flex-1 space-y-2 text-sm text-ink/70">
                {tier.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
              {planId === null ? (
                <Link
                  to="/auth"
                  className="mt-6 rounded-full border border-ink/15 px-5 py-3 text-center text-sm font-semibold text-ink/70 transition-colors hover:border-crimson hover:text-crimson"
                >
                  Start free
                </Link>
              ) : user ? (
                <button
                  type="button"
                  onClick={() => void pay(planId)}
                  disabled={busy !== null}
                  className={`mt-6 rounded-full px-5 py-3 text-sm font-semibold transition-opacity disabled:cursor-not-allowed disabled:opacity-50 ${popular ? "bg-crimson text-cream" : "border border-crimson/40 text-crimson"}`}
                >
                  {busy === planId ? "Opening secure checkout…" : `Choose ${tier.name}`}
                </button>
              ) : (
                <Link
                  to="/auth"
                  className="mt-6 rounded-full border border-crimson/40 px-5 py-3 text-center text-sm font-semibold text-crimson"
                >
                  Sign in to subscribe
                </Link>
              )}
            </div>
          );
        })}
      </div>
      <p className="text-center text-xs text-ink/45">
        Pay in rupees from India or in US dollars from anywhere else — cards, UPI, net banking and
        wallets all accepted, inclusive of applicable taxes. Every paid feature unlocks the moment
        your payment is confirmed. Cancel any time — no lock-in.
      </p>
      {liveTest && user?.email?.toLowerCase() === OWNER_EMAIL ? (
        <div className="mx-auto max-w-md rounded-2xl border border-dashed border-crimson/40 bg-sand/40 p-5 text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-crimson">
            Owner only · live rail check
          </p>
          <p className="mt-2 text-sm text-ink/70">
            Runs a genuine ₹1 payment through the same live path as a real plan.
          </p>
          <button
            type="button"
            onClick={() => void pay("free_livetest")}
            disabled={busy !== null}
            className="mt-4 rounded-full bg-crimson px-5 py-3 text-sm font-semibold text-cream disabled:opacity-50"
          >
            {busy === "free_livetest" ? "Opening secure checkout…" : "Pay ₹1 live test"}
          </button>
        </div>
      ) : null}
      <p className="text-center text-xs text-ink/55">
        Card or UPI window not working? Just send the amount on GPay, PhonePe or Paytm to{" "}
        <strong className="text-ink/80">8139012237</strong> (Aditya Mohan Menon) and message us on
        WhatsApp — we will activate your plan manually.
      </p>
    </div>
  );
}
