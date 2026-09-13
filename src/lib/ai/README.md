# Svarga AI core

`src/lib/ai` is the application intelligence boundary.

- `config.ts` — versioned policy and model routing
- `orchestrator.ts` — model gateway + mode behavior
- `guardrails.ts` — request validation and prompt-injection handling
- `retrieval.ts` — corpus/retrieval adapter
- `memory.ts` — sanitized memory primitives
- `telemetry.ts` — provider-neutral structured events
- `types.ts` — shared contracts

Keep provider credentials server-side. Do not expose chain-of-thought. Do not claim RAG grounding until a real retrieval provider is configured.
