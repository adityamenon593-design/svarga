import { createFileRoute } from "@tanstack/react-router";

import { SVARGA_VERSION } from "@/lib/ai/config";

export const Route = createFileRoute("/api/health")({
  server: {
    handlers: {
      GET: async () => {
        const hasProviderKey = Boolean(
          process.env["OPENAI_API_KEY"] ||
          process.env["LOVABLE_API_KEY"] ||
          process.env["SVARGA_LOCAL_MODEL_URL"],
        );
        const hasRagProvider = Boolean(
          process.env["SVARGA_RAG_ENABLED"] === "true" &&
          (process.env["OPENAI_API_KEY"] || process.env["LOVABLE_API_KEY"]),
        );
        return new Response(
          JSON.stringify({
            ok: hasProviderKey,
            service: "svarga",
            version: SVARGA_VERSION,
            timestamp: new Date().toISOString(),
            dependencies: {
              ai: hasProviderKey ? "configured" : "missing",
              rag: hasRagProvider ? "configured" : "not-configured",
            },
          }),
          {
            status: hasProviderKey ? 200 : 503,
            headers: {
              "content-type": "application/json; charset=utf-8",
              "cache-control": "no-store",
            },
          },
        );
      },
    },
  },
});
