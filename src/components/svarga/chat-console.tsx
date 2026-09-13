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

type Source = { title: string; url: string };

function parseAnswer(text: string) {
  const uncertain = text.trimStart().toLowerCase().startsWith("[uncertain]");
  let body = uncertain ? text.replace(/^\[uncertain\]\s*/i, "") : text;
  const sourceMatch = body.match(/## Sources\s*([\s\S]*?)$/i);
  const sourceText = sourceMatch?.[1] ?? "";
  body = sourceMatch ? body.slice(0, sourceMatch.index).trim() : body;
  const sources: Source[] = [...sourceText.matchAll(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g)].map(
    (m) => ({
      title: m[1]!.replace(/^source:\s*/i, "").trim(),
      url: m[2]!,
    }),
  );
  return { uncertain, body, sources };
}

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
  const [attachment, setAttachment] = useState<{
    name: string;
    mediaType: string;
    url: string;
  } | null>(null);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInput = useRef<HTMLInputElement | null>(null);
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
    const answer = (last.parts ?? [])
      .map((part) => (part.type === "text" ? part.text : ""))
      .join("");
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
    if ((!trimmed && !attachment) || busy) return;
    setInput("");
    if (mode === "image") {
      lastPrompt.current = "";
      void renderInConsole(trimmed);
      return;
    }
    lastPrompt.current = trimmed;
    const files = attachment
      ? [
          {
            type: "file" as const,
            mediaType: attachment.mediaType,
            filename: attachment.name,
            url: attachment.url,
          },
        ]
      : undefined;
    setAttachment(null);
    const outgoing = trimmed || "Please look at this and help me.";
    void (files ? sendMessage({ text: outgoing, files }) : sendMessage({ text: outgoing }));
  };

  const attach = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.error("That image is too large. Keep it under 8 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () =>
      setAttachment({ name: file.name, mediaType: file.type, url: String(reader.result) });
    reader.readAsDataURL(file);
  };

  const stopRecording = () => {
    recorder.current?.stop();
    recorder.current?.stream.getTracks().forEach((track) => track.stop());
    recorder.current = null;
    setRecording(false);
  };

  const toggleMic = async () => {
    if (recording) {
      stopRecording();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const media = new MediaRecorder(stream);
      chunks.current = [];
      media.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.current.push(event.data);
      };
      media.onstop = async () => {
        const blob = new Blob(chunks.current, { type: media.mimeType || "audio/webm" });
        if (blob.size < 2048) {
          toast.error("That recording was empty — please try again.");
          return;
        }
        setTranscribing(true);
        try {
          const form = new FormData();
          form.append("audio", blob, "recording.webm");
          const response = await fetch("/api/voice/transcribe", {
            method: "POST",
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            body: form,
          });
          if (!response.ok) throw new Error(await response.text());
          const data = (await response.json()) as { text?: string };
          const heard = (data.text ?? "").trim();
          if (!heard) {
            toast.error("Svarga did not catch that. Please try again.");
            return;
          }
          setInput((current) => (current ? `${current} ${heard}` : heard));
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "Voice input failed.");
        } finally {
          setTranscribing(false);
        }
      };
      media.start();
      recorder.current = media;
      setRecording(true);
    } catch {
      toast.error("Microphone access is needed to speak to Svarga.");
    }
  };

  const speak = async (id: string, text: string) => {
    if (speakingId === id) {
      audioRef.current?.pause();
      audioRef.current = null;
      setSpeakingId(null);
      return;
    }
    audioRef.current?.pause();
    setSpeakingId(id);
    try {
      const response = await fetch("/api/voice/speak", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ text: text.slice(0, 3000) }),
      });
      if (!response.ok) throw new Error(await response.text());
      const audio = new Audio(URL.createObjectURL(await response.blob()));
      audioRef.current = audio;
      audio.onended = () => setSpeakingId(null);
      await audio.play();
    } catch (error) {
      setSpeakingId(null);
      toast.error(error instanceof Error ? error.message : "Svarga could not speak that.");
    }
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
    <div className="relative rounded-3xl border border-ink/10 bg-white p-6 shadow-2xl shadow-ink/10">
      <div className="mb-4 flex items-center gap-2">
        <span className="size-2.5 rounded-full bg-saffron" />
        <span className="size-2.5 rounded-full bg-crimson" />
        <span className="size-2.5 rounded-full bg-leaf" />
        <span className="ml-auto font-mono text-[10px] text-ink/50">
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
              className={`rounded-full border px-3 py-1 text-[11px] transition-colors ${mode === item.id ? "border-saffron bg-saffron/15 text-saffron" : "border-ink/15 text-ink/65 hover:border-ink/35 hover:text-ink"} ${locked ? "opacity-50" : ""}`}
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
            className="shrink-0 rounded-full border border-ink/15 px-3 py-1 text-[11px] text-ink/75 hover:border-saffron/70 hover:text-saffron"
          >
            + New
          </button>
          {(threads ?? []).map((thread) => (
            <span
              key={thread.id}
              className={`group flex shrink-0 items-center gap-1 rounded-full border px-3 py-1 text-[11px] ${conversationId === thread.id ? "border-saffron/70 text-saffron" : "border-ink/15 text-ink/65"}`}
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
          {(messages ?? []).length === 0 ? (
            <div className="space-y-4">
              <p className="pt-1 text-sm leading-relaxed text-ink/70">
                Ask across both traditions — Svarga answers with the Vedic concept, its modern
                counterpart, and where the two genuinely agree.
              </p>
              <div className="flex flex-wrap gap-2">
                {SEEDS.map((seed) => (
                  <button
                    key={seed}
                    onClick={() => send(seed)}
                    className="rounded-full border border-ink/15 px-3 py-1.5 text-left text-xs text-ink/70 transition-colors hover:border-saffron/70 hover:text-saffron"
                  >
                    {seed}
                  </button>
                ))}
              </div>
              {!user ? (
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink/45">
                  <Link to="/auth" className="text-crimson hover:underline">
                    Sign in
                  </Link>{" "}
                  to keep your conversations
                </p>
              ) : null}
            </div>
          ) : null}
          {(messages ?? []).map((message) => {
            const text = (message.parts ?? [])
              .map((part) => (part.type === "text" ? part.text : ""))
              .join("");
            const images = (message.parts ?? []).flatMap((part) =>
              part.type === "file" && part.mediaType?.startsWith("image/") ? [part.url] : [],
            );
            if (!text && images.length === 0) return null;
            if (message.role === "user") {
              return (
                <div key={message.id} className="flex gap-3">
                  <div className="grid size-7 shrink-0 place-items-center rounded-full bg-sand font-display text-xs text-ink/80">
                    U
                  </div>
                  <div className="space-y-2 pt-1">
                    {images.map((url) => (
                      <img
                        key={url}
                        src={url}
                        alt="Attached by the user"
                        className="max-h-40 rounded-xl border border-ink/10"
                      />
                    ))}
                    {text ? <p className="text-sm leading-relaxed text-ink/90">{text}</p> : null}
                  </div>
                </div>
              );
            }
            if (!text) return null;

            const answer = parseAnswer(text);
            return (
              <Message key={message.id} from="assistant" className="gap-3">
                <div className="grid size-7 shrink-0 place-items-center rounded-full bg-saffron font-display text-xs text-ink">
                  ॐ
                </div>
                <MessageContent className="rounded-2xl rounded-tl-sm border border-ink/10 bg-sand/40 p-4 text-sm leading-relaxed text-ink/90">
                  {answer.uncertain && (
                    <div className="mb-3 rounded-lg border border-saffron/30 bg-saffron/10 px-3 py-2 text-xs text-saffron-dark">
                      I&apos;m not fully confident about this. Could you clarify?
                    </div>
                  )}
                  <MessageResponse className="[&_a]:text-crimson [&_strong]:text-ink">
                    {answer.body}
                  </MessageResponse>
                  {answer.sources.length > 0 && (
                    <div className="mt-4 border-t border-ink/10 pt-3">
                      <p className="mb-1 font-mono text-[10px] uppercase tracking-widest text-ink/45">
                        Sources
                      </p>
                      <ul className="space-y-1">
                        {answer.sources.map((source) => (
                          <li key={source.url}>
                            <a
                              href={source.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-crimson hover:underline"
                            >
                              {source.title}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => void speak(message.id, answer.body)}
                    className="mt-3 font-mono text-[10px] uppercase tracking-widest text-ink/50 transition-colors hover:text-crimson"
                  >
                    {speakingId === message.id ? "■ Stop" : "▶ Listen"}
                  </button>
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
        className="mt-4 rounded-2xl border-ink/10 bg-sand/30"
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
          className="min-h-16 text-ink placeholder:text-ink/45"
        />
        <PromptInputFooter className="items-center justify-between border-ink/10">
          <div className="flex items-center gap-2">
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) attach(file);
                event.target.value = "";
              }}
            />
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              className="rounded-full border border-ink/15 px-3 py-1 text-[11px] text-ink/75 transition-colors hover:border-saffron/70 hover:text-saffron"
              aria-label="Attach an image"
            >
              + Image
            </button>
            <button
              type="button"
              onClick={() => void toggleMic()}
              disabled={transcribing}
              aria-pressed={recording}
              className={`rounded-full border px-3 py-1 text-[11px] transition-colors ${recording ? "border-crimson bg-crimson/15 text-crimson" : "border-ink/15 text-ink/75 hover:border-saffron/70 hover:text-saffron"}`}
            >
              {transcribing ? "Listening…" : recording ? "Stop ●" : "Speak 🎙"}
            </button>
            {attachment ? (
              <span className="flex items-center gap-1 rounded-full border border-saffron/50 px-3 py-1 text-[11px] text-saffron">
                {attachment.name.slice(0, 18)}
                <button type="button" onClick={() => setAttachment(null)} aria-label="Remove image">
                  ×
                </button>
              </span>
            ) : null}
          </div>
          <PromptInputSubmit
            status={rendering ? "submitted" : status}
            onStop={stop}
            disabled={busy || (input.trim().length === 0 && !attachment)}
            className="bg-crimson text-cream hover:bg-crimson/90"
          />
        </PromptInputFooter>
      </PromptInput>
    </div>
  );
}
