import { createServerFn } from "@tanstack/react-start";
import { createOpenAI } from "@ai-sdk/openai";
import { NoObjectGeneratedError, Output, streamText } from "ai";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const LearnInput = z.object({
  prompt: z.string().min(1).max(8000),
  answer: z.string().min(1).max(60000),
});

const IdInput = z.object({ id: z.string().uuid() });

const MemorySchema = z.object({
  memories: z.array(
    z.object({
      kind: z.enum(["preference", "fact", "goal", "skill"]),
      content: z.string(),
    }),
  ),
});

/** Returns the signed-in user's remembered preferences and facts, newest first. */
export const listMemory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("user_memory")
      .select("id, kind, content, created_at")
      .order("created_at", { ascending: false })
      .limit(30);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

/** Removes one remembered item. */
export const forgetMemory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => IdInput.parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("user_memory").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/**
 * Reads one completed turn and stores any durable, non-sensitive facts or
 * preferences about the user so later answers are personalised.
 */
export const learnFromTurn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => LearnInput.parse(input))
  .handler(async ({ data, context }) => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) return { learned: 0 };

    // Learning is opt-out: respect the user's privacy switch.
    const { data: settings } = await context.supabase
      .from("user_settings")
      .select("memory_enabled")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (settings && settings.memory_enabled === false) return { learned: 0 };

    const gateway = createOpenAI({
      apiKey,
      baseURL: "https://ai.gateway.lovable.dev/v1",
      headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    });

    let memories: Array<{ kind: "preference" | "fact" | "goal" | "skill"; content: string }> = [];
    try {
      const result = streamText({
        model: gateway.responses("openai/gpt-6-astra"),
        system:
          "Extract durable memories about the user from one exchange. Return at most 5 items, each under 200 characters. " +
          "A 'preference' is how the user wants answers (language, tone, depth, format). A 'fact' is a stable detail the user stated about themselves (role, location, domain, project). " +
          "A 'goal' is something the user is working towards over time. A 'skill' is their expertise level in a subject, so answers can be pitched correctly. " +
          "Never store passwords, keys, payment details, health or other sensitive personal data, one-off task details, or anything the assistant said about itself. Return an empty list when nothing durable was stated.",
        prompt: `User said:\n${data.prompt}\n\nAssistant replied:\n${data.answer.slice(0, 4000)}`,
        output: Output.object({ schema: MemorySchema }),
        providerOptions: { openai: { store: false } },
      });
      const parsed = await result.output;
      memories = parsed.memories.slice(0, 5);
    } catch (error) {
      if (!NoObjectGeneratedError.isInstance(error)) throw error;
      return { learned: 0 };
    }

    const rows = memories
      .map((item) => ({
        user_id: context.userId,
        kind: item.kind,
        content: item.content.trim().slice(0, 300),
      }))
      .filter((row) => row.content.length >= 3);
    if (rows.length === 0) return { learned: 0 };

    const { error } = await context.supabase
      .from("user_memory")
      .upsert(rows, { onConflict: "user_id,content", ignoreDuplicates: true });
    if (error) return { learned: 0 };
    return { learned: rows.length };
  });
