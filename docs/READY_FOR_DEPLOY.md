# Ready-for-deploy gate

The branch is ready for the final deployment gate after these environment/external checks:

1. Production AI key configured.
2. Production model ID confirmed available through the gateway.
3. Supabase auth and migrations verified.
4. Razorpay test payment verified if monetization is enabled.
5. `www.svarga.digital` DNS/TLS verified.
6. CI `lint` + `build` green.
7. Smoke test chat and image generation in production.

No production secret belongs in Git. `.env.example` is the only environment template committed by this upgrade.
