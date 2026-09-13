import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/refunds")({
  head: () => ({
    meta: [
      { title: "Refund & Cancellation Policy — Svarga.ai" },
      {
        name: "description",
        content: "Refund and cancellation terms for Svarga.ai subscriptions.",
      },
      { property: "og:title", content: "Refund & Cancellation Policy — Svarga.ai" },
      {
        property: "og:description",
        content: "Refund and cancellation terms for Svarga.ai subscriptions.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://svarga.digital/refunds" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://svarga.digital/refunds" }],
  }),
  component: RefundsPage,
});

function RefundsPage() {
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
          Refund & Cancellation Policy
        </h1>
        <p className="mt-2 text-sm text-ink/60">Last updated: 13 September 2026</p>

        <div className="mt-10 space-y-6 text-ink/80">
          <p>
            We want you to be happy with Svarga.ai. This policy explains how you can cancel a
            subscription and request a refund.
          </p>

          <h2 className="font-display text-2xl font-semibold text-ink">1. Cancellation</h2>
          <p>
            You can cancel your subscription at any time from your account settings. Cancellation
            takes effect at the end of your current billing period. You will continue to have access
            until then.
          </p>

          <h2 className="font-display text-2xl font-semibold text-ink">2. Refund eligibility</h2>
          <p>
            If you are not satisfied, you may request a full refund within 7 days of your first
            payment, provided you have not used a substantial portion of the paid features. Refund
            requests after 7 days, or for renewals, are reviewed on a case-by-case basis.
          </p>

          <h2 className="font-display text-2xl font-semibold text-ink">
            3. How to request a refund
          </h2>
          <p>
            Email us at{" "}
            <a href="mailto:adityamenon593@gmail.com" className="underline underline-offset-4">
              adityamenon593@gmail.com
            </a>{" "}
            with the email address used for your account and the date of purchase. We aim to process
            approved refunds within 5–7 business days.
          </p>

          <h2 className="font-display text-2xl font-semibold text-ink">4. Exceptions</h2>
          <p>
            Refunds are not provided for account misuse, terms-of-service violations, or promotional
            credits. Transaction fees charged by payment processors may be deducted where
            applicable.
          </p>

          <h2 className="font-display text-2xl font-semibold text-ink">5. Changes</h2>
          <p>
            We may update this policy. The latest version will always be available on this page.
          </p>

          <p className="pt-6 text-sm text-ink/60">
            For refund or cancellation help, contact{" "}
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
