export interface AiEvent {
  event: "chat_started" | "chat_completed" | "chat_failed";
  mode: string;
  model: string;
  durationMs: number;
  userId?: string;
}

export function recordAiEvent(event: AiEvent): void {
  // Structured server logs are intentionally provider-neutral. Wire this function
  // to OpenTelemetry/Sentry/your preferred sink through an adapter when configured.
  console.info(JSON.stringify({ service: "svarga-ai", ...event, at: new Date().toISOString() }));
}
