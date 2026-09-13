import { createFileRoute } from "@tanstack/react-router";
import { streamSvarga } from "@/lib/ai/orchestrator";
import type { UIMessage } from "ai";

export const Route = createFileRoute("/api/svarga-chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as { messages?: unknown; mode?: unknown };
          if (!Array.isArray(body.messages)) return new Response("Messages are required", { status: 400 });
          const mode = body.mode === "research" || body.mode === "reasoning" || body.mode === "creative" ? body.mode : "balanced";
          const { result } = await streamSvarga({ messages: body.messages as UIMessage[], mode });
          return result.toUIMessageStreamResponse({ originalMessages: body.messages as UIMessage[] });
        } catch (error) {
          if (error instanceof Error && error.name === "AbortError") return new Response("Cancelled", { status: 499 });
          const message = error instanceof Error && error.message.length < 240 ? error.message : "Svarga could not complete that request.";
          return new Response(message, { status: 500 });
        }
      },
    },
  },
});
