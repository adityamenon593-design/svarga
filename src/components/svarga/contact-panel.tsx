const WHATSAPP_NUMBER = "918139012237";
const UPI_ID = "8139012237";
const LINKEDIN_URL = "https://www.linkedin.com/in/aditya-mohan-menon";

export function ContactPanel() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      <div className="rounded-2xl border border-ink/5 bg-sand/50 p-6">
        <h3 className="font-display text-2xl font-semibold">Talk to us</h3>
        <p className="mt-2 text-sm leading-relaxed text-ink/60">
          Fastest reply is on WhatsApp. Partnership, licensing and support questions.
        </p>
        <a
          href={`https://wa.me/${WHATSAPP_NUMBER}`}
          target="_blank"
          rel="noreferrer"
          className="mt-5 inline-flex rounded-full bg-leaf px-5 py-2.5 text-sm font-semibold text-cream"
        >
          WhatsApp +91 81390 12237
        </a>
      </div>

      <div className="rounded-2xl border border-ink/5 bg-sand/50 p-6">
        <h3 className="font-display text-2xl font-semibold">Email</h3>
        <p className="mt-2 text-sm leading-relaxed text-ink/60">
          Write for enterprise access, API volume or press.
        </p>
        <div className="mt-5 space-y-2 font-mono text-sm">
          <a href="mailto:adityamenon593@gmail.com" className="block underline underline-offset-4">
            adityamenon593@gmail.com
          </a>
        </div>
      </div>

      <div className="rounded-2xl border border-ink/5 bg-sand/50 p-6">
        <h3 className="font-display text-2xl font-semibold">Connect</h3>
        <p className="mt-2 text-sm leading-relaxed text-ink/60">
          Follow the solo founder behind Svarga for updates and behind-the-scenes builds.
        </p>
        <a
          href={LINKEDIN_URL}
          target="_blank"
          rel="noreferrer"
          className="mt-5 inline-flex rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-cream"
        >
          LinkedIn — Aditya Mohan Menon
        </a>
      </div>

      <div className="rounded-2xl border border-ink/5 bg-sand/50 p-6">
        <h3 className="font-display text-2xl font-semibold">Pay by UPI</h3>
        <p className="mt-2 text-sm leading-relaxed text-ink/60">
          Indian customers can pay directly by UPI / Google Pay while global card checkout is being
          switched on.
        </p>
        <a
          href={`upi://pay?pa=${UPI_ID}@upi&pn=Svarga.ai&cu=INR`}
          className="mt-5 inline-flex rounded-full bg-crimson px-5 py-2.5 text-sm font-semibold text-cream"
        >
          Pay via UPI · {UPI_ID}
        </a>
      </div>
    </div>
  );
}
