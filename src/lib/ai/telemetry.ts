export interface AiEvent {
  event: "chat_started" | "chat_completed" | "chat_failed";
  mode: string;
  model: string;
  durationMs: number;
  userId?: string | null | undefined;
  /** Prompt/input tokens billed for the call, when the provider reports them. */
  inputTokens?: number;
  /** Completion/output tokens billed for the call, when the provider reports them. */
  outputTokens?: number;
  /** Characters in the user's last message — length signal without storing content. */
  promptChars?: number;
  /** HTTP status when a gateway call fails. */
  status?: number;
  /** Short, non-sensitive failure reason. */
  reason?: string;
}

export function recordAiEvent(event: AiEvent): void {
  // Structured server logs are intentionally provider-neutral. Wire this function
  // to OpenTelemetry/Sentry/your preferred sink through an adapter when configured.
  console.info(JSON.stringify({ service: "svarga-ai", ...event, at: new Date().toISOString() }));
}
