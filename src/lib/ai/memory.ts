export interface ConversationMemory {
  summary?: string;
  preferences?: string[];
  facts?: string[];
}

/** Memory is deliberately opt-in and server-owned. Never store secrets or hidden reasoning. */
export function sanitizeMemory(memory: ConversationMemory): ConversationMemory {
  return {
    summary: memory.summary?.slice(0, 4000),
    preferences: memory.preferences?.slice(0, 20).map((v) => v.slice(0, 300)),
    facts: memory.facts?.slice(0, 20).map((v) => v.slice(0, 300)),
  };
}
