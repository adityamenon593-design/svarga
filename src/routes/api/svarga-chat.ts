import { createFileRoute } from "@tanstack/react-router";
import { streamSvarga } from "@/lib/ai/orchestrator";
import { gatewayFailure } from "@/lib/ai/guardrails";
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
            persona?: unknown;
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

          const { userIdFromRequest, checkQuota, recordUsage, checkRateLimit } =
            await import("@/lib/entitlements.server");
          const userId = await userIdFromRequest(request);

          const rateLimit = await checkRateLimit(request, userId);
          if (!rateLimit.ok) {
            return new Response(rateLimit.message, {
              status: 429,
              headers: { "Retry-After": String(rateLimit.retryAfter) },
            });
          }

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
            userId,
            persona: body.persona === "krishna" ? "krishna" : undefined,
          });
          return result.toUIMessageStreamResponse({
            // Internal reasoning stays server-side so Svarga's instructions and
            // private logic can never be extracted from the response stream.
            sendReasoning: false,
            originalMessages: body.messages as UIMessage[],
            // A failure mid-stream must reach the user as readable text, not a dead spinner.
            onError: (error) => gatewayFailure(error).message,
          });
        } catch (error) {
          if (error instanceof Error && error.name === "AbortError")
            return new Response("Cancelled", { status: 499 });
          const failure = gatewayFailure(error);
          const message =
            error instanceof Error && error.message.length < 240 && failure.status === 500
              ? error.message
              : failure.message;
          return new Response(message, { status: failure.status });
        }
      },
    },
  },
});
