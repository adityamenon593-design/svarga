import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Svarga.ai" },
      {
        name: "description",
        content:
          "How Svarga.ai collects, uses, and protects your personal information.",
      },
      { property: "og:title", content: "Privacy Policy — Svarga.ai" },
      {
        property: "og:description",
        content: "How Svarga.ai handles your personal information.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://svarga.digital/privacy" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://svarga.digital/privacy" }],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div className="min-h-screen bg-cream px-6 py-16 font-sans text-ink antialiased lg:px-8">
      <div className="mx-auto max-w-3xl">
        <Link
          to="/"
          className="inline-flex rounded-full border border-ink/15 px-4 py-2 text-sm font-medium transition-colors hover:border-ink/40"
        >
          ← Back to Svarga
        </Link>
        <h1 className="mt-8 font-display text-4xl font-semibold tracking-tight">
          Privacy Policy
        </h1>
        <p className="mt-2 text-sm text-ink/60">Last updated: 13 September 2026</p>

        <div className="mt-10 space-y-6 text-ink/80">
          <p>
            Svarga.ai is built to respect your privacy. This policy explains what information we
            collect, how we use it, and the choices you have.
          </p>

          <h2 className="font-display text-2xl font-semibold text-ink">1. Information we collect</h2>
          <ul className="list-disc space-y-2 pl-6">
            <li>
              <strong>Account information:</strong> email address and authentication details
              provided when you sign in.
            </li>
            <li>
              <strong>Usage data:</strong> questions, prompts, and generated outputs used to
              provide and improve the Services.
            </li>
            <li>
              <strong>Uploaded files:</strong> documents you upload to your private library. These
              stay tied to your account and are not used to train third-party AI models.
            </li>
          </ul>

          <h2 className="font-display text-2xl font-semibold text-ink">2. How we use information</h2>
          <p>
            We use your information to operate the Services, authenticate you, enforce usage
            limits, respond to support requests, and improve product quality. We do not sell your
            personal data.
          </p>

          <h2 className="font-display text-2xl font-semibold text-ink">3. Data storage</h2>
          <p>
            Data is stored with secure cloud providers. Uploaded documents are kept private to
            your account and processed only to power your own searches.
          </p>

          <h2 className="font-display text-2xl font-semibold text-ink">4. Cookies and analytics</h2>
          <p>
            We use essential cookies for authentication and may use analytics to understand how
            the product is used. You can disable non-essential cookies in your browser.
          </p>

          <h2 className="font-display text-2xl font-semibold text-ink">5. Your rights</h2>
          <p>
            You can access, update, or delete your account and data by contacting us. Indian
            residents may exercise rights available under applicable Indian data-protection laws.
          </p>

          <h2 className="font-display text-2xl font-semibold text-ink">6. Children</h2>
          <p>
            The Services are not directed to children under 13. If we learn that we have collected
            personal information from a child under 13 without parental consent, we will delete it.
          </p>

          <h2 className="font-display text-2xl font-semibold text-ink">7. Changes</h2>
          <p>
            We may update this policy. We will notify users of material changes by posting the
            updated policy on this page.
          </p>

          <p className="pt-6 text-sm text-ink/60">
            Questions? Email{" "}
            <a href="mailto:adityamenon593@gmail.com" className="underline underline-offset-4">
              adityamenon593@gmail.com
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
