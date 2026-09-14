# External fine-tuning workflow — Svarga.ai

Owned exclusively by Aditya Mohan Menon. Nothing here may be redistributed or relicensed
without his written permission.

This is the working pipeline for training Svarga's own adapter on an open-source base,
from consent through to a served endpoint.

---

## 1. Consent — the only source of training data

Nothing is used for training unless the account holder switched it on.

- Setting lives on `public.user_settings`: `training_consent` (boolean, default `false`)
  and `training_consent_at` (timestamp).
- Users control it in the Privacy & invites panel on the homepage
  ("Help train Svarga"). Off by default; reversible at any time.
- `setTrainingConsent` in `src/lib/settings.functions.ts` writes it and stamps the date.

Never widen this. Assumed consent is not consent.

## 2. Export — `exportTrainingCorpus`

`src/lib/training.functions.ts`, owner-only (checks the caller's email against the
founder account). It:

1. Reads every `user_settings` row with `training_consent = true`.
2. Pulls only those users' `messages`, ordered by time.
3. Pairs each user turn with the assistant turn that followed it.
4. Scrubs phone numbers, emails, Aadhaar-shaped and PAN-shaped strings — and then
   **drops** any pair that needed scrubbing, rather than keeping a patched version.
5. Filters out stubs (instruction under 8 chars, answer under the requested minimum).
6. Returns the pairs plus a ready-to-save JSONL string.

Output shape, one object per line:

```json
{"instruction": "...", "output": "..."}
```

Review a sample by hand before every training run. The dataset is the product;
the training run is the cheap part.

## 3. Train — LoRA adapter in Colab

`notebooks/svarga-colab-workbench.ipynb`, section 5.

- Base: `unsloth/llama-3.1-8b-instruct-bnb-4bit` by default. Swap in an Indic-first base
  (Sarvam, Krutrim lineage) if the traffic is mostly Indian-language.
  **Check the base licence before any commercial use** — some forbid redistribution,
  which matters given Svarga's all-rights-reserved position.
- Method: QLoRA, r=16, 2 epochs, lr 2e-4, 4-bit. Runs on a free Colab T4.
- Every example is wrapped in the Svarga system voice so the adapter learns tone
  as well as content.
- Full fine-tuning is not worth the cost at this stage. Adapters only.

Target dataset size for a first credible adapter: 3,000–20,000 reviewed pairs.
Below ~1,000 the adapter mostly learns noise.

## 4. Evaluate before anything ships

Run the tuned model and the live model on the same fixed question set
(`evals/svarga-smoke.json` plus 20 real user questions). Compare on:

- factual accuracy
- citation discipline (no invented verses or sources)
- refusal behaviour on medical, legal and financial questions
- Indian conventions: ₹, lakh/crore, IST, DD/MM/YYYY
- tone

Ship only if the adapter wins clearly. A tie means keep the current model.

## 5. Export the artifact

The notebook saves to `/content/svarga-lora-adapter` and zips it. That zip — a few
hundred MB, not a full model — is the deliverable. Keep it in private storage.
It is Svarga's property, not the GPU provider's.

## 6. Deploy

The live site runs on an edge runtime that **cannot host model weights**. Serving needs a
separate GPU endpoint:

| Option | Good for | Note |
| --- | --- | --- |
| Together AI | fastest path, upload the LoRA | per-token pricing, no server to run |
| Fireworks AI | low latency, LoRA hosting | similar model |
| Modal | full control, scale-to-zero | pay per GPU-second |
| Self-hosted vLLM | cheapest at volume | you run the box and the uptime |

Whichever is chosen, it exposes an OpenAI-compatible endpoint. The app then calls it
exactly as it calls the gateway today.

## 7. Route traffic gradually

Do not flip everything over. In `src/lib/ai/orchestrator.ts`, route by intent:

1. Start with the Krishna buddy and Vedic Q&A only — the narrow domain the adapter
   was trained for.
2. Keep the frontier model as the default for everything else.
3. Watch the telemetry in `src/lib/ai/telemetry.ts`: latency, error rate, token cost.
4. Widen only where the adapter measurably wins.

A fallback to the gateway model must stay in place for any request the endpoint
fails or times out on.

## Cost sketch

| Item | Rough cost |
| --- | --- |
| First LoRA run (free Colab T4) | ₹0, ~2–4 hours |
| Serious run (rented A100, ~4h) | ₹1,500–4,000 |
| Hosted LoRA endpoint | per-token, from ~₹0 idle |
| Dedicated GPU box | ₹25,000+/month |

The real cost is dataset curation, not GPU time.
