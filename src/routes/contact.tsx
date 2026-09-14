import { createFileRoute, Link } from "@tanstack/react-router";

const WHATSAPP_NUMBER = "918139012237";
const PHONE = "+91 81390 12237";
const EMAIL = "adityamenon593@gmail.com";
const LINKEDIN_URL = "https://www.linkedin.com/in/aditya-mohan-menon";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Us — Svarga.ai" },
      {
        name: "description",
        content:
          "Contact Svarga.ai for support, partnerships, enterprise access, and billing questions.",
      },
      { property: "og:title", content: "Contact Us — Svarga.ai" },
      {
        property: "og:description",
        content: "Contact Svarga.ai for support, partnerships, and billing questions.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://svarga.digital/contact" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://svarga.digital/contact" }],
  }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <div className="min-h-screen bg-cream px-6 py-16 font-sans text-ink antialiased lg:px-8">
      <div className="mx-auto max-w-3xl">
        <Link
          to="/"
          className="inline-flex rounded-full border border-ink/15 px-4 py-2 text-sm font-medium transition-colors hover:border-ink/40"
        >
          ← Back to Svarga
        </Link>
        <h1 className="mt-8 font-display text-4xl font-semibold tracking-tight">Contact Us</h1>
        <p className="mt-2 text-ink/70">
          Built by Aditya Mohan Menon. Reach out for support, partnerships, enterprise access, or
          press enquiries.
        </p>

        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          <div className="rounded-2xl border border-ink/5 bg-sand/50 p-6">
            <h2 className="font-display text-xl font-semibold">Email</h2>
            <p className="mt-2 text-sm text-ink/60">Fastest for detailed questions.</p>
            <a
              href={`mailto:${EMAIL}`}
              className="mt-4 inline-block font-mono text-sm underline underline-offset-4"
            >
              {EMAIL}
            </a>
          </div>

          <div className="rounded-2xl border border-ink/5 bg-sand/50 p-6">
            <h2 className="font-display text-xl font-semibold">Phone & WhatsApp</h2>
            <p className="mt-2 text-sm text-ink/60">Call or message for quick support.</p>
            <a
              href={`tel:${PHONE.replace(/\s/g, "")}`}
              className="mt-4 block font-mono text-sm underline underline-offset-4"
            >
              {PHONE}
            </a>
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-block text-sm text-ink/70 underline underline-offset-4"
            >
              WhatsApp →
            </a>
          </div>

          <div className="rounded-2xl border border-ink/5 bg-sand/50 p-6">
            <h2 className="font-display text-xl font-semibold">LinkedIn</h2>
            <p className="mt-2 text-sm text-ink/60">Follow updates from the founder.</p>
            <a
              href={LINKEDIN_URL}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-block text-sm underline underline-offset-4"
            >
              Aditya Mohan Menon →
            </a>
          </div>

          <div className="rounded-2xl border border-ink/5 bg-sand/50 p-6">
            <h2 className="font-display text-xl font-semibold">Official correspondence</h2>
            <p className="mt-2 text-sm text-ink/60">Business and legal address:</p>
            <address className="mt-4 not-italic text-sm leading-relaxed text-ink/80">
              Svarga Digital
              <br />
              Kochi, Kerala
              <br />
              India
              <br />
              Udyam: UDYAM-KL-02-0169185 · NIC 62
            </address>
          </div>
        </div>

        <p className="mt-10 text-sm text-ink/60">
          For support, you can also use the WhatsApp button on the home page.
        </p>
      </div>
    </div>
  );
}
