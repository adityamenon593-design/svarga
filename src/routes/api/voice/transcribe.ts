import { createFileRoute } from "@tanstack/react-router";

/** Speech → text for the chat composer's microphone. */
export const Route = createFileRoute("/api/voice/transcribe")({
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

        const form = await request.formData();
        const audio = form.get("audio");
        if (!(audio instanceof File) || audio.size < 2048)
          return new Response("That recording was empty — please try again.", { status: 400 });
        if (audio.size > 12 * 1024 * 1024)
          return new Response("That recording is too long. Keep it under a minute.", {
            status: 413,
          });

        const type = audio.type.split(";")[0] ?? "";
        const ext =
          (
            {
              "audio/webm": "webm",
              "audio/ogg": "ogg",
              "audio/mp4": "mp4",
              "audio/mpeg": "mp3",
              "audio/wav": "wav",
              "audio/x-wav": "wav",
            } as Record<string, string>
          )[type] ?? "webm";

        const upstream = new FormData();
        upstream.append("model", "google/gemini-3.5-transcribe");
        upstream.append("file", audio, `recording.${ext}`);

        const response = await fetch("https://ai.gateway.lovable.dev/v1/audio/transcriptions", {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}` },
          body: upstream,
        });
        if (!response.ok) {
          const detail = await response.text().catch(() => "");
          console.error("Transcription failed", response.status, detail);
          return new Response("Svarga could not hear that clearly. Please try again.", {
            status: response.status,
          });
        }
        const data = (await response.json()) as { text?: string };
        return Response.json({ text: data.text ?? "" });
      },
    },
  },
});
