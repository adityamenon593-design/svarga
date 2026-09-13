# Launch notes — 2026-09-13

The `svarga-world-class` branch contains the production-oriented AI architecture upgrade. It adds model routing, versioned system policy, input guardrails, retrieval and memory adapters, telemetry, health checks, smoke evaluations, CI, and deployment documentation.

Before merging, run the CI build and verify the configured model identifier through the gateway. RAG is intentionally disabled until a real corpus/provider is connected. DNS verification for `www.svarga.digital` remains an external hosting/DNS action.
