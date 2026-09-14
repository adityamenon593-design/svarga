# Fine-tuning Svarga — where we actually stand

## The honest position

Svarga does not own or host an open-source model today. Answers come from a hosted
frontier model through the Lovable AI gateway. So "fine-tune our open source model"
is not a button we can press right now — there is no weights file that belongs to us.

What we *can* do splits into two tracks.

## 1. Internal tuning (available today, no training run needed)

This is what actually moves answer quality, and it is already how Svarga is shaped:

- **System policy** (`src/lib/ai/config.ts`) — persona, Presence block, Vedic-sciences
  grounding, Indian-market conventions, citation rules.
- **Answering standard** (`src/lib/ai/orchestrator.ts`) — the QUALITY_BAR, effort tiering
  (`effortFor`), tool policy, step budget.
- **Retrieval** — the user's own document library plus live web search, so the model is
  grounded in real sources instead of memory.
- **Memory** — per-user opt-in notes that pitch each answer at the right level.
- **Evals** — `evals/svarga-smoke.json` guards regressions on uncertainty, safety and
  citation behaviour. Add a case for every behaviour we care about before changing policy.

Practical loop: collect real conversations where Svarga answered badly → add a smoke case →
change policy → re-run. This is cheaper and faster than any training run and is reversible.

## 2. External fine-tuning (a real project, needs a decision)

To genuinely own a model:

1. **Pick a base**: Llama 3.x, Mistral, Gemma, or an Indic-first base such as
   Sarvam / Krutrim / BharatGPT-lineage weights. Check each licence — some forbid
   commercial redistribution, which matters given Svarga's all-rights-reserved stance.
2. **Build the dataset**: 5k–50k high-quality instruction pairs in Svarga's voice —
   Hinglish code-switching, ₹/lakh-crore conventions, Gita and Vedic citation discipline,
   refusal patterns. Sources: curated public corpora + our own reviewed transcripts
   (only with explicit user consent; strip PII first).
3. **Method**: LoRA / QLoRA adapters on a rented A100/H100 hour block. Full fine-tuning is
   not worth the cost at this stage.
4. **Serve it**: the Cloudflare Worker runtime cannot host weights. It needs a separate
   GPU inference endpoint (Together, Fireworks, Modal, or a self-hosted vLLM box) that the
   app calls the same way it calls the gateway today.
5. **Route it**: keep the frontier model as the default and send only the domain-specific
   traffic (Krishna buddy, Vedic Q&A) to the tuned model, comparing against the smoke evals
   before flipping any traffic over.

Rough cost for a first credible LoRA: a few hundred to a couple of thousand rupees-thousands
of GPU time, plus the real cost — the dataset work.

## Recommendation

Keep tuning internally until there is paying-user traffic worth learning from. Start the
external track only when (a) there is a consented transcript corpus, and (b) there is
budget for a persistent GPU endpoint. Everything in track 1 carries over to track 2.

## Ownership

Any dataset, adapter weights, prompts and evals produced here are the exclusive property of
Aditya Mohan Menon. No open-source release, licence grant or transfer without his written
approval.
