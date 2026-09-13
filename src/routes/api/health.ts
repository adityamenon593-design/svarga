import { createFileRoute } from "@tanstack/react-router";

import { SVARGA_VERSION } from "@/lib/ai/config";

export const Route = createFileRoute("/api/health")({
  server: {
    handlers: {
      GET: async () => {
        const hasProviderKey = Boolean(process.env["LOVABLE_API_KEY"]);
        return new Response(
          JSON.stringify({
            ok: hasProviderKey,
            service: "svarga",
            version: SVARGA_VERSION,
            timestamp: new Date().toISOString(),
            dependencies: {
              ai: hasProviderKey ? "configured" : "missing",
              rag: process.env["SVARGA_RAG_ENABLED"] === "true" ? "configured" : "not-configured",
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
