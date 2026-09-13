import { createFileRoute, Link } from "@tanstack/react-router";
import { ClientOnly } from "@tanstack/react-router";

import { ChatConsole } from "@/components/svarga/chat-console";

function ConsoleSkeleton() {
  return <div className="h-[560px] animate-pulse rounded-3xl bg-ink/5" />;
}

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "Chat with Svarga.ai — India's own AI" },
      {
        name: "description",
        content:
          "Ask Svarga anything. Reasoning across Vedic knowledge and modern science, with image generation and memory.",
      },
      { property: "og:title", content: "Chat with Svarga.ai — India's own AI" },
      {
        property: "og:description",
        content:
          "Ask Svarga anything. Reasoning across Vedic knowledge and modern science, with image generation and memory.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ChatPage,
});

function ChatPage() {
  return (
    <div className="min-h-screen bg-cream font-sans text-ink antialiased">
      <header className="sticky top-0 z-30 border-b border-ink/10 bg-cream/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex min-w-0 items-center gap-3">
            <div className="grid size-9 place-items-center rounded-full border-2 border-saffron/50 font-display text-lg font-semibold text-saffron">
              ॐ
            </div>
            <div className="min-w-0 leading-none">
              <p className="truncate font-display text-xl font-semibold tracking-tight sm:text-2xl">
                Svarga
              </p>
              <p className="truncate font-mono text-[9px] uppercase tracking-[0.25em] text-ink/40">
                Made in India
              </p>
            </div>
          </Link>
          <Link
            to="/"
            className="rounded-full border border-ink/15 px-4 py-2 text-sm font-semibold transition-colors hover:border-ink/40"
          >
            Back home
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 text-center">
          <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            What do you want to know?
          </h1>
          <p className="mx-auto mt-2 max-w-lg text-sm text-ink/60">
            Svarga reasons across Vedic sciences and the modern frontier. Sign in to keep your
            conversations and unlock deeper modes.
          </p>
        </div>
        <ClientOnly fallback={<ConsoleSkeleton />}>
          <ChatConsole />
        </ClientOnly>
      </main>
    </div>
  );
}
