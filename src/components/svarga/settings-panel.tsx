import { useState } from "react";
import { toast } from "sonner";

/**
 * Session-only key holder. Values live in React state for the current tab and are
 * never written to localStorage, cookies, or the server — a GitHub token in
 * persistent browser storage is readable by any script on the page.
 */
export function SettingsPanel() {
  const [githubToken, setGithubToken] = useState("");
  const [saved, setSaved] = useState(false);

  const save = () => {
    if (githubToken.trim().length < 8) {
      toast.error("That token looks too short to be valid.");
      return;
    }
    setSaved(true);
    toast.success("Token held for this session only.");
  };

  const clear = () => {
    setGithubToken("");
    setSaved(false);
    toast.success("Token cleared from this tab.");
  };

  return (
    <div className="grid gap-5 md:grid-cols-2">
      <div className="rounded-2xl border border-ink/5 bg-sand/50 p-6">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-leaf" />
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink/50">
            AI engine
          </p>
        </div>
        <h3 className="mt-3 font-display text-2xl font-semibold">Connected</h3>
        <p className="mt-2 text-sm leading-relaxed text-ink/60">
          The reasoning console and the image studio already run on Svarga&rsquo;s own managed AI
          access. There is no key for you to paste here, and nothing to renew.
        </p>
        <dl className="mt-5 space-y-2 font-mono text-xs text-ink/60">
          <div className="flex justify-between border-b border-ink/10 pb-2">
            <dt>Reasoning</dt>
            <dd className="text-leaf">live</dd>
          </div>
          <div className="flex justify-between border-b border-ink/10 pb-2">
            <dt>Image rendering</dt>
            <dd className="text-leaf">live</dd>
          </div>
          <div className="flex justify-between">
            <dt>Key required</dt>
            <dd>none</dd>
          </div>
        </dl>
      </div>

      <div className="rounded-2xl border border-ink/5 bg-sand/50 p-6">
        <div className="flex items-center gap-2">
          <span className={`size-2 rounded-full ${saved ? "bg-leaf" : "bg-ink/25"}`} />
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink/50">
            GitHub token
          </p>
        </div>
        <h3 className="mt-3 font-display text-2xl font-semibold">
          {saved ? "Held for this session" : "Not set"}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-ink/60">
          Paste a token to use repository actions while this tab is open. It is kept in memory
          only — closing or refreshing the tab clears it, and it is never stored or sent anywhere.
        </p>
        <label
          htmlFor="github-token"
          className="mt-5 block font-mono text-[10px] uppercase tracking-[0.25em] text-crimson"
        >
          Token
        </label>
        <input
          id="github-token"
          type="password"
          autoComplete="off"
          value={githubToken}
          onChange={(event) => {
            setGithubToken(event.target.value);
            setSaved(false);
          }}
          placeholder="ghp_…"
          className="mt-2 w-full rounded-xl border border-ink/10 bg-cream px-4 py-3 font-mono text-sm text-ink outline-none focus:border-saffron"
        />
        <div className="mt-4 flex gap-3">
          <button
            type="button"
            onClick={save}
            className="rounded-full bg-crimson px-5 py-2.5 text-sm font-semibold text-cream"
          >
            Hold token
          </button>
          <button
            type="button"
            onClick={clear}
            className="rounded-full border border-ink/20 px-5 py-2.5 text-sm font-semibold text-ink/70"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}
