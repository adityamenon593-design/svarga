import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Extra free questions per day, for each person you successfully invite. */
export const BONUS_PER_INVITE = 25;
/** Cap so the free tier stays sustainable. */
export const MAX_INVITE_BONUS = 200;
/** One-time daily bonus for joining through someone's invite. */
export const JOINED_BONUS = 50;

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function newCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(7));
  return Array.from(bytes)
    .map((b) => CODE_ALPHABET[b % CODE_ALPHABET.length])
    .join("");
}

/** Returns the caller's invite code (creating their settings row on first use). */
export const getMyReferral = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    let { data: settings } = await supabaseAdmin
      .from("user_settings")
      .select("referral_code, referred_by, memory_enabled")
      .eq("user_id", context.userId)
      .maybeSingle();

    if (!settings) {
      for (let attempt = 0; attempt < 5 && !settings; attempt += 1) {
        const { data, error } = await supabaseAdmin
          .from("user_settings")
          .insert({ user_id: context.userId, referral_code: newCode() })
          .select("referral_code, referred_by, memory_enabled")
          .maybeSingle();
        if (!error && data) settings = data;
      }
    }
    if (!settings) throw new Error("Could not create your invite code. Please try again.");

    const { count } = await supabaseAdmin
      .from("referrals")
      .select("id", { count: "exact", head: true })
      .eq("inviter_id", context.userId);

    const invites = count ?? 0;
    const bonus =
      Math.min(invites * BONUS_PER_INVITE, MAX_INVITE_BONUS) + (settings.referred_by ? JOINED_BONUS : 0);

    return {
      code: settings.referral_code,
      invites,
      bonusQuestionsPerDay: bonus,
      joinedViaInvite: Boolean(settings.referred_by),
      bonusPerInvite: BONUS_PER_INVITE,
      maxInviteBonus: MAX_INVITE_BONUS,
      joinedBonus: JOINED_BONUS,
    };
  });

/** Applies someone else's invite code once, giving both people bonus messages. */
export const applyReferralCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ code: z.string().trim().min(4).max(16) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const code = data.code.toUpperCase();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: mine } = await supabaseAdmin
      .from("user_settings")
      .select("referral_code, referred_by")
      .eq("user_id", context.userId)
      .maybeSingle();

    if (mine?.referred_by) throw new Error("You have already used an invite code.");
    if (mine?.referral_code === code) throw new Error("You cannot use your own invite code.");

    const { data: inviter } = await supabaseAdmin
      .from("user_settings")
      .select("user_id")
      .eq("referral_code", code)
      .maybeSingle();
    if (!inviter) throw new Error("That invite code does not exist.");

    if (mine) {
      const { error } = await supabaseAdmin
        .from("user_settings")
        .update({ referred_by: inviter.user_id })
        .eq("user_id", context.userId);
      if (error) throw new Error("Could not apply the invite code. Please try again.");
    } else {
      const { error } = await supabaseAdmin.from("user_settings").insert({
        user_id: context.userId,
        referral_code: newCode(),
        referred_by: inviter.user_id,
      });
      if (error) throw new Error("Could not apply the invite code. Please try again.");
    }

    const { error: refError } = await supabaseAdmin.from("referrals").insert({
      inviter_id: inviter.user_id,
      invitee_id: context.userId,
      code,
    });
    if (refError && !refError.message.includes("duplicate")) {
      throw new Error("Could not record the invite. Please try again.");
    }

    return { ok: true, bonusQuestionsPerDay: JOINED_BONUS };
  });
