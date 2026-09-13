# Roadmap

## Open

- [ ] svarga.digital: user is adding the A + TXT records manually (blocked on their DNS provider; must then press Check status in Project Settings → Domains). Note: the domain currently has no working name servers — records must be added where its DNS is actually hosted.
- [ ] Publish: user declined the publish prompt; they can publish via the Publish button when ready. Domain serves only after publishing.
- [ ] Decide scope of the email brief: rebrand to SVARNA.DIGITAL dark terminal UI, or keep current Svarga design.
- [ ] If rebrand approved: dark terminal aesthetic (#090d16 bg, #111827 panels, #10b981 accent), scrollable terminal log output, EXECUTE bar.
- [ ] If approved: system prompt tuned to direct, no-filler, production-ready code output.
- [ ] If approved: "EXPORT CODE" action to download project structure.
- [ ] Connect GitHub repo sync (user action: + menu → GitHub → Connect project). Private repo is fine — does not affect Lovable hosting.
- [ ] Add Hostinger business email to contact section (waiting on address).
- [x] Add Professional nav item between Settings and account area, with a matching section on the page.
- [ ] Zero-fault pre-launch QA pass (desktop + mobile, all flows).
- [x] Global pricing: INR + USD currency switch on checkout (India-affordable rupee prices kept).
- [x] Enforce plan limits server-side: paid tiers unlock their stated features only after payment.
- [x] Hide the "Edit with Lovable" badge on the published site.
- [ ] Live web search: Svarga can pull current web info during chat.
- [ ] Uncertainty guardrails: detect low-confidence answers and ask a follow-up or flag uncertainty.
- [ ] Document library: upload books, PDFs, scripture files; Svarga searches them for answers.
- [ ] Citations: show source links for web-search and uploaded-knowledge answers.
- [ ] Background ingestion/indexing: uploaded documents become searchable quickly and reliably.



## Done

- [x] Fixed chat/studio crash by rendering them client-side only.
- [x] Verified landing page renders and chat streams answers.
- [x] Own tab icon; all external branding removed.
- [x] Interactive pass: chat modes, mobile menu, all buttons wired.
- [x] One console for everything: chat modes + image generation in the same window.
- [x] Razorpay checkout (cards + UPI): keys saved, server functions, payments table, checkout UI wired.
- [x] Runtime error sweep: no current console or request failures on home / auth.

- Legal/compliance: assistant refuses unlawful requests, gives no binding legal/medical/financial advice, respects privacy and IP, and states limitations.
- Learning memory: remember user preferences and facts across conversations for signed-in users.
- Make the published site private until launch (needs Business plan; Lite cannot).
- Make "Made in India" the visual highlight across the page, especially pricing.
- [ ] Responsive polish for phone/tablet/desktop; installable home-screen app on Android + iOS.
- [ ] Discuss "train on all the data in the world": training a model from scratch is not possible here; options are broader live web research + a knowledge library Svarga can search.
