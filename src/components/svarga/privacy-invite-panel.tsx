import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";

import { useAuth } from "@/hooks/use-auth";

import { applyReferralCode, getMyReferral } from "@/lib/referrals.functions";
import {
  clearAllMemory,
  getPrivacySettings,
  setMemoryEnabled,
  setTrainingConsent,
} from "@/lib/settings.functions";

type Referral = {
  code: string;
  invites: number;
  bonusQuestionsPerDay: number;
  joinedViaInvite: boolean;
  bonusPerInvite: number;
  maxInviteBonus: number;
  joinedBonus: number;
};

/** Memory consent controls plus the invite code that earns bonus free messages. */
export function PrivacyInvitePanel() {
  const { user } = useAuth();
  const signedIn = Boolean(user);
  const loadPrivacy = useServerFn(getPrivacySettings);
  const savePrivacy = useServerFn(setMemoryEnabled);
  const saveTraining = useServerFn(setTrainingConsent);
  const wipeMemory = useServerFn(clearAllMemory);
  const loadReferral = useServerFn(getMyReferral);
  const applyCode = useServerFn(applyReferralCode);

  const [memoryOn, setMemoryOn] = useState(true);
  const [trainingOn, setTrainingOn] = useState(false);
  const [referral, setReferral] = useState<Referral | null>(null);
  const [codeInput, setCodeInput] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!signedIn) return;
    void loadPrivacy({})
      .then((r) => {
        setMemoryOn(r.memoryEnabled);
        setTrainingOn(r.trainingConsent);
      })
      .catch(() => undefined);
    void loadReferral({})
      .then(setReferral)
      .catch(() => undefined);
  }, [signedIn, loadPrivacy, loadReferral]);


  if (!signedIn) {
    return (
      <div className="rounded-2xl border border-ink/5 bg-sand/50 p-6">
        <h3 className="font-display text-2xl font-semibold">Privacy &amp; invites</h3>
        <p className="mt-2 text-sm leading-relaxed text-ink/60">
          Sign in to control what Svarga remembers about you and to get your invite code for bonus
          free messages.
        </p>
      </div>
    );
  }

  const toggleMemory = async () => {
    const next = !memoryOn;
    setMemoryOn(next);
    try {
      await savePrivacy({ data: { enabled: next } });
      toast.success(next ? "Svarga will learn from your chats." : "Learning turned off.");
    } catch {
      setMemoryOn(!next);
      toast.error("Could not save that. Please try again.");
    }
  };

  const toggleTraining = async () => {
    const next = !trainingOn;
    setTrainingOn(next);
    try {
      await saveTraining({ data: { consent: next } });
      toast.success(
        next
          ? "Thank you — your chats can help train Svarga's own model."
          : "Your chats will not be used for training.",
      );
    } catch {
      setTrainingOn(!next);
      toast.error("Could not save that. Please try again.");
    }
  };



  const clearMemory = async () => {
    setBusy(true);
    try {
      await wipeMemory({});
      toast.success("Everything Svarga remembered about you is deleted.");
    } catch {
      toast.error("Could not clear your memory. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const submitCode = async () => {
    if (codeInput.trim().length < 4) {
      toast.error("Enter the full invite code.");
      return;
    }
    setBusy(true);
    try {
      const result = await applyCode({ data: { code: codeInput.trim() } });
      toast.success(`Invite applied — ${result.bonusQuestionsPerDay} bonus questions a day.`);
      setCodeInput("");
      setReferral(await loadReferral({}));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "That code did not work.");
    } finally {
      setBusy(false);
    }
  };

  const shareLink =
    referral && typeof window !== "undefined"
      ? `${window.location.origin}/?invite=${referral.code}`
      : "";

  return (
    <div className="grid gap-5 md:grid-cols-2">
      <div className="rounded-2xl border border-ink/5 bg-sand/50 p-6">
        <div className="flex items-center gap-2">
          <span className={`size-2 rounded-full ${memoryOn ? "bg-leaf" : "bg-ink/25"}`} />
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink/50">Memory</p>
        </div>
        <h3 className="mt-3 font-display text-2xl font-semibold">
          {memoryOn ? "Learning from you" : "Learning is off"}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-ink/60">
          When this is on, Svarga quietly remembers your language, style, goals and skill level so
          answers get better over time. Passwords, payment and health details are never stored.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void toggleMemory()}
            className="rounded-full bg-crimson px-5 py-2.5 text-sm font-semibold text-cream"
          >
            {memoryOn ? "Turn learning off" : "Turn learning on"}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void clearMemory()}
            className="rounded-full border border-ink/20 px-5 py-2.5 text-sm font-semibold text-ink/70 disabled:opacity-50"
          >
            Clear everything remembered
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-ink/5 bg-sand/50 p-6">
        <div className="flex items-center gap-2">
          <span className={`size-2 rounded-full ${trainingOn ? "bg-leaf" : "bg-ink/25"}`} />
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink/50">
            Help train Svarga
          </p>
        </div>
        <h3 className="mt-3 font-display text-2xl font-semibold">
          {trainingOn ? "You are helping build it" : "Not sharing for training"}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-ink/60">
          Svarga is building India&apos;s own model. If you switch this on, your questions and
          Svarga&apos;s answers may be used to teach it. Phone numbers, emails and ID numbers are
          stripped out first, and anything containing them is dropped entirely. This is off unless
          you turn it on, and you can turn it off any time.
        </p>
        <div className="mt-5">
          <button
            type="button"
            onClick={() => void toggleTraining()}
            className={
              trainingOn
                ? "rounded-full border border-ink/20 px-5 py-2.5 text-sm font-semibold text-ink/70"
                : "rounded-full bg-crimson px-5 py-2.5 text-sm font-semibold text-cream"
            }
          >
            {trainingOn ? "Stop sharing for training" : "Help train Svarga"}
          </button>
        </div>
      </div>



      <div className="rounded-2xl border border-ink/5 bg-sand/50 p-6">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-saffron" />
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink/50">Invite</p>
        </div>
        <h3 className="mt-3 font-display text-2xl font-semibold">Invite friends, get more</h3>
        {referral ? (
          <>
            <p className="mt-2 text-sm leading-relaxed text-ink/60">
              Every friend who joins with your code gives you {referral.bonusPerInvite} extra
              questions a day (up to {referral.maxInviteBonus}). They get {referral.joinedBonus}{" "}
              bonus questions a day too.
            </p>
            <p className="mt-4 font-mono text-2xl tracking-[0.2em] text-crimson">{referral.code}</p>
            <p className="mt-1 font-mono text-xs text-ink/50">
              {referral.invites} joined · +{referral.bonusQuestionsPerDay} questions a day
            </p>
            <button
              type="button"
              onClick={() => {
                void navigator.clipboard.writeText(shareLink || referral.code);
                toast.success("Invite link copied.");
              }}
              className="mt-4 rounded-full border border-ink/20 px-5 py-2.5 text-sm font-semibold text-ink/70"
            >
              Copy invite link
            </button>
            {!referral.joinedViaInvite && (
              <div className="mt-6 border-t border-ink/10 pt-4">
                <label
                  htmlFor="invite-code"
                  className="block font-mono text-[10px] uppercase tracking-[0.25em] text-crimson"
                >
                  Have a code?
                </label>
                <div className="mt-2 flex gap-2">
                  <input
                    id="invite-code"
                    value={codeInput}
                    onChange={(event) => setCodeInput(event.target.value.toUpperCase())}
                    placeholder="ABC1234"
                    className="w-full rounded-xl border border-ink/10 bg-cream px-4 py-2.5 font-mono text-sm uppercase text-ink outline-none focus:border-saffron"
                  />
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void submitCode()}
                    className="shrink-0 rounded-full bg-crimson px-5 py-2.5 text-sm font-semibold text-cream disabled:opacity-50"
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <p className="mt-2 text-sm text-ink/60">Loading your invite code…</p>
        )}
      </div>
    </div>
  );
}
