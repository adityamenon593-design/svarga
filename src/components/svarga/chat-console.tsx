import { useChat } from "@ai-sdk/react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { DefaultChatTransport } from "ai";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { Conversation, ConversationContent, ConversationScrollButton } from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import { PromptInput, PromptInputFooter, PromptInputSubmit, PromptInputTextarea } from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { useAuth } from "@/hooks/use-auth";
import { deleteConversation, listConversations, listMessages, saveImage, saveTurn } from "@/lib/history.functions";
import { generateSvargaImage } from "@/lib/image.functions";

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

  const fetchThreads = useServerFn(listConversations);
  const fetchMessages = useServerFn(listMessages);
  const persistTurn = useServerFn(saveTurn);
  const removeThread = useServerFn(deleteConversation);
  const transport = useMemo(
    () => new DefaultChatTransport({ api: "/api/svarga-chat", body: { mode } }),
    [mode],
  );
  const { messages, setMessages, sendMessage, status, stop } = useChat({
    transport,
    onError: (error) => toast.error(error.message || "Svarga could not answer just now."),
  });

  const refreshThreads = useCallback(async () => {
    if (!user) { setThreads([]); return; }
    try { setThreads((await fetchThreads()) as Thread[]); } catch { /* history is optional */ }
  }, [user, fetchThreads]);

  useEffect(() => { void refreshThreads(); }, [refreshThreads]);
  const busy = status === "submitted" || status === "streaming";

  useEffect(() => {
    if (!user || busy || messages.length === 0) return;
    const last = messages[messages.length - 1];
    if (!last || last.role !== "assistant" || savedFor.current === last.id) return;
    const answer = last.parts.map((part) => (part.type === "text" ? part.text : "")).join("");
    if (!answer.trim() || !lastPrompt.current) return;
    savedFor.current = last.id;
    const prompt = lastPrompt.current;
    void persistTurn({ data: { conversationId, prompt, answer } }).then((result) => {
      setConversationId(result.conversationId);
      void refreshThreads();
    }).catch(() => undefined);
  }, [user, busy, messages, conversationId, persistTurn, refreshThreads]);

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    setInput("");
    lastPrompt.current = trimmed;
    void sendMessage({ text: trimmed });
  };

  const openThread = async (thread: Thread) => {
    try {
      const rows = (await fetchMessages({ data: { id: thread.id } })) as Array<{ id: string; role: "user" | "assistant"; content: string }>;
      setConversationId(thread.id);
      savedFor.current = null;
      lastPrompt.current = "";
      setMessages(rows.map((row) => ({ id: row.id, role: row.role, parts: [{ type: "text" as const, text: row.content }] })));
    } catch { toast.error("That conversation could not be opened."); }
  };

  const startNew = () => { setConversationId(null); savedFor.current = null; lastPrompt.current = ""; setMessages([]); };
  const drop = async (id: string) => {
    try { await removeThread({ data: { id } }); if (conversationId === id) startNew(); void refreshThreads(); }
    catch { toast.error("That conversation could not be deleted."); }
  };

  return (
    <div className="relative rounded-3xl bg-ink p-6 shadow-2xl shadow-ink/20">
      <div className="mb-4 flex items-center gap-2"><span className="size-2.5 rounded-full bg-saffron" /><span className="size-2.5 rounded-full bg-crimson" /><span className="size-2.5 rounded-full bg-leaf" /><span className="ml-auto font-mono text-[10px] text-cream/40">svarga · made in india · live</span></div>
      <div className="mb-4 flex flex-wrap gap-2">
        {MODES.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setMode(item.id)}
            aria-pressed={mode === item.id}
            className={`rounded-full border px-3 py-1 text-[11px] transition-colors ${mode === item.id ? "border-saffron bg-saffron/15 text-saffron" : "border-cream/10 text-cream/55 hover:border-cream/30 hover:text-cream/80"}`}
          >
            {item.label}
          </button>
        ))}
      </div>
      {user ? <div className="mb-4 flex items-center gap-2 overflow-x-auto pb-1">
        <button onClick={startNew} className="shrink-0 rounded-full border border-cream/15 px-3 py-1 text-[11px] text-cream/70 hover:border-saffron/60 hover:text-saffron">+ New</button>
        {threads.map((thread) => <span key={thread.id} className={`group flex shrink-0 items-center gap-1 rounded-full border px-3 py-1 text-[11px] ${conversationId === thread.id ? "border-saffron/60 text-saffron" : "border-cream/10 text-cream/60"}`}><button onClick={() => void openThread(thread)} className="max-w-[9rem] truncate">{thread.title}</button><button onClick={() => void drop(thread.id)} aria-label="Delete conversation" className="opacity-0 transition-opacity group-hover:opacity-100">×</button></span>)}
      </div> : null}
      <Conversation className="h-[340px]"><ConversationContent className="gap-4 p-0">
        {messages.length === 0 ? <div className="space-y-4"><p className="pt-1 text-sm leading-relaxed text-cream/70">Ask across both traditions — Svarga answers with the Vedic concept, its modern counterpart, and where the two genuinely agree.</p><div className="flex flex-wrap gap-2">{SEEDS.map((seed) => <button key={seed} onClick={() => send(seed)} className="rounded-full border border-cream/15 px-3 py-1.5 text-left text-xs text-cream/70 transition-colors hover:border-saffron/60 hover:text-saffron">{seed}</button>)}</div>{!user ? <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-cream/40"><Link to="/auth" className="text-saffron">Sign in</Link>{" "}to keep your conversations</p> : null}</div> : null}
        {messages.map((message) => { const text = message.parts.map((part) => (part.type === "text" ? part.text : "")).join(""); if (!text) return null; return message.role === "user" ? <div key={message.id} className="flex gap-3"><div className="grid size-7 shrink-0 place-items-center rounded-full bg-cream/15 font-display text-xs text-cream/70">U</div><p className="pt-1 text-sm leading-relaxed text-cream/90">{text}</p></div> : <Message key={message.id} from="assistant" className="gap-3"><div className="grid size-7 shrink-0 place-items-center rounded-full bg-saffron font-display text-xs text-ink">ॐ</div><MessageContent className="rounded-2xl rounded-tl-sm bg-cream/5 p-4 text-sm leading-relaxed text-cream/85"><MessageResponse className="[&_a]:text-saffron [&_strong]:text-cream">{text}</MessageResponse></MessageContent></Message>; })}
        {status === "submitted" ? <Shimmer className="font-mono text-[11px] uppercase tracking-widest">Reasoning across traditions…</Shimmer> : null}
      </ConversationContent><ConversationScrollButton /></Conversation>
      <PromptInput className="mt-4 rounded-2xl border-cream/10 bg-cream/5" onSubmit={(_message, event) => { event.preventDefault(); send(input); }}>
        <PromptInputTextarea value={input} onChange={(event) => setInput(event.target.value)} placeholder="Ask Svarga anything…" className="min-h-16 text-cream placeholder:text-cream/40" />
        <PromptInputFooter className="justify-end border-cream/10"><PromptInputSubmit status={status} onStop={stop} disabled={!busy && input.trim().length === 0} className="bg-crimson text-cream hover:bg-crimson/90" /></PromptInputFooter>
      </PromptInput>
    </div>
  );
}
