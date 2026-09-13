import { createFileRoute } from "@tanstack/react-router";

/** Text → speech so Svarga can read an answer aloud. */
export const Route = createFileRoute("/api/voice/speak")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) return new Response("Voice is not configured.", { status: 503 });

        const { userIdFromRequest, checkRateLimit } = await import("@/lib/entitlements.server");
        const userId = await userIdFromRequest(request);
        const rate = await checkRateLimit(request, userId);
        if (!rate.ok)
          return new Response(rate.message, {
            status: 429,
            headers: { "Retry-After": String(rate.retryAfter) },
          });

        const body = (await request.json()) as { text?: unknown };
        const text = typeof body.text === "string" ? body.text.slice(0, 3000).trim() : "";
        if (!text) return new Response("Nothing to read aloud.", { status: 400 });

        const response = await fetch("https://ai.gateway.lovable.dev/v1/audio/speech", {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "openai/gpt-4o-mini-tts",
            input: text,
            voice: "alloy",
            response_format: "mp3",
            stream_format: "audio",
          }),
        });
        if (!response.ok || !response.body) {
          const detail = await response.text().catch(() => "");
          console.error("Speech failed", response.status, detail);
          return new Response("Svarga could not speak that just now.", { status: response.status });
        }
        return new Response(response.body, { headers: { "Content-Type": "audio/mpeg" } });
      },
    },
  },
});
