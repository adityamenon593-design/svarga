import { createFileRoute } from "@tanstack/react-router";
import { createOpenAI } from "@ai-sdk/openai";
import { convertToModelMessages, streamText, type UIMessage } from "ai";

const SYSTEM_PROMPT = `You are Svarga (Parameshvara 1.0), a reasoning assistant that answers by holding two knowledge traditions side by side:

1. Vedic sciences — Jyotiṣa (astronomy/astrology), Gaṇita (mathematics), Āyurveda, Yoga, Nyāya logic, Vyākaraṇa (Pāṇinian grammar), and the Upaniṣadic/Vedāntic corpus.
2. Western sciences — physics, astronomy, mathematics, evidence-based medicine, systems biology, linguistics, formal logic.

Method:
- Answer the question directly first, in clear prose.
- Where relevant, name the Vedic concept (with diacritics and a short gloss) and its modern counterpart, and state honestly where they correspond, where they only loosely analogise, and where the classical claim is not supported by modern evidence.
- Cite named sources (text and chapter, or the modern field/finding) rather than vague appeals to "ancient wisdom".
- Never give medical, legal, or financial instructions as fact; for health questions, add a brief note to consult a qualified practitioner.
- Be precise and respectful of both traditions. No mysticism as a substitute for reasoning.
Format with short paragraphs and occasional bold for key terms. Keep answers under 300 words unless asked for depth.`;

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as { messages?: unknown };
        if (!Array.isArray(body.messages)) {
          return new Response("Messages are required", { status: 400 });
        }

        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) {
          return new Response("Missing LOVABLE_API_KEY", { status: 500 });
        }

        const lovable = createOpenAI({
          baseURL: "https://ai.gateway.lovable.dev/v1",
          apiKey,
          headers: {
            "Lovable-API-Key": apiKey,
            "X-Lovable-AIG-SDK": "vercel-ai-sdk",
          },
        });

        try {
          const result = streamText({
            model: lovable.responses("openai/gpt-6-astra"),
            system: SYSTEM_PROMPT,
            messages: await convertToModelMessages(trimHistory(body.messages as UIMessage[])),
            abortSignal: request.signal,
            providerOptions: {
              openai: {
                forceReasoning: true,
                reasoningEffort: "low",
                reasoningSummary: "auto",
                store: false,
                include: ["reasoning.encrypted_content"],
              },
            },
          });

          return result.toUIMessageStreamResponse({
            sendReasoning: true,
            originalMessages: body.messages as UIMessage[],
          });
        } catch (error) {
          if (error instanceof Error && error.name === "AbortError") {
            return new Response("Cancelled", { status: 499 });
          }
          const message = error instanceof Error ? error.message : "Unknown error";
          return new Response(message, { status: 500 });
        }
      },
    },
  },
});
