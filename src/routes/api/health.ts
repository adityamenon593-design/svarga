import { json } from "@tanstack/react-start";
import { SVARGA_VERSION } from "@/lib/ai/config";

export function GET() {
  const hasProviderKey = Boolean(process.env.LOVABLE_API_KEY);
  return json({
    ok: hasProviderKey,
    service: "svarga",
    version: SVARGA_VERSION,
    timestamp: new Date().toISOString(),
    dependencies: {
      ai: hasProviderKey ? "configured" : "missing",
      rag: process.env.SVARGA_RAG_ENABLED === "true" ? "configured" : "not-configured",
    },
  }, { status: hasProviderKey ? 200 : 503 });
}
