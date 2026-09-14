import { createFileRoute, Link } from "@tanstack/react-router";

const TITLE = "FAQ — Svarga.ai";
const DESC =
  "Honest answers on how Svarga.ai works: data sourcing, our model approach, reliability, safety around astrology, pricing and roadmap.";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://svarga.digital/faq" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESC },
    ],
    links: [{ rel: "canonical", href: "https://svarga.digital/faq" }],
  }),
  component: FaqPage,
});

type Item = { q: string; a: string[] };

const SECTIONS: Array<{ heading: string; items: Item[] }> = [
  {
    heading: "The model",
    items: [
      {
        q: "Is Svarga its own LLM, or a wrapper?",
        a: [
          "Today Svarga runs on frontier foundation models through a gateway, and we say so plainly on the site and in our Terms. We do not claim to own or independently train base model weights.",
          "What is ours is everything around the model: an Indian reasoning and etiquette layer, Vedic grounding with strict citation rules, retrieval over a user's own documents, per-user adaptive memory, guardrails, voice, payments and quota infrastructure. That layer is the product, and it is not something a generic assistant reproduces by being asked nicely.",
          "The honest framing is that the model is a commodity input and the judgement layer is the asset. Anyone claiming a self-trained frontier model at our stage is either misinformed or misleading you.",
        ],
      },
      {
        q: "What happens when the underlying model providers change terms or pricing?",
        a: [
          "The model is behind an interface, so switching vendors is a configuration change rather than a rewrite. We are not architecturally married to any one provider.",
          "In parallel we have a consent-gated export pipeline and a training notebook ready, so that once real conversation volume exists we can train adapters on an open base model and own that layer outright.",
        ],
      },
      {
        q: "What is the roadmap for owning a model?",
        a: [
          "Phase 1 (now): ship, get real users, measure which answers matter.",
          "Phase 2: reach a few thousand high-quality, consented, PII-stripped conversation pairs.",
          "Phase 3: train adapters on an open-source base, evaluate against the hosted baseline on Indian-context tasks, and route the tasks where we win to our own weights.",
          "We will not spend on GPUs before the data justifies it. That discipline is deliberate.",
        ],
      },
    ],
  },
  {
    heading: "Data",
    items: [
      {
        q: "Where does your data come from?",
        a: [
          "Three sources, kept separate. First, public and classical texts used for grounding and citation. Second, documents a user uploads to their own private library, which are indexed only for that user and never pooled. Third, conversations, which are used for training only where the user has explicitly opted in.",
          "We do not scrape private platforms, buy personal data, or ingest customer documents into any shared corpus.",
        ],
      },
      {
        q: "How is user data protected?",
        a: [
          "Row-level security on every table, per-user isolation on documents and memory, server-side quota and rate limits, and no client access to privileged keys.",
          "Training consent is off by default. Where it is on, identifiers are stripped and any pair still containing them is dropped rather than cleaned.",
        ],
      },
      {
        q: "Can a user see and delete what Svarga has learned about them?",
        a: [
          "Yes. Learning can be switched off entirely, every remembered item is listed in plain language in the privacy panel, and it can be deleted individually or wiped in one action.",
        ],
      },
    ],
  },
  {
    heading: "Reliability and safety",
    items: [
      {
        q: "How do you handle hallucination?",
        a: [
          "Three layers. Svarga is instructed never to invent a verse, locator, number, date or citation, and to say plainly when it is unsure. Answers drawing on scripture must name the text and the chapter and verse, and are separated from commentary, from modern scholarship and from popular claims. Where a user's own documents are the source, the answer carries citations back to them.",
          "It is not a solved problem anywhere in the industry, and we do not pretend otherwise. Our position is that a narrower, well-grounded claim beats a confident wrong one.",
        ],
      },
      {
        q: "What happens under heavy traffic or when the model is slow?",
        a: [
          "Per-user and per-IP rate limiting with proper retry signalling, streaming responses so the user sees progress rather than a spinner, request timeouts with a graceful fallback message, and explicit handling of upstream rate limits, timeouts and credit errors rather than a blank failure.",
        ],
      },
      {
        q: "What is your position on astrology?",
        a: [
          "Svarga knows classical jyotiṣa properly — the systems, the texts, the calculations — and treats it as a genuine discipline worth understanding.",
          "It also draws a hard line. Astronomy is exact; astrology is not established by controlled evidence, and Svarga says so. A chart is read as a mirror for reflection, never as prophecy. It will not predict death, disease, divorce, accidents, exam failure or a child's gender, will not discourage medical treatment, and will not validate fear-based remedies, expensive gemstone selling, doṣa-shaming or marriage-harming matching.",
          "That restraint is a product decision. The market is full of fear-monetising astrology apps; refusing that revenue is what makes Svarga safe to recommend to a family.",
        ],
      },
    ],
  },
  {
    heading: "Business",
    items: [
      {
        q: "How does pricing work?",
        a: [
          "A free tier generous enough to be genuinely useful, then ₹149, ₹499 and ₹1,499 per month for progressively higher limits and capability. Payments run through Razorpay; quotas are enforced server-side, not in the browser.",
          "Pricing is set for Indian willingness to pay rather than converted from a dollar figure — the single most common mistake made by products entering this market.",
        ],
      },
      {
        q: "Who is the customer?",
        a: [
          "Indians who want an assistant that understands rupees, Indian dates and units, Indian institutions, and Indian context without translation — plus a specific early wedge in spiritual and scriptural study, where accurate citation matters and generic assistants routinely fabricate verses.",
        ],
      },
      {
        q: "Who owns the company and the IP?",
        a: [
          "Svarga Digital, a Udyam-registered MSME, solely owned by Aditya Mohan Menon. All intellectual property in the product, brand, prompts and data is exclusively held, with no open-source licence or transfer granted.",
        ],
      },
      {
        q: "What are the real risks?",
        a: [
          "Dependence on third-party model pricing until we own weights. Distribution in a crowded assistant market. A single founder, which is a concentration risk until the first hires.",
          "We would rather name these than have you find them. Each has a stated mitigation in the pitch materials.",
        ],
      },
    ],
  },
];

function FaqPage() {
  return (
    <div className="min-h-screen bg-cream px-6 py-16 font-sans text-ink antialiased lg:px-8">
      <div className="mx-auto max-w-3xl">
        <Link
          to="/"
          className="inline-flex rounded-full border border-ink/15 px-4 py-2 text-sm font-medium transition-colors hover:border-ink/40"
        >
          ← Back to Svarga
        </Link>

        <p className="mt-8 font-mono text-[10px] uppercase tracking-[0.3em] text-ink/50">
          Questions worth asking
        </p>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">
          The hard questions, answered straight
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-ink/70">
          Written for investors, partners and anyone deciding whether to trust Svarga with real
          work. No marketing language, no claims we cannot defend.
        </p>

        <div className="mt-12 space-y-14">
          {SECTIONS.map((section) => (
            <section key={section.heading}>
              <h2 className="font-mono text-[11px] uppercase tracking-[0.3em] text-crimson">
                {section.heading}
              </h2>
              <div className="mt-6 space-y-8">
                {section.items.map((item) => (
                  <article key={item.q}>
                    <h3 className="font-display text-xl font-semibold">{item.q}</h3>
                    {item.a.map((para) => (
                      <p key={para} className="mt-3 leading-relaxed text-ink/75">
                        {para}
                      </p>
                    ))}
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-16 rounded-2xl border border-ink/10 bg-sand/50 p-6">
          <h2 className="font-display text-2xl font-semibold">Something not answered here?</h2>
          <p className="mt-2 leading-relaxed text-ink/70">
            Write to{" "}
            <a className="text-crimson underline" href="mailto:adityamenon593@gmail.com">
              adityamenon593@gmail.com
            </a>{" "}
            and you will hear back from the founder directly.
          </p>
        </div>
      </div>
    </div>
  );
}
