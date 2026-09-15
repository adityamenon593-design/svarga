# Svarga production deployment checklist

## Required before launch

- [ ] Set `OPENAI_API_KEY` in the hosting provider; never commit it. The app prefers direct OpenAI/OpenAI-compatible chat and falls back to Lovable only when this is absent.
- [ ] Optionally set `OPENAI_BASE_URL` and `SVARGA_OPENAI_*_MODEL` values when using an OpenAI-compatible gateway or a newer approved model.
- [ ] Keep Hostinger as the registrar/DNS provider and Lovable as the application host; verify the apex and `www` DNS records point to the active Lovable deployment.
- [ ] Set Supabase public URL/key and verify authentication redirects.
- [ ] If payments are enabled, set Razorpay server credentials and run a test-mode payment.
- [ ] Apply the Supabase payments migration and verify RLS policies.
- [ ] Verify `/api/health` returns HTTP 200 in production.
- [ ] Verify `www.svarga.digital` DNS and TLS.
- [ ] Verify `CNAME`/hosting configuration and redirect behavior.
- [ ] Test sign-up, sign-in, sign-out, chat, cancellation, history, image generation, and payment failure paths.
- [ ] Test mobile viewport and desktop viewport.
- [ ] Confirm no secrets appear in browser bundles or logs.
- [ ] Replace any illustrative marketing benchmark numbers with measured results or remove them.

## AI production configuration

`src/lib/ai/` provides the provider abstraction, mode routing, guardrails, retrieval adapter, safe memory primitives, and telemetry. RAG remains disabled until a real corpus and vector/lexical retrieval implementation are configured. Do not claim corpus-grounded citations until that provider is live.

## Important truth-in-marketing rule

Svarga currently orchestrates configured foundation models. It is not a separately trained frontier foundation model. Do not market it as a proprietary model or claim superiority over another model without reproducible evaluation evidence.
