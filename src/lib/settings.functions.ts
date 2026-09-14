import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Reads the caller's privacy settings. Memory learning is on unless turned off. */
export const getPrivacySettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("user_settings")
      .select("memory_enabled, training_consent")
      .eq("user_id", context.userId)
      .maybeSingle();
    return {
      memoryEnabled: (data as { memory_enabled?: boolean } | null)?.memory_enabled ?? true,
      trainingConsent: (data as { training_consent?: boolean } | null)?.training_consent ?? false,
    };
  });

/**
 * Records whether the caller allows their conversations to be used as training
 * data for Svarga's own model. Off by default — consent must be given, never assumed.
 */
export const setTrainingConsent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ consent: z.boolean() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const patch = {
      training_consent: data.consent,
      training_consent_at: data.consent ? new Date().toISOString() : null,
    };

    const { data: existing } = await supabaseAdmin
      .from("user_settings")
      .select("user_id")
      .eq("user_id", context.userId)
      .maybeSingle();

    if (existing) {
      const { error } = await supabaseAdmin
        .from("user_settings")
        .update(patch)
        .eq("user_id", context.userId);
      if (error) throw new Error(error.message);
    } else {
      const bytes = crypto.getRandomValues(new Uint8Array(7));
      const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      const code = Array.from(bytes)
        .map((b) => alphabet[b % alphabet.length])
        .join("");
      const { error } = await supabaseAdmin
        .from("user_settings")
        .insert({ user_id: context.userId, referral_code: code, ...patch });
      if (error) throw new Error(error.message);
    }

    return { trainingConsent: data.consent };
  });

/** Turns learning from conversations on or off. */
export const setMemoryEnabled = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ enabled: z.boolean() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: existing } = await supabaseAdmin
      .from("user_settings")
      .select("user_id")
      .eq("user_id", context.userId)
      .maybeSingle();

    if (existing) {
      const { error } = await supabaseAdmin
        .from("user_settings")
        .update({ memory_enabled: data.enabled })
        .eq("user_id", context.userId);
      if (error) throw new Error(error.message);
    } else {
      const bytes = crypto.getRandomValues(new Uint8Array(7));
      const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      const code = Array.from(bytes)
        .map((b) => alphabet[b % alphabet.length])
        .join("");
      const { error } = await supabaseAdmin
        .from("user_settings")
        .insert({ user_id: context.userId, referral_code: code, memory_enabled: data.enabled });
      if (error) throw new Error(error.message);
    }

    return { memoryEnabled: data.enabled };
  });

/** Deletes everything Svarga has remembered about the caller. */
export const clearAllMemory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { error } = await context.supabase
      .from("user_memory")
      .delete()
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
