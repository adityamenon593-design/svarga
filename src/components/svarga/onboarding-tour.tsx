import { useEffect, useState } from "react";

import { track } from "@/lib/track";

const SEEN_KEY = "svarga-welcome-seen";

const STEPS = [
  {
    tag: "1 of 4 · about 15 seconds",
    title: "Ask it anything, in your own language",
    body: "Type in English, Hindi, Malayalam or a mix of them — Svarga answers in the language you wrote in. It thinks in rupees, Indian dates and Indian context, so you never have to translate your life for it.",
    tip: "Try: “₹40,000 salary, Kochi — how much rent can I afford?”",
  },
  {
    tag: "2 of 4 · about 15 seconds",
    title: "Give it something to read",
    body: "Attach a PDF or add books to your private Library. Svarga reads them and answers with citations pointing back to the exact place it found the answer. Your documents stay yours alone.",
    tip: "Good for: contracts, notes, scripture, question papers, reports.",
  },
  {
    tag: "3 of 4 · about 15 seconds",
    title: "Gita listening, hands-free",
    body: "Open Listening mode to play verses or your own recorded classes, with speed control, skip and a sleep timer. Start it, put the phone down, and rest.",
    tip: "The sleep timer stops everything on its own — nothing keeps playing.",
  },
  {
    tag: "4 of 4 · about 15 seconds",
    title: "How to get the best answer",
    body: "Say who you are and what you actually want. “Explain simply, I am a beginner” or “give me the steps, no theory” changes the whole answer. Ask follow-ups instead of rewriting your question — it remembers the thread.",
    tip: "Svarga will tell you when it is unsure, rather than inventing a number or a verse.",
  },
];

/** A short, skippable welcome shown once, the first time someone visits. */
export function OnboardingTour() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    try {
      if (window.localStorage.getItem(SEEN_KEY)) return;
    } catch {
      return;
    }
    const timer = window.setTimeout(() => {
      setOpen(true);
      track("onboarding_open");
    }, 900);
    return () => window.clearTimeout(timer);
  }, []);

  const close = (reason: string) => {
    try {
      window.localStorage.setItem(SEEN_KEY, "1");
    } catch {
      /* private browsing — the tour simply shows again */
    }
    track("onboarding_close", reason);
    setOpen(false);
  };

  if (!open) return null;
  const current = STEPS[step];
  if (!current) return null;
  const last = step === STEPS.length - 1;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Welcome to Svarga"
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 p-4 backdrop-blur-sm sm:items-center"
    >
      <div className="w-full max-w-lg rounded-3xl border border-ink/10 bg-cream p-7 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-crimson">
            {current.tag}
          </p>
          <button
            type="button"
            onClick={() => close(`skipped_step_${step + 1}`)}
            className="text-xs font-semibold text-ink/45 transition-colors hover:text-ink"
          >
            Skip
          </button>
        </div>

        <h2 className="mt-4 font-display text-2xl font-semibold text-ink">{current.title}</h2>
        <p className="mt-3 leading-relaxed text-ink/75">{current.body}</p>
        <p className="mt-4 rounded-xl bg-sand/70 px-4 py-3 text-sm leading-relaxed text-ink/70">
          {current.tip}
        </p>

        <div className="mt-6 flex items-center justify-between gap-4">
          <div className="flex gap-1.5" aria-hidden="true">
            {STEPS.map((s, i) => (
              <span
                key={s.title}
                className={`h-1.5 rounded-full transition-all ${
                  i === step ? "w-6 bg-crimson" : "w-1.5 bg-ink/15"
                }`}
              />
            ))}
          </div>
          <div className="flex gap-2">
            {step > 0 ? (
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                className="rounded-full border border-ink/20 px-4 py-2 text-sm font-semibold text-ink/70"
              >
                Back
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => (last ? close("finished") : setStep((s) => s + 1))}
              className="rounded-full bg-crimson px-5 py-2 text-sm font-semibold text-cream"
            >
              {last ? "Start using Svarga" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
