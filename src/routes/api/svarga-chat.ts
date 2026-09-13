import { createFileRoute } from "@tanstack/react-router";
import { streamSvarga } from "@/lib/ai/orchestrator";
import type { UIMessage } from "ai";

export const Route = createFileRoute("/api/svarga-chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as {
            messages?: unknown;
            mode?: unknown;
            memory?: unknown;
          };
          if (!Array.isArray(body.messages))
            return new Response("Messages are required", { status: 400 });
          const mode =
            body.mode === "research" || body.mode === "reasoning" || body.mode === "creative"
              ? body.mode
              : "balanced";
          const memory = Array.isArray(body.memory)
            ? body.memory.filter((item): item is string => typeof item === "string").slice(0, 20)
            : [];

          const { userIdFromRequest, checkQuota, recordUsage } =
            await import("@/lib/entitlements.server");
          const userId = await userIdFromRequest(request);
          if (!userId) {
            if (mode !== "balanced")
              return new Response("Sign in to use this mode — it is part of the paid plans.", {
                status: 401,
              });
          } else {
            const gate = await checkQuota(userId, "question", mode);
            if (!gate.ok) return new Response(gate.message, { status: gate.status });
            await recordUsage(userId, "question");
          }

          const { result } = await streamSvarga({
            messages: body.messages as UIMessage[],
            mode,
            memory,
            userId: userId ?? undefined,
          });
          return result.toUIMessageStreamResponse({
            sendReasoning: true,
            originalMessages: body.messages as UIMessage[],
          });
        } catch (error) {
          if (error instanceof Error && error.name === "AbortError")
            return new Response("Cancelled", { status: 499 });
          const message =
            error instanceof Error && error.message.length < 240
              ? error.message
              : "Svarga could not complete that request.";
          return new Response(message, { status: 500 });
        }
      },
    },
  },
});
