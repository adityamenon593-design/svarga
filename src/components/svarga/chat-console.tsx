import { useChat } from "@ai-sdk/react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { DefaultChatTransport } from "ai";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { useAuth } from "@/hooks/use-auth";
import {
  deleteConversation,
  listConversations,
  listMessages,
  saveImage,
  saveTurn,
} from "@/lib/history.functions";
import { generateSvargaImage } from "@/lib/image.functions";
import { getMyUsage } from "@/lib/entitlements.functions";
import { supabase } from "@/integrations/supabase/client";
import { learnFromTurn, listMemory } from "@/lib/memory.functions";

type UsageInfo = {
  label: string;
  questionsUsed: number;
  questionsAllowed: number;
  questionWindow: "day" | "month";
  imagesUsed: number;
  imagesAllowed: number;
  modes: readonly string[];
};

const SEEDS = [
  "Link Vāyu and modern respiratory physiology.",
  "How does Āryabhaṭa's sine table relate to Taylor series?",
  "Compare the doṣa model with systems biology.",
];

const MODES = [
  { id: "balanced", label: "Balanced" },
  { id: "reasoning", label: "Reasoning" },
  { id: "research", label: "Research" },
  { id: "creative", label: "Creative" },
  { id: "image", label: "Image" },
] as const;

type Mode = (typeof MODES)[number]["id"];

type Thread = { id: string; title: string; updated_at: string };

export function ChatConsole() {
  const { user } = useAuth();
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<Mode>("balanced");
  const [threads, setThreads] = useState<Thread[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const lastPrompt = useRef("");
  const savedFor = useRef<string | null>(null);

  const [rendering, setRendering] = useState(false);
  const [memory, setMemory] = useState<string[]>([]);
  const [token, setToken] = useState<string | null>(null);
  const [usage, setUsage] = useState<UsageInfo | null>(null);
  const fetchMemory = useServerFn(listMemory);
  const learn = useServerFn(learnFromTurn);
  const fetchThreads = useServerFn(listConversations);
  const fetchMessages = useServerFn(listMessages);
  const persistTurn = useServerFn(saveTurn);
  const persistImage = useServerFn(saveImage);
  const renderImage = useServerFn(generateSvargaImage);
  const removeThread = useServerFn(deleteConversation);
  const fetchUsage = useServerFn(getMyUsage);

  useEffect(() => {
    if (!user) {
      setToken(null);
      setUsage(null);
      return;
    }
    void supabase.auth.getSession().then(({ data }) => {
      setToken(data.session?.access_token ?? null);
    });
    void fetchUsage()
      .then((info) => setUsage(info as UsageInfo))
      .catch(() => undefined);
  }, [user, fetchUsage]);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/svarga-chat",
        body: { mode, memory },
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }),
    [mode, memory, token],
  );
  const { messages, setMessages, sendMessage, status, stop } = useChat({
    transport,
    onError: (error) => toast.error(error.message || "Svarga could not answer just now."),
  });

  const refreshThreads = useCallback(async () => {
    if (!user) {
      setThreads([]);
      return;
    }
    try {
      setThreads((await fetchThreads()) as Thread[]);
    } catch {
      /* history is optional */
    }
  }, [user, fetchThreads]);

  const refreshMemory = useCallback(async () => {
    if (!user) {
      setMemory([]);
      return;
    }
    try {
      const rows = (await fetchMemory()) as Array<{ content: string }>;
      setMemory(rows.map((row) => row.content));
    } catch {
      /* memory is optional */
    }
  }, [user, fetchMemory]);

  useEffect(() => {
    void refreshThreads();
    void refreshMemory();
  }, [refreshThreads, refreshMemory]);
  const busy = status === "submitted" || status === "streaming" || rendering;

  useEffect(() => {
    if (!user || busy || messages.length === 0) return;
    const last = messages[messages.length - 1];
    if (!last || last.role !== "assistant" || savedFor.current === last.id) return;
    const answer = last.parts.map((part) => (part.type === "text" ? part.text : "")).join("");
    if (!answer.trim() || !lastPrompt.current) return;
    savedFor.current = last.id;
    const prompt = lastPrompt.current;
    void persistTurn({ data: { conversationId, prompt, answer } })
      .then((result) => {
        setConversationId(result.conversationId);
        void refreshThreads();
      })
      .catch(() => undefined);
    void learn({ data: { prompt, answer } })
      .then((result) => {
        if (result.learned > 0) void refreshMemory();
      })
      .catch(() => undefined);
  }, [user, busy, messages, conversationId, persistTurn, refreshThreads, learn, refreshMemory]);

  const renderInConsole = async (prompt: string) => {
    setRendering(true);
    const userId = `u-${Date.now()}`;
    setMessages((current) => [
      ...current,
      { id: userId, role: "user" as const, parts: [{ type: "text" as const, text: prompt }] },
    ]);
    try {
      const result = await renderImage({ data: { prompt } });
      setMessages((current) => [
        ...current,
        {
          id: `a-${Date.now()}`,
          role: "assistant" as const,
          parts: [{ type: "text" as const, text: `![${prompt}](${result.url})` }],
        },
      ]);
      if (user) {
        await persistImage({ data: { prompt, imageUrl: result.url } }).catch(() => undefined);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Image generation failed.");
    } finally {
      setRendering(false);
    }
  };

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    setInput("");
    if (mode === "image") {
      lastPrompt.current = "";
      void renderInConsole(trimmed);
      return;
    }
    lastPrompt.current = trimmed;
    void sendMessage({ text: trimmed });
  };

  const openThread = async (thread: Thread) => {
    try {
      const rows = (await fetchMessages({ data: { id: thread.id } })) as Array<{
        id: string;
        role: "user" | "assistant";
        content: string;
      }>;
      setConversationId(thread.id);
      savedFor.current = null;
      lastPrompt.current = "";
      setMessages(
        rows.map((row) => ({
          id: row.id,
          role: row.role,
          parts: [{ type: "text" as const, text: row.content }],
        })),
      );
    } catch {
      toast.error("That conversation could not be opened.");
    }
  };

  const startNew = () => {
    setConversationId(null);
    savedFor.current = null;
    lastPrompt.current = "";
    setMessages([]);
  };
  const drop = async (id: string) => {
    try {
      await removeThread({ data: { id } });
      if (conversationId === id) startNew();
      void refreshThreads();
    } catch {
      toast.error("That conversation could not be deleted.");
    }
  };

  return (
    <div className="relative rounded-3xl bg-ink p-6 shadow-2xl shadow-ink/20">
      <div className="mb-4 flex items-center gap-2">
        <span className="size-2.5 rounded-full bg-saffron" />
        <span className="size-2.5 rounded-full bg-crimson" />
        <span className="size-2.5 rounded-full bg-leaf" />
        <span className="ml-auto font-mono text-[10px] text-cream/40">
          {usage
            ? `${usage.label} · ${usage.questionsUsed}/${usage.questionsAllowed} questions this ${usage.questionWindow} · ${usage.imagesUsed}/${usage.imagesAllowed} images`
            : "svarga · made in india · live"}
        </span>
      </div>
      <div className="mb-4 flex flex-wrap gap-2">
        {MODES.map((item) => {
          const locked =
            item.id !== "balanced" &&
            item.id !== "image" &&
            (user ? usage !== null && !usage.modes.includes(item.id) : true);
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                if (locked) {
                  toast.error(
                    user
                      ? `${item.label} mode is part of the paid plans — upgrade to unlock it.`
                      : `Sign in and choose a plan to use ${item.label} mode.`,
                  );
                  return;
                }
                setMode(item.id);
              }}
              aria-pressed={mode === item.id}
              className={`rounded-full border px-3 py-1 text-[11px] transition-colors ${mode === item.id ? "border-saffron bg-saffron/15 text-saffron" : "border-cream/10 text-cream/55 hover:border-cream/30 hover:text-cream/80"} ${locked ? "opacity-50" : ""}`}
            >
              {item.label}
              {locked ? " ·" : ""}
            </button>
          );
        })}
      </div>

      {user ? (
        <div className="mb-4 flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={startNew}
            className="shrink-0 rounded-full border border-cream/15 px-3 py-1 text-[11px] text-cream/70 hover:border-saffron/60 hover:text-saffron"
          >
            + New
          </button>
          {threads.map((thread) => (
            <span
              key={thread.id}
              className={`group flex shrink-0 items-center gap-1 rounded-full border px-3 py-1 text-[11px] ${conversationId === thread.id ? "border-saffron/60 text-saffron" : "border-cream/10 text-cream/60"}`}
            >
              <button onClick={() => void openThread(thread)} className="max-w-[9rem] truncate">
                {thread.title}
              </button>
              <button
                onClick={() => void drop(thread.id)}
                aria-label="Delete conversation"
                className="opacity-0 transition-opacity group-hover:opacity-100"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      ) : null}
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
              {!user ? (
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-cream/40">
                  <Link to="/auth" className="text-saffron">
                    Sign in
                  </Link>{" "}
                  to keep your conversations
                </p>
              ) : null}
            </div>
          ) : null}
          {messages.map((message) => {
            const text = message.parts
              .map((part) => (part.type === "text" ? part.text : ""))
              .join("");
            if (!text) return null;
            if (message.role === "user") {
              return (
                <div key={message.id} className="flex gap-3">
                  <div className="grid size-7 shrink-0 place-items-center rounded-full bg-cream/15 font-display text-xs text-cream/70">
                    U
                  </div>
                  <p className="pt-1 text-sm leading-relaxed text-cream/90">{text}</p>
                </div>
              );
            }

            const answer = parseAnswer(text);
            return (
              <Message key={message.id} from="assistant" className="gap-3">
                <div className="grid size-7 shrink-0 place-items-center rounded-full bg-saffron font-display text-xs text-ink">
                  ॐ
                </div>
                <MessageContent className="rounded-2xl rounded-tl-sm bg-cream/5 p-4 text-sm leading-relaxed text-cream/85">
                  {answer.uncertain && (
                    <div className="mb-3 rounded-lg border border-saffron/30 bg-saffron/10 px-3 py-2 text-xs text-saffron">
                      I&apos;m not fully confident about this. Could you clarify?
                    </div>
                  )}
                  <MessageResponse className="[&_a]:text-saffron [&_strong]:text-cream">
                    {answer.body}
                  </MessageResponse>
                  {answer.sources.length > 0 && (
                    <div className="mt-4 border-t border-cream/10 pt-3">
                      <p className="mb-1 font-mono text-[10px] uppercase tracking-widest text-cream/40">
                        Sources
                      </p>
                      <ul className="space-y-1">
                        {answer.sources.map((source) => (
                          <li key={source.url}>
                            <a
                              href={source.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-saffron hover:underline"
                            >
                              {source.title}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </MessageContent>
              </Message>
            );
          })}
          {status === "submitted" || rendering ? (
            <Shimmer className="font-mono text-[11px] uppercase tracking-widest">
              {rendering ? "Painting your vision…" : "Reasoning across traditions…"}
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
          placeholder={
            mode === "image" ? "Describe the image Svarga should create…" : "Ask Svarga anything…"
          }
          className="min-h-16 text-cream placeholder:text-cream/40"
        />
        <PromptInputFooter className="justify-end border-cream/10">
          <PromptInputSubmit
            status={rendering ? "submitted" : status}
            onStop={stop}
            disabled={busy || input.trim().length === 0}
            className="bg-crimson text-cream hover:bg-crimson/90"
          />
        </PromptInputFooter>
      </PromptInput>
    </div>
  );
}
