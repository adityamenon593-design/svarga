# Run a live transaction end-to-end

Goal: put a real rupee payment through Svarga on svarga.digital and confirm the money reaches your account and the plan unlocks.

## What I can and cannot do

I can drive the live site, create a real order with your live Razorpay keys, open the payment window, and read back exactly what Razorpay says. I cannot enter your UPI PIN or card OTP — the final tap has to come from your phone. So this is a two-part run: I set it up and watch it, you approve the payment.

## Step 1 — Add a ₹1 live test plan

Paying ₹149 to yourself just to test wastes fees. I will add a hidden ₹1 "Live test" option that only appears when the page is opened with `?livetest=1`, so no customer ever sees it. It uses the same live keys, same order creation, same verification and webhook path as a real plan, so if ₹1 works, ₹149 works.

## Step 2 — I open the live checkout

I will open svarga.digital with that flag, sign in, start the ₹1 order and capture the result:

- Payment window opens with a real order → the block is gone, go to Step 3.
- "Business – Website mismatch" again → Razorpay still hasn't approved svarga.digital; I stop and tell you, nothing else can proceed until it's approved in your Razorpay account under Settings → Website and App Settings.

## Step 3 — You pay the ₹1

I send you the exact link. You pay ₹1 by UPI from your phone.

## Step 4 — I confirm the whole chain

After you pay I check, in order:

1. Razorpay reports the payment captured for that order.
2. The payment row in our records flips to paid.
3. The plan unlocks for the account that paid.
4. The confirmation endpoint fired correctly.

If the automatic unlock doesn't fire, the cause is the missing webhook secret — Razorpay → Settings → Webhooks, add `https://svarga.digital/api/public/razorpay-webhook` with a secret of your choosing, and I'll store it securely.

## Step 5 — Report

I tell you plainly: payment captured yes/no, plan unlocked yes/no, settlement date Razorpay shows for the money landing in your bank (normally two working days), and anything still broken.

## Also fixing in this pass

The chat screen is currently crashing for signed-in users with a conversation list error, so anyone who pays would hit a broken chat right after. I'll fix that crash in the same run.

## Technical notes

- Add a `livetest_once` plan (₹1 / 100 paise) to `PLANS` in `src/lib/payments.functions.ts`, excluded from `TIERS`; render it in `src/components/svarga/checkout.tsx` only when `?livetest=1` is present.
- Reuse existing `createOrder` / `verifyPayment` / `checkOrderStatus` server functions unchanged.
- Guard in `paymentHostRegistered()` stays as is — the run happens on the registered host.
- Chat crash: `threads` is undefined on first render in `src/components/svarga/chat-console.tsx`; default it to an empty array and harden the loader.
- Verification: `bunx tsgo --noEmit`, `bun run lint`, `bun run build`, then publish before the live run.
