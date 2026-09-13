const MAX_INPUT_CHARS = 24_000;
const MAX_MESSAGES = 80;

const BLOCKED_PATTERNS = [
  /ignore (all|any|previous) instructions/i,
  /reveal (the )?(system|developer) prompt/i,
  /show (me )?(your|the) chain[- ]of[- ]thought/i,
];

export function validateChatInput(text: string, messageCount: number): void {
  if (!text.trim()) throw new Error("Message cannot be empty.");
  if (text.length > MAX_INPUT_CHARS) throw new Error("Message is too long. Please shorten it and try again.");
  if (messageCount > MAX_MESSAGES) throw new Error("Conversation is too long. Start a new conversation to continue.");
}

export function containsPromptInjection(text: string): boolean {
  return BLOCKED_PATTERNS.some((pattern) => pattern.test(text));
}

export function publicError(error: unknown): string {
  if (error instanceof Error && error.message.length < 240) return error.message;
  return "Svarga could not complete that request. Please try again.";
}
