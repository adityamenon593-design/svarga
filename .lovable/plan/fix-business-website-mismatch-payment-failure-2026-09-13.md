# Fix "Business – Website mismatch" payment failure

## Diagnosis (confirmed)
Razorpay's error states: "this business is not allowed to accept payments on this website."
Checkout code, live keys, and order creation all work (verified with a real test — the payment window opened). The block is on the Razorpay account side: Razorpay only lets a live account take payments from websites you have registered with them, and the payment attempt came from a site address they don't recognise.

## Fix — steps in your Razorpay dashboard (only you can do these)
1. Log in to dashboard.razorpay.com.
2. Go to **Settings → Website and App Settings** (also reachable from the "View your registered website(s)" link in the error).
3. Register your website URL(s):
   - `https://svarga.digital`
   - `https://www.svarga.digital`
4. Submit whatever business/website details Razorpay asks for (they review the site against your KYC/business category). Approval is often quick but can take up to a few days.
5. While the site is under review, Razorpay may also require your account activation/KYC to be fully approved — check **Settings → Account & Settings** for pending items.

## Fix — one small code change (I do this)
- Make the checkout button smart about where it runs: when someone clicks "Choose plan" on an unregistered address (the preview link), show a note that live payments only work on svarga.digital, instead of opening a payment window that will fail. Once Razorpay approves the domains, this disappears on the live site and only ever shows on preview links.

## After Razorpay approves the domains
1. Publish/update the site so the latest build is live on svarga.digital.
2. Run one real ₹149 payment on the live domain to confirm end-to-end success (money settles to your linked bank account per Razorpay's normal settlement cycle, usually T+2 days).
3. Later, enable international cards in Razorpay for the USD plans (separate toggle after activation).

## What I need from you
- Do the Razorpay dashboard steps above and tell me when the website status shows approved/submitted.
