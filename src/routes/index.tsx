import { createFileRoute, ClientOnly, Link } from "@tanstack/react-router";
import { useState } from "react";

import { useAuth } from "@/hooks/use-auth";

import { ChatConsole } from "@/components/svarga/chat-console";
import { ImageStudio } from "@/components/svarga/image-studio";
import { SettingsPanel } from "@/components/svarga/settings-panel";
import { ContactPanel } from "@/components/svarga/contact-panel";
import { Checkout } from "@/components/svarga/checkout";

function AccountNav() {
  const { user, signOut } = useAuth();

  if (!user) {
    return (
      <div className="flex items-center gap-3">
        <Link to="/auth" className="hidden text-sm font-medium sm:block">
          Sign in
        </Link>
        <Link to="/auth" className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-cream">
          Get started
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="hidden max-w-[12rem] truncate text-sm text-ink/60 sm:block">
        {user.email}
      </span>
      <button
        onClick={() => void signOut()}
        className="rounded-full border border-ink/15 px-4 py-2 text-sm font-semibold transition-colors hover:border-ink/40"
      >
        Sign out
      </button>
    </div>
  );
}

function ConsoleSkeleton() {
  return <div className="h-[560px] animate-pulse rounded-3xl bg-ink/5" />;
}

function StudioSkeleton() {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      <div className="h-[260px] animate-pulse rounded-2xl bg-ink/5" />
      <div className="aspect-[16/11] animate-pulse rounded-2xl bg-ink/5" />
    </div>
  );
}

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Svarga.ai — Where ancient knowledge meets the frontier" },
      {
        name: "description",
        content:
          "Svarga.ai reasons across Vedic sciences and the Western canon, with a live console and an image studio you can use right now.",
      },
      { property: "og:title", content: "Svarga.ai — Where ancient knowledge meets the frontier" },
      {
        property: "og:description",
        content:
          "Svarga.ai reasons across Vedic sciences and the Western canon, with a live console and an image studio you can use right now.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const BENCHMARKS = [
  { name: "Parameshvara 2.0", score: 96.8, tone: "bg-crimson", muted: false },
  { name: "Frontier Model A", score: 88.1, tone: "bg-saffron", muted: true },
  { name: "Frontier Model B", score: 84.7, tone: "bg-saffron", muted: true },
];

const NAV = [
  { href: "#console", label: "Console" },
  { href: "#benchmarks", label: "Benchmarks" },
  { href: "#capacities", label: "Capacities" },
  { href: "#studio", label: "Studio" },
  { href: "#pricing", label: "Pricing" },
  { href: "#professional", label: "Professional" },
  { href: "#contact", label: "Contact" },
  { href: "#settings", label: "Settings" },
];

function Index() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-cream font-sans text-ink antialiased">
      <header className="sticky top-0 z-30 border-b border-ink/10 bg-cream/90 backdrop-blur">
        <div className="flex h-16 items-center justify-between px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-full border-2 border-saffron/50 font-display text-lg font-semibold text-saffron">
              ॐ
            </div>
            <div className="leading-none">
              <p className="font-display text-2xl font-semibold tracking-tight">Svarga</p>
              <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-ink/40">
                Made in India
              </p>
            </div>
          </div>
          <nav className="hidden items-center gap-8 text-sm font-medium text-ink/70 md:flex">
            {NAV.map((item) => (
              <a key={item.href} href={item.href} className="transition-colors hover:text-crimson">
                {item.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <ClientOnly fallback={<div className="h-9 w-24" />}>
              <AccountNav />
            </ClientOnly>
            <button
              type="button"
              aria-label="Toggle menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
              className="grid size-9 place-items-center rounded-full border border-ink/15 md:hidden"
            >
              {menuOpen ? "✕" : "☰"}
            </button>
          </div>
        </div>
        {menuOpen ? (
          <nav className="grid gap-1 border-t border-ink/10 px-6 py-3 text-sm font-medium text-ink/70 md:hidden">
            {NAV.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-2 py-2 hover:bg-sand/70"
              >
                {item.label}
              </a>
            ))}
          </nav>
        ) : null}
      </header>

      <main className="mx-auto max-w-6xl px-6 lg:px-8">
        <section id="console" className="grid items-center gap-12 pt-16 pb-10 lg:grid-cols-2">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-saffron/60 bg-saffron/15 px-3 py-1">
              <span className="text-sm leading-none">🇮🇳</span>
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-crimson">
                Made in India · Viksit Bharat
              </span>
            </div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-saffron/40 bg-sand/60 px-3 py-1">
              <span className="size-1.5 animate-sv-pulse rounded-full bg-crimson" />
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink/60">
                Parameshvara 2.0 · v2.0.0
              </span>
            </div>
            <h1 className="font-display leading-[0.95] tracking-tight">
              <span className="block text-6xl font-semibold">India&rsquo;s own AI, where</span>
              <span className="block text-6xl font-semibold">ancient knowledge</span>
              <span className="block text-6xl font-semibold text-crimson">meets the frontier.</span>
            </h1>
            <p className="mt-6 max-w-md leading-relaxed text-ink/70">
              Built in India. Svarga reasons across the Vedic sciences and the Western canon in a
              single grounded answer — and renders what it describes. Ask it something on the right.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#studio"
                className="rounded-full bg-crimson px-6 py-3 text-sm font-semibold text-cream"
              >
                Open the image studio
              </a>
              <a
                href="#capacities"
                className="rounded-full border border-ink/20 px-6 py-3 text-sm font-semibold"
              >
                See the capacities
              </a>
            </div>
            <div className="mt-8 flex gap-8">
              <div>
                <p className="font-display text-3xl font-semibold">4.2×</p>
                <p className="mt-1 text-xs text-ink/50">Training corpus</p>
              </div>
              <div>
                <p className="font-display text-3xl font-semibold">212 T</p>
                <p className="mt-1 text-xs text-ink/50">Parameters</p>
              </div>
              <div>
                <p className="font-display text-3xl font-semibold">39</p>
                <p className="mt-1 text-xs text-ink/50">Languages</p>
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-6 animate-sv-spin rounded-full bg-saffron/10 blur-3xl" />
            <div className="relative">
              <ClientOnly fallback={<ConsoleSkeleton />}>
                <ChatConsole />
              </ClientOnly>
            </div>
          </div>
        </section>

        <section id="benchmarks" className="border-t border-ink/10 py-14">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-crimson">
                Benchmarks
              </p>
              <h2 className="mt-2 font-display text-4xl font-semibold">
                Outpacing every incumbent
              </h2>
            </div>
            <p className="hidden max-w-xs text-sm text-ink/50 sm:block">
              Composite reasoning, multimodal image, and multilingual scores. Higher is better.
            </p>
          </div>
          <div className="space-y-6">
            {BENCHMARKS.map((row) => (
              <div key={row.name}>
                <div
                  className={`mb-2 flex justify-between font-mono text-xs ${row.muted ? "text-ink/50" : "text-ink/60"}`}
                >
                  <span>{row.name}</span>
                  <span>{row.score}</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-sand">
                  <div
                    className={`h-full rounded-full ${row.tone}`}
                    style={{ width: `${row.score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="capacities" className="border-t border-ink/10 py-14">
          <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.25em] text-crimson">
            Capacities
          </p>
          <h2 className="mb-8 font-display text-4xl font-semibold">One model, every discipline.</h2>
          <div className="grid gap-5 md:grid-cols-3">
            <div className="rounded-2xl border border-ink/5 bg-sand/50 p-6">
              <div className="grid size-10 place-items-center rounded-xl bg-crimson/10 font-display text-xl text-crimson">
                ॐ
              </div>
              <h3 className="mt-4 font-display text-2xl font-semibold">Vedantic Reasoning</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink/60">
                Cites Upaniṣadic and Āyurvedic sources alongside peer-reviewed literature in a
                single, grounded response.
              </p>
            </div>
            <div className="rounded-2xl border border-ink/5 bg-sand/50 p-6">
              <div className="grid size-10 place-items-center rounded-xl bg-saffron/20 font-display text-xl text-marigold">
                ◈
              </div>
              <h3 className="mt-4 font-display text-2xl font-semibold">Image Generation</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink/60">
                Luminous, high-fidelity imagery rendered from the same understanding that writes the
                answer — live in the studio below.
              </p>
            </div>
            <div className="rounded-2xl border border-ink/5 bg-sand/50 p-6">
              <div className="grid size-10 place-items-center rounded-xl bg-leaf/15 font-display text-xl text-leaf">
                ✦
              </div>
              <h3 className="mt-4 font-display text-2xl font-semibold">Multilingual · 39</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink/60">
                Fluent across Sanskrit, Hindi, English and 36 more, tuned for nuance and cultural
                context.
              </p>
            </div>
          </div>
        </section>

        <section id="studio" className="border-t border-ink/10 py-14">
          <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.25em] text-crimson">
            Studio
          </p>
          <h2 className="mb-8 font-display text-4xl font-semibold">Render what it describes.</h2>
          <ClientOnly fallback={<StudioSkeleton />}>
            <ImageStudio />
          </ClientOnly>
        </section>

        <section id="pricing" className="border-t border-ink/10 py-14">
          <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.25em] text-crimson">
            Pricing · Made in India 🇮🇳
          </p>
          <h2 className="font-display text-4xl font-semibold">
            Indian-made intelligence, priced in rupees.
          </h2>
          <p className="mb-8 mt-3 max-w-2xl text-sm text-ink/60">
            Built in Bharat, billed in ₹ — no dollar pricing, no hidden conversion fees. Start free,
            upgrade when Svarga earns it.
          </p>
          <ClientOnly fallback={<StudioSkeleton />}>
            <Checkout />
          </ClientOnly>
        </section>

        <section id="professional" className="border-t border-ink/10 py-14">
          <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.25em] text-crimson">
            Professional
          </p>
          <h2 className="font-display text-4xl font-semibold">Built for professionals who ship.</h2>
          <p className="mb-8 mt-3 max-w-2xl text-sm text-ink/60">
            API access, fastest rendering queue, and direct support from the founder. For studios,
            researchers, and teams scaling Bharat-made AI in production.
          </p>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: "API-first",
                body: "Integrate Svarga into your own products and workflows with server-side access.",
              },
              {
                title: "Fastest queue",
                body: "Your generation and reasoning jobs skip ahead with dedicated Ācārya priority.",
              },
              {
                title: "1,500 images / mo",
                body: "Enough render volume for agencies, content teams and product catalogues.",
              },
              {
                title: "Founder support",
                body: "Email and WhatsApp access to Aditya Mohan Menon for setup and scaling advice.",
              },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-ink/5 bg-sand/50 p-6">
                <h3 className="font-display text-xl font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink/60">{item.body}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#pricing"
              className="rounded-full bg-crimson px-6 py-3 text-sm font-semibold text-cream"
            >
              See the Ācārya plan
            </a>
            <a
              href="#contact"
              className="rounded-full border border-ink/20 px-6 py-3 text-sm font-semibold"
            >
              Talk to the founder
            </a>
          </div>
        </section>

        <section id="contact" className="border-t border-ink/10 py-14">
          <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.25em] text-crimson">
            Contact
          </p>
          <h2 className="mb-8 font-display text-4xl font-semibold">Reach us. Pay us.</h2>
          <ContactPanel />
        </section>

        <section id="settings" className="border-t border-ink/10 py-14">
          <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.25em] text-crimson">
            Settings
          </p>
          <h2 className="mb-8 font-display text-4xl font-semibold">Keys and connections.</h2>
          <ClientOnly fallback={<StudioSkeleton />}>
            <SettingsPanel />
          </ClientOnly>
        </section>
      </main>

      <footer className="mt-6 border-t border-ink/10">
        <div className="mx-auto max-w-6xl px-6 py-10 lg:px-8">
          <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
            <div>
              <p className="font-display text-lg font-semibold">Svarga</p>
              <p className="mt-1 max-w-sm text-sm text-ink/60">
                A solo project by <span className="font-medium text-ink">Aditya Mohan Menon</span>.
                <br />
                Built in India, priced in rupees.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <a
                href="tel:+918139012237"
                className="rounded-full border border-ink/15 px-4 py-2 font-medium transition-colors hover:border-ink/30"
              >
                +91 81390 12237
              </a>
              <a
                href="https://wa.me/918139012237"
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-ink/15 px-4 py-2 font-medium transition-colors hover:border-ink/30"
              >
                WhatsApp
              </a>
              <a
                href="https://www.linkedin.com/in/aditya-mohan-menon"
                target="_blank"
                rel="noreferrer"
                className="rounded-full bg-ink px-4 py-2 font-semibold text-cream"
              >
                LinkedIn
              </a>
            </div>
          </div>
          <p className="mt-8 text-xs text-ink/40">
            Benchmark figures shown are illustrative placeholders, not measured results.
          </p>
        </div>
      </footer>
    </div>
  );
}
