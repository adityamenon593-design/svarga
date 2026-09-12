import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";

const SEEDS = [
  "Link Vāyu and modern respiratory physiology.",
  "How does Āryabhaṭa's sine table relate to Taylor series?",
  "Compare the doṣa model with systems biology.",
];

export function ChatConsole() {
  const [input, setInput] = useState("");
  const transport = useMemo(() => new DefaultChatTransport({ api: "/api/chat" }), []);
  const { messages, sendMessage, status, stop } = useChat({
    transport,
    onError: (error) => toast.error(error.message || "Svarga could not answer just now."),
  });

  const busy = status === "submitted" || status === "streaming";

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    setInput("");
    void sendMessage({ text: trimmed });
  };

  return (
    <div className="relative rounded-3xl bg-ink p-6 shadow-2xl shadow-ink/20">
      <div className="mb-4 flex items-center gap-2">
        <span className="size-2.5 rounded-full bg-saffron" />
        <span className="size-2.5 rounded-full bg-crimson" />
        <span className="size-2.5 rounded-full bg-leaf" />
        <span className="ml-auto font-mono text-[10px] text-cream/40">parameshvara · live</span>
      </div>

      <Conversation className="h-[340px]">
        <ConversationContent className="gap-4 p-0">
          {messages.length === 0 ? (
            <div className="space-y-4">
              <p className="pt-1 text-sm leading-relaxed text-cream/70">
                Ask across both traditions — Svarga answers with the Vedic concept, its modern
                counterpart, and where the two genuinely agree.
              </p>
              <div className="flex flex-wrap gap-2">
                {SEEDS.map((seed) => (
                  <button
                    key={seed}
                    onClick={() => send(seed)}
                    className="rounded-full border border-cream/15 px-3 py-1.5 text-left text-xs text-cream/70 transition-colors hover:border-saffron/60 hover:text-saffron"
                  >
                    {seed}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {messages.map((message) => {
            const text = message.parts
              .map((part) => (part.type === "text" ? part.text : ""))
              .join("");
            if (!text) return null;
            return message.role === "user" ? (
              <div key={message.id} className="flex gap-3">
                <div className="grid size-7 shrink-0 place-items-center rounded-full bg-cream/15 font-display text-xs text-cream/70">
                  U
                </div>
                <p className="pt-1 text-sm leading-relaxed text-cream/90">{text}</p>
              </div>
            ) : (
              <Message key={message.id} from="assistant" className="gap-3">
                <div className="grid size-7 shrink-0 place-items-center rounded-full bg-saffron font-display text-xs text-ink">
                  ॐ
                </div>
                <MessageContent className="rounded-2xl rounded-tl-sm bg-cream/5 p-4 text-sm leading-relaxed text-cream/85">
                  <MessageResponse className="[&_a]:text-saffron [&_strong]:text-cream">
                    {text}
                  </MessageResponse>
                </MessageContent>
              </Message>
            );
          })}

          {status === "submitted" ? (
            <Shimmer className="font-mono text-[11px] uppercase tracking-widest">
              Reasoning across traditions…
            </Shimmer>
          ) : null}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <PromptInput
        className="mt-4 rounded-2xl border-cream/10 bg-cream/5"
        onSubmit={(_message, event) => {
          event.preventDefault();
          send(input);
        }}
      >
        <PromptInputTextarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Ask Svarga anything…"
          className="min-h-16 text-cream placeholder:text-cream/40"
        />
        <PromptInputFooter className="justify-end border-cream/10">
          <PromptInputSubmit
            status={status}
            onStop={stop}
            disabled={!busy && input.trim().length === 0}
            className="bg-crimson text-cream hover:bg-crimson/90"
          />
        </PromptInputFooter>
      </PromptInput>
    </div>
  );
}
