import { createFileRoute, ClientOnly, Link } from "@tanstack/react-router";
import { useState } from "react";

import { useAuth } from "@/hooks/use-auth";

import { DocumentLibrary } from "@/components/svarga/document-library";
import { ImageStudio } from "@/components/svarga/image-studio";
import { PrivacyInvitePanel } from "@/components/svarga/privacy-invite-panel";
import { SettingsPanel } from "@/components/svarga/settings-panel";
import { ContactPanel } from "@/components/svarga/contact-panel";
import { Checkout } from "@/components/svarga/checkout";
import { DonatePanel } from "@/components/svarga/donate";
import { BuddyKrishna } from "@/components/svarga/buddy-krishna";
import { LanguageSelector } from "@/components/svarga/languages";
import { GitaListening } from "@/components/svarga/gita-listening";

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

function StudioSkeleton() {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      <div className="h-[260px] animate-pulse rounded-2xl bg-ink/5" />
      <div className="aspect-[16/11] animate-pulse rounded-2xl bg-ink/5" />
    </div>
  );
}

function IndianFlag({ className = "" }: { className?: string }) {
  return (
    <svg aria-label="Indian flag" viewBox="0 0 180 120" className={className} role="img">
      <title>Indian flag</title>
      <rect width="180" height="40" className="fill-saffron" />
      <rect y="40" width="180" height="40" className="fill-white" />
      <rect y="80" width="180" height="40" className="fill-leaf" />
      <g className="fill-ink" transform="translate(90, 60)">
        <circle r="12" fill="none" strokeWidth="1.2" className="stroke-ink" />
        {Array.from({ length: 24 }).map((_, i) => {
          const a = (i * 15 * Math.PI) / 180;
          return (
            <line
              key={i}
              x1={(Math.cos(a) * 12).toFixed(3)}
              y1={(Math.sin(a) * 12).toFixed(3)}
              x2={(Math.cos(a) * 3).toFixed(3)}
              y2={(Math.sin(a) * 3).toFixed(3)}
              strokeWidth="1.2"
              className="stroke-ink"
            />
          );
        })}
      </g>
    </svg>
  );
}

function HeroPreview() {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-ink/10 bg-sand/50 p-6 shadow-2xl shadow-ink/10 backdrop-blur sm:p-8">
      <div className="absolute -right-10 -top-10 size-40 rounded-full bg-saffron/10 blur-2xl" />
      <div className="absolute -bottom-10 -left-10 size-40 rounded-full bg-crimson/10 blur-2xl" />
      <div className="relative">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="grid size-8 place-items-center rounded-full bg-ink font-display text-sm text-cream">
              ॐ
            </div>
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink/50">
              Svarga Console
            </span>
          </div>
          <span className="rounded-full bg-leaf/15 px-2 py-0.5 text-[10px] font-semibold text-leaf">
            Live
          </span>
        </div>
        <div className="space-y-3">
          <div className="flex gap-3">
            <div className="grid size-7 shrink-0 place-items-center rounded-full bg-ink/10 font-display text-xs text-ink/70">
              U
            </div>
            <p className="rounded-2xl rounded-tl-sm border border-ink/10 bg-white/70 px-4 py-2 text-sm text-ink/80">
              Explain karma yoga in simple words.
            </p>
          </div>
          <div className="flex gap-3">
            <div className="grid size-7 shrink-0 place-items-center rounded-full bg-saffron font-display text-xs text-ink">
              ॐ
            </div>
            <p className="rounded-2xl rounded-tl-sm bg-ink px-4 py-2 text-sm leading-relaxed text-cream/90">
              Karma yoga is doing your duty without clinging to results — like a lotus leaf in
              water.
            </p>
          </div>
          <div className="flex gap-3">
            <div className="grid size-7 shrink-0 place-items-center rounded-full bg-ink/10 font-display text-xs text-ink/70">
              U
            </div>
            <p className="rounded-2xl rounded-tl-sm border border-ink/10 bg-white/70 px-4 py-2 text-sm text-ink/80">
              Now connect it to modern psychology.
            </p>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          {["Reasoning", "Research", "Image", "Creative"].map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-ink/10 bg-white/50 px-3 py-1 text-[11px] font-medium text-ink/70"
            >
              {tag}
            </span>
          ))}
        </div>
        <div className="mt-6">
          <Link
            to="/chat"
            className="inline-flex items-center gap-2 rounded-full bg-crimson px-6 py-3 text-sm font-semibold text-cream transition-colors hover:bg-crimson/90"
          >
            Chat now
            <span aria-hidden>→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

const TRUST_ITEMS = [
  { icon: "🔒", label: "https://svarga.digital — Secured connection" },
  { icon: "🛡", label: "Payments secured by Razorpay" },
  { icon: "₹", label: "UPI / GPay accepted" },
  { icon: "◈", label: "Your data stays private" },
];

function TrustStrip({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`flex flex-wrap items-center gap-2 ${compact ? "" : "gap-x-3 gap-y-2"}`}
      aria-label="Security and trust"
    >
      {TRUST_ITEMS.map((item) => (
        <span
          key={item.label}
          className="inline-flex items-center gap-1.5 rounded-full border border-leaf/25 bg-leaf/10 px-3 py-1 text-[11px] font-medium text-ink/70"
        >
          <span aria-hidden className="text-leaf">
            {item.icon}
          </span>
          {item.label}
        </span>
      ))}
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

const CAPACITIES = [
  {
    icon: "ॐ",
    tile: "bg-crimson/10 text-crimson",
    title: "Vedantic Reasoning",
    body: "Cites Upaniṣadic and Āyurvedic sources alongside peer-reviewed literature in a single, grounded response.",
  },
  {
    icon: "◈",
    tile: "bg-saffron/20 text-marigold",
    title: "Image Generation",
    body: "Luminous, high-fidelity imagery rendered from the same understanding that writes the answer — live in the studio below.",
  },
  {
    icon: "✦",
    tile: "bg-leaf/15 text-leaf",
    title: "39 Languages",
    body: "Hindi, Tamil, Malayalam, Bengali, Telugu, Kannada, Gujarati, Punjabi and 31 more — tuned for Indian nuance and context.",
  },
  {
    icon: "☍",
    tile: "bg-crimson/10 text-crimson",
    title: "Live Web Answers",
    body: "Pulls current information from the web during chat, with citations and source links you can verify.",
  },
  {
    icon: "▤",
    tile: "bg-saffron/20 text-marigold",
    title: "Your Document Library",
    body: "Upload books, PDFs and scripture files — Svarga indexes and searches them to answer from your own knowledge.",
  },
  {
    icon: "❀",
    tile: "bg-leaf/15 text-leaf",
    title: "Baby Krishna Buddy",
    body: "A gentle companion who answers from Krishna's principles — karma yoga, dharma, devotion — like a loving friend.",
  },
  {
    icon: "⚿",
    tile: "bg-crimson/10 text-crimson",
    title: "Privacy Controls",
    body: "Turn learning on or off anytime, and delete everything Svarga remembers about you in one tap.",
  },
  {
    icon: "✧",
    tile: "bg-saffron/20 text-marigold",
    title: "Invite & Earn",
    body: "Share your invite code — every friend who joins adds bonus free questions to your account every day.",
  },
];

const NAV = [
  { href: "/chat", label: "Chat" },
  { href: "#benchmarks", label: "Benchmarks" },
  { href: "#capacities", label: "Capacities" },
  { href: "#buddies", label: "Buddies" },
  { href: "#studio", label: "Studio" },
  { href: "#library", label: "Library" },
  { href: "#pricing", label: "Pricing" },
  { href: "#donate", label: "Donate" },
  { href: "#contact", label: "Contact" },
  { href: "#settings", label: "Settings" },
  { href: "#professional", label: "Professional" },
];

function Index() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen overflow-x-hidden bg-cream font-sans text-ink antialiased">
      <header className="sticky top-0 z-30 border-b border-ink/10 bg-cream/90 backdrop-blur">
        <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid size-9 shrink-0 place-items-center rounded-full border-2 border-saffron/50 font-display text-lg font-semibold text-saffron">
              ॐ
            </div>
            <div className="min-w-0 leading-none">
              <p className="truncate font-display text-xl font-semibold tracking-tight sm:text-2xl">
                Svarga
              </p>
              <div className="flex items-center gap-1.5">
                <IndianFlag className="h-2.5 w-auto rounded-[1px]" />
                <p className="truncate font-mono text-[9px] uppercase tracking-[0.25em] text-ink/40">
                  Made in India
                </p>
              </div>
            </div>
          </div>
          <nav className="hidden items-center gap-5 text-sm font-medium text-ink/70 lg:flex xl:gap-8">
            {NAV.map((item) => (
              <a key={item.href} href={item.href} className="transition-colors hover:text-crimson">
                {item.label}
              </a>
            ))}
          </nav>
          <div className="flex shrink-0 items-center gap-2">
            <a
              href="#donate"
              className="hidden rounded-full bg-saffron/20 px-4 py-2 text-sm font-semibold text-crimson transition-colors hover:bg-saffron/30 sm:block"
            >
              ♥ Donate
            </a>
            <ClientOnly fallback={<div className="h-9 w-24" />}>
              <AccountNav />
            </ClientOnly>
            <button
              type="button"
              aria-label="Toggle menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
              className="grid size-9 shrink-0 place-items-center rounded-full border border-ink/15 lg:hidden"
            >
              {menuOpen ? "✕" : "☰"}
            </button>
          </div>
        </div>
        {menuOpen ? (
          <nav className="grid gap-1 border-t border-ink/10 px-4 py-3 text-sm font-medium text-ink/70 sm:px-6 lg:hidden">
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
              single grounded answer — and renders what it describes. Ask it anything in the
              console.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/chat"
                className="rounded-full bg-crimson px-6 py-3 text-sm font-semibold text-cream transition-colors hover:bg-crimson/90"
              >
                Chat now
              </Link>
              <a
                href="#studio"
                className="rounded-full border border-ink/20 px-6 py-3 text-sm font-semibold transition-colors hover:border-ink/40"
              >
                Open the image studio
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
            <div className="mt-8">
              <TrustStrip />
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-6 animate-sv-spin rounded-full bg-saffron/10 blur-3xl" />
            <div className="relative">
              <div className="mb-4 flex items-center gap-3 rounded-2xl border border-ink/10 bg-white/60 p-3 shadow-lg shadow-ink/5 backdrop-blur">
                <IndianFlag className="h-16 w-auto rounded-md shadow-sm" />
                <div>
                  <p className="font-display text-lg font-semibold leading-tight">Made in India</p>
                  <p className="text-xs text-ink/60">Hosted in Bharat · Built for Viksit Bharat</p>
                </div>
              </div>
              <HeroPreview />
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
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {CAPACITIES.map((cap) => (
              <div
                key={cap.title}
                className="rounded-2xl border border-ink/5 bg-sand/50 p-6 transition-all hover:-translate-y-0.5 hover:border-saffron/40 hover:shadow-lg hover:shadow-ink/5"
              >
                <div
                  className={`grid size-10 place-items-center rounded-xl font-display text-xl ${cap.tile}`}
                >
                  {cap.icon}
                </div>
                <h3 className="mt-4 font-display text-xl font-semibold">{cap.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink/60">{cap.body}</p>
              </div>
            ))}
          </div>
        </section>

        <LanguageSelector />

        <ClientOnly fallback={<div className="h-[420px] animate-pulse rounded-3xl bg-ink/5" />}>
          <GitaListening />
        </ClientOnly>

        <section id="buddies" className="border-t border-ink/10 py-14">
          <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.25em] text-crimson">
            Buddies
          </p>
          <h2 className="mb-2 font-display text-4xl font-semibold">Talk to Baby Krishna.</h2>
          <p className="mb-8 max-w-2xl text-sm text-ink/60">
            A gentle companion who answers from Krishna's principles — karma yoga, dharma, devotion,
            a steady mind — like a loving friend, not a lecture.
          </p>
          <ClientOnly fallback={<div className="h-[400px] animate-pulse rounded-3xl bg-ink/5" />}>
            <BuddyKrishna />
          </ClientOnly>
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

        <section id="library" className="border-t border-ink/10 py-14">
          <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.25em] text-crimson">
            Library
          </p>
          <h2 className="mb-8 font-display text-4xl font-semibold">Upload your own knowledge.</h2>
          <ClientOnly fallback={<StudioSkeleton />}>
            <DocumentLibrary />
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
          <div className="mb-6">
            <TrustStrip compact />
          </div>
          <ClientOnly fallback={<StudioSkeleton />}>
            <Checkout />
          </ClientOnly>
        </section>

        <section id="donate" className="border-t border-ink/10 py-14">
          <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.25em] text-crimson">
            Donate
          </p>
          <h2 className="mb-8 font-display text-4xl font-semibold">
            Keep India&rsquo;s own AI running.
          </h2>
          <ClientOnly fallback={<StudioSkeleton />}>
            <DonatePanel />
          </ClientOnly>
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
          <div className="mt-6">
            <ClientOnly fallback={<StudioSkeleton />}>
              <PrivacyInvitePanel />
            </ClientOnly>
          </div>
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
      </main>

      <footer className="mt-6 border-t border-ink/10">
        <div className="mx-auto max-w-6xl px-6 py-10 lg:px-8">
          <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
            <div>
              <div className="flex items-center gap-2">
                <IndianFlag className="h-4 w-auto rounded-[1px]" />
                <p className="font-display text-lg font-semibold">Svarga</p>
              </div>
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

          <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 border-t border-ink/10 pt-6 text-sm text-ink/60">
            <Link to="/terms" className="transition-colors hover:text-crimson">
              Terms & Conditions
            </Link>
            <Link to="/privacy" className="transition-colors hover:text-crimson">
              Privacy Policy
            </Link>
            <Link to="/refunds" className="transition-colors hover:text-crimson">
              Refund / Cancellation Policy
            </Link>
            <Link to="/contact" className="transition-colors hover:text-crimson">
              Contact Us
            </Link>
          </div>

          <p className="mt-6 text-xs text-ink/40">
            © {new Date().getFullYear()} Svarga.ai. All rights reserved. Owned exclusively by Aditya
            Mohan Menon.
          </p>
          <p className="mt-2 text-xs text-ink/40">
            Benchmark figures shown are illustrative placeholders, not measured results.
          </p>
        </div>
      </footer>
    </div>
  );
}
