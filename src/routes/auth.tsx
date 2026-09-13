import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { useAuth } from "@/hooks/use-auth";
import { lovable } from "@/integrations/lovable/index";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Sign in — Svarga.ai" },
      {
        name: "description",
        content:
          "Sign in to Svarga.ai to keep your console conversations and image renders saved across devices.",
      },
      { property: "og:title", content: "Sign in — Svarga.ai" },
      {
        property: "og:description",
        content: "Sign in to Svarga.ai to keep your conversations and renders saved.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) void navigate({ to: "/" });
  }, [loading, user, navigate]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast.success("Check your inbox to confirm your address.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        void navigate({ to: "/" });
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error(result.error.message || "Google sign-in failed.");
      return;
    }
    if (result.redirected) return;
    void navigate({ to: "/" });
  };

  return (
    <div className="grid min-h-screen place-items-center bg-cream px-6 font-sans text-ink">
      <div className="w-full max-w-sm">
        <Link to="/" className="mb-8 flex items-center gap-3">
          <div className="grid size-9 place-items-center rounded-full border-2 border-saffron/50 font-display text-lg font-semibold text-saffron">
            ॐ
          </div>
          <p className="font-display text-2xl font-semibold tracking-tight">Svarga</p>
        </Link>

        <h1 className="font-display text-3xl font-semibold tracking-tight">
          {mode === "signin" ? "Welcome back." : "Create your account."}
        </h1>
        <p className="mt-2 text-sm text-ink/60">
          Your conversations and renders stay saved to your account.
        </p>

        <button
          onClick={() => void google()}
          className="mt-7 w-full rounded-full border border-ink/15 px-5 py-3 text-sm font-semibold transition-colors hover:border-ink/40"
        >
          Continue with Google
        </button>

        <div className="my-5 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.25em] text-ink/35">
          <span className="h-px flex-1 bg-ink/10" />
          or
          <span className="h-px flex-1 bg-ink/10" />
        </div>

        <form onSubmit={submit} className="space-y-3">
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            className="w-full rounded-xl border border-ink/10 bg-sand/40 px-4 py-3 text-sm outline-none focus:border-saffron"
          />
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            className="w-full rounded-xl border border-ink/10 bg-sand/40 px-4 py-3 text-sm outline-none focus:border-saffron"
          />
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-full bg-crimson px-5 py-3 text-sm font-semibold text-cream transition-opacity disabled:opacity-60"
          >
            {busy ? "Working…" : mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>

        <button
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="mt-5 w-full text-sm text-ink/60 hover:text-crimson"
        >
          {mode === "signin"
            ? "New to Svarga? Create an account"
            : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}
