import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import babyKrishna from "@/assets/baby-krishna.jpg";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import { Shimmer } from "@/components/ai-elements/shimmer";

const STARTERS = [
  "Krishna, I feel anxious about my future…",
  "Teach me about karma yoga.",
  "Tell me a story from your childhood.",
  "How do I calm my restless mind?",
];

export function BuddyKrishna() {
  const [input, setInput] = useState("");
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/svarga-chat",
        body: { mode: "balanced", persona: "krishna" },
      }),
    [],
  );
  const { messages, sendMessage, status, stop } = useChat({
    transport,
    onError: (error) => toast.error(error.message || "Krishna could not answer just now."),
  });
  const busy = status === "submitted" || status === "streaming";

  const ask = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    setInput("");
    void sendMessage({ text: trimmed });
  };

  return (
    <div className="grid gap-6 overflow-hidden rounded-3xl border border-saffron/30 bg-gradient-to-br from-saffron/10 via-cream to-cream p-6 sm:p-8 lg:grid-cols-[240px_1fr]">
      <div className="flex flex-col items-center gap-4 text-center lg:items-start lg:text-left">
        <div
          className={`svarga-holo ${busy ? "svarga-holo-active" : ""}`}
          aria-hidden={false}
          data-state={busy ? "speaking" : "idle"}
        >
          <span className="svarga-holo-ring" />
          <span className="svarga-holo-ring svarga-holo-ring-slow" />
          <img
            src={babyKrishna}
            alt="Baby Krishna — Svarga buddy"
            width={816}
            height={816}
            loading="lazy"
            className="svarga-holo-figure size-40 rounded-full border-4 border-saffron/50 object-cover lg:size-48"
          />
          <span className="svarga-holo-scan" />
          <span className="svarga-holo-base" />
        </div>
        <div>
          <h3 className="font-display text-2xl font-semibold text-ink">Baby Krishna</h3>
          <p className="mt-1 text-sm text-ink/60">
            Your little friend from Vrindavan. Ask him about duty, the mind, sorrow, courage — or
            just talk. He answers from Krishna's teachings, with love.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-2 lg:justify-start">
          {STARTERS.map((starter) => (
            <button
              key={starter}
              type="button"
              onClick={() => ask(starter)}
              disabled={busy}
              className="rounded-full border border-saffron/40 px-3 py-1.5 text-xs font-medium text-crimson transition-colors hover:bg-saffron/15 disabled:opacity-50"
            >
              {starter}
            </button>
          ))}
        </div>
      </div>

      <div className="flex min-h-[380px] flex-col rounded-2xl border border-ink/10 bg-white/60">
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {messages.length === 0 ? (
            <div className="grid h-full min-h-[280px] place-items-center text-center">
              <p className="max-w-xs text-sm text-ink/50">
                🪈 Radhe Radhe! Say hello to little Krishna — he is waiting to play and talk with
                you.
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <Message key={message.id} from={message.role}>
                <MessageContent>
                  {message.role === "assistant" ? (
                    <MessageResponse className="[&_a]:text-crimson">
                      {(message.parts ?? [])
                        .filter((part) => part.type === "text")
                        .map((part) => part.text)
                        .join("")}
                    </MessageResponse>
                  ) : (
                    <p className="whitespace-pre-wrap">
                      {(message.parts ?? [])
                        .filter((part) => part.type === "text")
                        .map((part) => part.text)
                        .join("")}
                    </p>
                  )}
                </MessageContent>
              </Message>
            ))
          )}
          {status === "submitted" ? (
            <Shimmer className="text-sm">Krishna is smiling…</Shimmer>
          ) : null}
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            ask(input);
          }}
          className="flex items-center gap-2 border-t border-ink/10 p-3"
        >
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Talk to Krishna, dear friend…"
            className="min-w-0 flex-1 rounded-full border border-ink/15 bg-cream px-4 py-2.5 text-sm outline-none placeholder:text-ink/40 focus:border-saffron"
          />
          {busy ? (
            <button
              type="button"
              onClick={() => void stop()}
              className="shrink-0 rounded-full border border-ink/15 px-4 py-2.5 text-sm font-semibold"
            >
              Stop
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim()}
              className="shrink-0 rounded-full bg-crimson px-4 py-2.5 text-sm font-semibold text-cream transition-opacity disabled:opacity-50"
            >
              Send
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
