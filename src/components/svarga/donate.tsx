import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";

import {
  createDonationOrder,
  verifyDonation,
  DONATE_UPI,
  DONATE_NAME,
  DONATION_PRESETS,
} from "@/lib/donations.functions";

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
        reject(new Error("Could not load the payment window."));
      };
      document.body.appendChild(script);
    });
  }
  return razorpayScriptPromise;
}

/** Deep link that opens GPay / PhonePe / Paytm with the amount pre-filled. */
function upiLink(amount: number): string {
  const params = new URLSearchParams({
    pa: `${DONATE_UPI}@upi`,
    pn: DONATE_NAME,
    am: String(amount),
    cu: "INR",
    tn: "Svarga.ai support",
  });
  return `upi://pay?${params.toString()}`;
}

export function DonatePanel() {
  const runCreateOrder = useServerFn(createDonationOrder);
  const runVerify = useServerFn(verifyDonation);
  const [amount, setAmount] = useState<number>(251);
  const [custom, setCustom] = useState("");
  const [busy, setBusy] = useState(false);
  const [receipt, setReceipt] = useState<{
    paymentId: string;
    orderId: string;
    amount: number;
    date: string;
  } | null>(null);

  const chosen = custom.trim() ? Math.max(10, Math.floor(Number(custom) || 0)) : amount;

  async function donate() {
    if (busy) return;
    if (!Number.isFinite(chosen) || chosen < 10) {
      toast.error("Please enter an amount of ₹10 or more.");
      return;
    }
    setBusy(true);
    try {
      const order = await runCreateOrder({ data: { amount: chosen } });
      await loadRazorpayScript();
      if (!window.Razorpay) throw new Error("Payment window unavailable.");

      const rzp = new window.Razorpay({
        key: order.keyId,
        amount: order.amountPaise,
        currency: "INR",
        name: "Svarga.ai",
        description: "Support Svarga — one-time gift",
        order_id: order.orderId,
        theme: { color: "#C2410C" },
        handler: async (resp: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          try {
            await runVerify({
              data: {
                orderId: resp.razorpay_order_id,
                paymentId: resp.razorpay_payment_id,
                signature: resp.razorpay_signature,
              },
            });
            setReceipt({
              paymentId: resp.razorpay_payment_id,
              orderId: resp.razorpay_order_id,
              amount: chosen,
              date: new Date().toLocaleString("en-IN"),
            });
            toast.success("Thank you — your gift keeps Svarga running.");
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Verification failed.");
          } finally {
            setBusy(false);
          }
        },
      });
      rzp.on("payment.failed", () => {
        toast.error(`Payment failed. You can simply send it on GPay to ${DONATE_UPI}.`);
        setBusy(false);
      });
      rzp.on("modal.ondismiss", () => setBusy(false));
      rzp.open();
    } catch (err) {
      toast.error(
        err instanceof Error
          ? `${err.message} You can also pay directly on GPay: ${DONATE_UPI}`
          : "Could not start the donation.",
      );
      setBusy(false);
    }
  }

  if (receipt) {
    return (
      <div className="rounded-2xl border border-ink/5 bg-sand/50 p-6 print:border-0">
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-crimson">Receipt</p>
        <h3 className="mt-3 font-display text-3xl font-semibold">Thank you.</h3>
        <p className="mt-2 text-sm leading-relaxed text-ink/60">
          Your gift keeps Svarga running. Keep this receipt for your records.
        </p>
        <dl className="mt-5 space-y-2 font-mono text-xs text-ink/70">
          <div className="flex justify-between border-b border-ink/10 pb-2">
            <dt>Paid to</dt>
            <dd>Svarga.ai — {DONATE_NAME}</dd>
          </div>
          <div className="flex justify-between border-b border-ink/10 pb-2">
            <dt>Amount</dt>
            <dd>₹{receipt.amount.toLocaleString("en-IN")}</dd>
          </div>
          <div className="flex justify-between border-b border-ink/10 pb-2">
            <dt>Date</dt>
            <dd>{receipt.date}</dd>
          </div>
          <div className="flex justify-between border-b border-ink/10 pb-2">
            <dt>Payment ID</dt>
            <dd>{receipt.paymentId}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Order ID</dt>
            <dd>{receipt.orderId}</dd>
          </div>
        </dl>
        <p className="mt-4 text-xs text-ink/50">
          This is a voluntary gift, not a tax-deductible donation.
        </p>
        <div className="mt-5 flex flex-wrap gap-3 print:hidden">
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-full bg-crimson px-5 py-2.5 text-sm font-semibold text-cream"
          >
            Print / save as PDF
          </button>
          <button
            type="button"
            onClick={() => {
              void navigator.clipboard.writeText(
                `Svarga.ai donation receipt\nPaid to: ${DONATE_NAME}\nAmount: Rs ${receipt.amount}\nDate: ${receipt.date}\nPayment ID: ${receipt.paymentId}\nOrder ID: ${receipt.orderId}`,
              );
              toast.success("Receipt copied.");
            }}
            className="rounded-full border border-ink/20 px-5 py-2.5 text-sm font-semibold text-ink/70"
          >
            Copy receipt
          </button>
          <button
            type="button"
            onClick={() => setReceipt(null)}
            className="rounded-full border border-ink/20 px-5 py-2.5 text-sm font-semibold text-ink/70"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-saffron/40 bg-saffron/5 p-6 sm:p-8">
      <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-crimson">
        Support Svarga
      </p>
      <h3 className="mt-2 font-display text-2xl font-semibold">Donate to Svarga</h3>
      <p className="mt-2 max-w-2xl text-sm text-ink/70">
        Svarga is built and paid for by one developer in India. Every gift goes straight into
        servers, models and keeping the free plan generous.
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        {DONATION_PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => {
              setAmount(preset);
              setCustom("");
            }}
            aria-pressed={!custom.trim() && amount === preset}
            className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
              !custom.trim() && amount === preset
                ? "border-crimson bg-crimson/10 text-crimson"
                : "border-ink/10 text-ink/60 hover:border-ink/30"
            }`}
          >
            ₹{preset.toLocaleString("en-IN")}
          </button>
        ))}
        <input
          value={custom}
          onChange={(event) => setCustom(event.target.value.replace(/[^0-9]/g, ""))}
          inputMode="numeric"
          placeholder="Any amount"
          aria-label="Custom donation amount in rupees"
          className="w-32 rounded-full border border-ink/10 bg-cream px-4 py-1.5 text-sm outline-none focus:border-crimson"
        />
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={() => void donate()}
          disabled={busy}
          className="rounded-full bg-crimson px-6 py-3 text-sm font-semibold text-cream transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? "Opening secure window…" : `Donate ₹${chosen.toLocaleString("en-IN")}`}
        </button>
        <a
          href={upiLink(chosen)}
          className="rounded-full border border-leaf/50 px-6 py-3 text-center text-sm font-semibold text-leaf"
        >
          Pay on GPay / UPI · {DONATE_UPI}
        </a>
        <button
          type="button"
          onClick={() => {
            void navigator.clipboard
              .writeText(DONATE_UPI)
              .then(() => toast.success("Number copied."))
              .catch(() => toast.error("Could not copy — the number is 8139012237."));
          }}
          className="text-sm text-ink/55 underline underline-offset-4 hover:text-crimson"
        >
          Copy number
        </button>
      </div>

      <p className="mt-4 text-xs text-ink/55">
        If the card window does not work for you, just send the amount on GPay, PhonePe or Paytm to{" "}
        <strong className="text-ink/80">{DONATE_UPI}</strong> ({DONATE_NAME}) — that reaches us
        exactly the same way.
      </p>
    </div>
  );
}
