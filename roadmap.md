# Roadmap

## Open
- [ ] svarga.digital: user is adding the A + TXT records manually (blocked on their DNS provider; must then press Check status in Project Settings → Domains). Note: the domain currently has no working name servers — records must be added where its DNS is actually hosted.
- [ ] Publish: user declined the publish prompt; they can publish via the Publish button when ready. Domain serves only after publishing.
- [ ] Decide scope of the email brief: rebrand to SVARNA.DIGITAL dark terminal UI, or keep current Svarga design.
- [ ] If rebrand approved: dark terminal aesthetic (#090d16 bg, #111827 panels, #10b981 accent), scrollable terminal log output, EXECUTE bar.
- [ ] If approved: system prompt tuned to direct, no-filler, production-ready code output.
- [ ] If approved: "EXPORT CODE" action to download project structure.

## Done
- [x] Fixed chat/studio crash by rendering them client-side only.
- [x] Verified landing page renders and chat streams answers.
- [x] Own tab icon; all external branding removed.
- [x] Interactive pass: chat modes, mobile menu, all buttons wired.
- [x] One console for everything: chat modes + image generation in the same window.

- [ ] Connect GitHub repo sync (user action: + menu -> GitHub -> Connect project)
- [ ] Add Hostinger business email to contact section (waiting on address)
- [ ] Global card payments (Razorpay/Stripe with own keys - built-in unavailable for IN)
- [ ] Publish + verify svarga.digital DNS at Hostinger
- [ ] Write requested prompt (awaiting purpose)
- [ ] Razorpay checkout (cards + UPI): keys, server fns, payments table, checkout UI
- [ ] Zero-fault pre-launch QA pass (desktop + mobile, all flows)
