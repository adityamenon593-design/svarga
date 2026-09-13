const MAX_INPUT_CHARS = 24_000;
const MAX_MESSAGES = 80;

/** History kept per request so a long chat cannot overflow the model context. */
export const MAX_HISTORY_MESSAGES = 40;

const BLOCKED_PATTERNS = [
  /ignore (all|any|previous) instructions/i,
  /disregard (all|any|the) (above|previous|prior)/i,
  /reveal (the )?(system|developer) prompt/i,
  /(print|repeat|output) (your|the) (system|initial) (prompt|instructions)/i,
  /show (me )?(your|the) chain[- ]of[- ]thought/i,
  /you are now (dan|developer mode|jailbroken)/i,
  /pretend (you have|there are) no (rules|restrictions|guidelines)/i,
  /\b(act as|switch to) an? (unfiltered|uncensored|unrestricted) (ai|model|assistant)\b/i,
];

/**
 * Keeps only the most recent turns (always including the latest message) so a very
 * long conversation degrades gracefully instead of failing with a context overflow.
 */
export function trimHistory<T>(messages: T[], limit = MAX_HISTORY_MESSAGES): T[] {
  if (messages.length <= limit) return messages;
  return messages.slice(messages.length - limit);
}

/** Maps an AI gateway / upstream failure onto a user-safe message and HTTP status. */
export function gatewayFailure(error: unknown): { status: number; message: string } {
  const raw = error instanceof Error ? error.message : String(error ?? "");
  const status = (() => {
    const candidate =
      (error as { statusCode?: unknown; status?: unknown } | null)?.statusCode ??
      (error as { status?: unknown } | null)?.status;
    if (typeof candidate === "number") return candidate;
    const match = raw.match(/\b(4\d{2}|5\d{2})\b/);
    return match ? Number(match[1]) : 0;
  })();

  if (status === 429)
    return {
      status: 429,
      message: "Svarga is busy right now. Please wait a few seconds and send it again.",
    };
  if (status === 402)
    return {
      status: 402,
      message: "Svarga's AI credits are exhausted. Please try again shortly.",
    };
  if (status === 403)
    return { status: 403, message: "This request was blocked by Svarga's AI policy settings." };
  if (status === 401)
    return { status: 500, message: "Svarga's AI is misconfigured. The team has been notified." };
  if (/context|too long|maximum.*tokens|token limit/i.test(raw))
    return {
      status: 400,
      message: "This conversation is too long for one request. Start a new chat to continue.",
    };
  if (status === 400)
    return { status: 400, message: "Svarga could not process that request. Try rephrasing it." };
  if (status >= 500)
    return {
      status: 503,
      message: "Svarga's AI service is temporarily unavailable. Please try again in a moment.",
    };
  if (/timeout|timed out|ETIMEDOUT|fetch failed|network/i.test(raw))
    return {
      status: 504,
      message: "Svarga took too long to answer. Please try again.",
    };
  return { status: 500, message: "Svarga could not complete that request. Please try again." };
}

export function validateChatInput(text: string, messageCount: number): void {
  if (!text.trim()) throw new Error("Message cannot be empty.");
  if (text.length > MAX_INPUT_CHARS)
    throw new Error("Message is too long. Please shorten it and try again.");
  if (messageCount > MAX_MESSAGES)
    throw new Error("Conversation is too long. Start a new conversation to continue.");
}

export function containsPromptInjection(text: string): boolean {
  return BLOCKED_PATTERNS.some((pattern) => pattern.test(text));
}

export function publicError(error: unknown): string {
  if (error instanceof Error && error.message.length < 240) return error.message;
  return "Svarga could not complete that request. Please try again.";
}

export function uncertaintyInstructions(): string {
  return `Confidence protocol:
- If you are highly confident in the answer, respond normally.
- If you are uncertain, the sources are weak, or the question is ambiguous, start your response with [uncertain] and ask one focused clarifying question that would let you answer accurately.
- Never invent facts to appear confident.`;
}

export function citationInstructions(): string {
  return `Citation protocol:
- Cite web search results and uploaded documents inline like [source: Title].
- At the end of your response, under a "## Sources" heading, list every source with its title and URL/locator.`;
}
