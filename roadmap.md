# Roadmap

## Open

- [x] Continuous learning: Svarga learns each user's facts/preferences from conversation and applies them in later chats (per-user memory, not model retraining).

- [ ] "Train on Indian + global data": from-scratch training is out of scope; deliver via knowledge library uploads + live web search (needs Perplexity key).

- [x] Position Svarga as an all-in-one assistant: chat, reasoning, research, code, math, writing, images, documents, translation.

- [x] Svarga should practically help with everyday Indian problems: govt schemes, farming, health access, jobs/exams, legal/consumer rights, money, local languages.

- [x] Donate button (Razorpay + GPay/UPI 8139012237) visible on the site, with "if payment fails, pay directly on GPay" fallback note.
- [x] Free plan: 100 messages/day, 15 images/mo, reasoning mode included until paid users arrive.
- [x] LLM quality upgrade: match top-model behaviour (deep reasoning, structure, code/math).

- [ ] svarga.digital: user is adding the A + TXT records manually (blocked on their DNS provider; must then press Check status in Project Settings → Domains). Note: the domain currently has no working name servers — records must be added where its DNS is actually hosted.
- [ ] Publish: user declined the publish prompt; they can publish via the Publish button when ready. Domain serves only after publishing.
- [ ] Decide scope of the email brief: rebrand to SVARNA.DIGITAL dark terminal UI, or keep current Svarga design.
- [ ] If rebrand approved: dark terminal aesthetic (#090d16 bg, #111827 panels, #10b981 accent), scrollable terminal log output, EXECUTE bar.
- [ ] If approved: system prompt tuned to direct, no-filler, production-ready code output.
- [ ] If approved: "EXPORT CODE" action to download project structure.
- [ ] Connect GitHub repo sync (user action: + menu → GitHub → Connect project). Private repo is fine — does not affect Lovable hosting.
- [ ] Add Hostinger business email to contact section (waiting on address).
- [ ] Razorpay payout flow: explain how customer payments reach the user's account, and options for splitting/forwarding payouts to another UPI id (RazorpayX).
- [x] Add Professional nav item between Settings and account area, with a matching section on the page.
- [ ] Zero-fault pre-launch QA pass (desktop + mobile, all flows).
- [x] Global pricing: INR + USD currency switch on checkout (India-affordable rupee prices kept).
- [x] Enforce plan limits server-side: paid tiers unlock their stated features only after payment.
- [x] Hide the "Edit with Lovable" badge on the published site.
- [~] Live web search: Svarga can pull current web info during chat (implementation ready; needs a Perplexity API key or Firecrawl connection).
- [x] Uncertainty guardrails: detect low-confidence answers and ask a follow-up or flag uncertainty.
- [x] Document library: upload books, PDFs, scripture files; Svarga searches them for answers.
- [x] Citations: show source links for web-search and uploaded-knowledge answers.
- [x] Background ingestion/indexing: uploaded documents become searchable quickly and reliably.
- [x] Legal/compliance footer links: Terms & Conditions, Privacy Policy, Refund / Cancellation Policy, Contact Us with email/phone/physical address.
- [ ] Replace postal address placeholder on /contact with the real physical address.
- [x] Switch Razorpay checkout from test keys to live keys (RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET saved).



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
- [x] Diagnosed live Razorpay failure: business/website mismatch — user must register svarga.digital + www in Razorpay dashboard; checkout now shows a note on unregistered hosts.

- [x] Razorpay webhook + payment status checker (needs RAZORPAY_WEBHOOK_SECRET + dashboard webhook URL): confirm success/failure and auto-unlock the right plan
- [x] Referral/invite system: invite codes give bonus Free-plan messages to grow paid conversions
- [ ] Connect Perplexity (or equivalent) for live web answers with citations
- [x] Memory privacy: explicit consent toggle for learning + clear saved memory anytime
- [x] Svarga self-awareness: knows it is Svarga.ai, created by founder Aditya Mohan Menon
- [x] Donation confirmation + on-screen printable receipt; emailed receipt wired via notify.svarga.digital (sends once DNS verification completes).
- [x] Buddies section: Baby Krishna buddy with Krishna's principles (karma yoga, dharma, bhakti, equanimity, etc.), baby Krishna face, live chat — free for everyone.
- [x] Security scan: 4 warnings fixed — payments, donations, usage and referral tables now explicitly server-write-only.
- [x] Secure /api/chat: removed the unused unauthenticated endpoint; all chat now goes through the quota-gated route.
- [x] Homepage: professional "Chat now" CTA button leading to dedicated /chat page; embedded chat removed from homepage and replaced with a Svarga Console preview card.
- [x] Dedicated /chat page: full-screen chat console, works for guests (balanced mode only) and signed-in users (all unlocked modes), with clear back-to-home navigation.
- [x] Per-user / per-IP rate limiting on /api/svarga-chat: 30 requests/minute for signed-in users, 10/minute for guests; returns 429 with Retry-After header when exceeded. Verified abusive traffic is blocked.

- [ ] Live ₹1 transaction test on svarga.digital (user pays, I verify capture + records)
