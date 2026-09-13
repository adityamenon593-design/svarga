import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/integrations/supabase/types";

export type Tier = "free" | "starter" | "pro" | "acharya";
export type Mode = "balanced" | "reasoning" | "research" | "creative";

export type TierLimits = {
  /** Questions allowed inside the window below. */
  questions: number;
  /** Rolling window for the question quota. */
  questionWindow: "day" | "month";
  /** Images allowed per 30-day window. */
  images: number;
  modes: readonly Mode[];
};

export const TIER_LIMITS: Record<Tier, TierLimits> = {
  free: { questions: 100, questionWindow: "day", images: 15, modes: ["balanced", "reasoning"] },
  starter: {
    questions: 300,
    questionWindow: "month",
    images: 50,
    modes: ["balanced", "reasoning", "research"],
  },
  pro: {
    questions: 3000,
    questionWindow: "month",
    images: 300,
    modes: ["balanced", "reasoning", "research", "creative"],
  },
  acharya: {
    questions: 12000,
    questionWindow: "month",
    images: 1500,
    modes: ["balanced", "reasoning", "research", "creative"],
  },
};

const TIER_LABEL: Record<Tier, string> = {
  free: "Sādhaka (free)",
  starter: "Jijñāsu",
  pro: "Pro",
  acharya: "Ācārya",
};

export function tierLabel(tier: Tier): string {
  return TIER_LABEL[tier];
}

/** Resolves the signed-in user id from a raw Authorization header, or null. */
export async function userIdFromRequest(request: Request): Promise<string | null> {
  const header = request.headers.get("authorization") ?? "";
  const token = header.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : "";
  if (!token) return null;

  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"] ?? process.env["SUPABASE_ANON_KEY"];
  if (!url || !key) return null;

  const client = createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`)
          h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user.id;
}

function periodDays(plan: string): number {
  return plan.endsWith("_yearly") ? 365 : 31;
}

/** Highest tier the user has an unexpired paid subscription for. */
export async function getUserTier(userId: string): Promise<Tier> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("payments")
    .select("plan, created_at")
    .eq("user_id", userId)
    .eq("status", "paid")
    .order("created_at", { ascending: false })
    .limit(20);
  if (error || !data) return "free";

  const rank: Record<Tier, number> = { free: 0, starter: 1, pro: 2, acharya: 3 };
  let best: Tier = "free";
  for (const row of data) {
    const ageDays = (Date.now() - new Date(row.created_at).getTime()) / 86_400_000;
    if (ageDays > periodDays(row.plan)) continue;
    const tier = row.plan.split("_")[0] as Tier;
    if (rank[tier] !== undefined && rank[tier] > rank[best]) best = tier;
  }
  return best;
}

async function countUsage(userId: string, kind: "question" | "image", since: Date) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { count } = await supabaseAdmin
    .from("usage_events")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("kind", kind)
    .gte("created_at", since.toISOString());
  return count ?? 0;
}

export async function recordUsage(userId: string, kind: "question" | "image") {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await supabaseAdmin.from("usage_events").insert({ user_id: userId, kind });
}

export type UsageSnapshot = {
  tier: Tier;
  limits: TierLimits;
  questionsUsed: number;
  imagesUsed: number;
};

/** Extra daily free questions earned through invites (free tier only). */
export async function getReferralBonus(userId: string): Promise<number> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const [{ count }, { data: settings }] = await Promise.all([
    supabaseAdmin
      .from("referrals")
      .select("id", { count: "exact", head: true })
      .eq("inviter_id", userId),
    supabaseAdmin.from("user_settings").select("referred_by").eq("user_id", userId).maybeSingle(),
  ]);
  const invited = Math.min((count ?? 0) * 25, 200);
  return invited + (settings?.referred_by ? 50 : 0);
}

export async function getUsageSnapshot(userId: string): Promise<UsageSnapshot> {
  const tier = await getUserTier(userId);
  const base = TIER_LIMITS[tier];
  const bonus = tier === "free" ? await getReferralBonus(userId) : 0;
  const limits: TierLimits = bonus ? { ...base, questions: base.questions + bonus } : base;
  const questionSince = new Date(
    Date.now() - (limits.questionWindow === "day" ? 1 : 30) * 86_400_000,
  );
  const imageSince = new Date(Date.now() - 30 * 86_400_000);
  const [questionsUsed, imagesUsed] = await Promise.all([
    countUsage(userId, "question", questionSince),
    countUsage(userId, "image", imageSince),
  ]);
  return { tier, limits, questionsUsed, imagesUsed };
}

export type GateResult = { ok: true; tier: Tier } | { ok: false; status: number; message: string };

/** Checks quota (and mode access, when given) before an AI call. */
export async function checkQuota(
  userId: string,
  kind: "question" | "image",
  mode?: Mode,
): Promise<GateResult> {
  const snapshot = await getUsageSnapshot(userId);
  const { tier, limits } = snapshot;

  if (kind === "question" && mode && !limits.modes.includes(mode)) {
    return {
      ok: false,
      status: 402,
      message: `${mode[0]!.toUpperCase() + mode.slice(1)} mode is part of the paid plans. Upgrade from ${tierLabel(tier)} to unlock it.`,
    };
  }

  const used = kind === "question" ? snapshot.questionsUsed : snapshot.imagesUsed;
  const allowed = kind === "question" ? limits.questions : limits.images;
  if (used >= allowed) {
    const unit = kind === "question" ? "questions" : "images";
    const window =
      kind === "question"
        ? limits.questionWindow === "day"
          ? "today"
          : "this month"
        : "this month";
    return {
      ok: false,
      status: 402,
      message: `You have used all ${allowed} ${unit} on your ${tierLabel(tier)} plan ${window}. Upgrade to continue.`,
    };
  }

  return { ok: true, tier };
}
