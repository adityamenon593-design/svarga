# Payments + hosting: what is actually possible, and the plan

## The two hard constraints

**Stripe.** The built-in Stripe option is not offered for India-registered sellers, and the fallback Stripe path requires your own Stripe account with a secret key — you said you only have Google Pay India. Creating a Stripe account needs business/KYC details only you can provide.

**Hostinger.** Svarga's accounts, chat history and image gallery run on Lovable Cloud (a managed database and server). That backend cannot be dropped onto a Hostinger static/PHP host; the site is deployed from Lovable and your domain points at it. Self-hosting on Hostinger would mean rebuilding the backend yourself from the exported code — possible, but a project, not a switch. The launch-ready path is: publish from Lovable, point svarga.digital at it (DNS records already given).

## Plan

1. **Keep the UPI/Google Pay button** already live in the Contact section as the India payment rail.
2. **Payments, pick one:**
   - **Razorpay (recommended)** — Indian merchant account, supports UPI plus international cards once enabled. You create the account and give me the key; I wire a full checkout (order creation, payment verification, success page) into the site.
   - **Your own Stripe account** — you sign up at stripe.com, then I open the key form and wire checkout. Global cards, but onboarding takes longer.
3. **Hosting** — stay deployed from Lovable; finish the two DNS records at Hostinger and publish. The app is already deployment-ready as-is (accounts, saved chats, image studio all working).
4. **Launch checklist** once a payment choice lands: checkout page, success/failure handling, then publish and verify svarga.digital.

## What I need from you

- One decision: Razorpay or your own Stripe account.
- The Hostinger business email address you want listed on the site (optional).

## Technical notes

- Checkout wiring: server-side order/checkout creation, signature verification on the callback, UPI intent for India plus card support, all server-side so keys never touch the browser.
- No database changes needed for checkout; a `payments` table can be added later to record orders once a provider is chosen.
