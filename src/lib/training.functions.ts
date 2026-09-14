import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Owner-only training-corpus export.
 *
 * Only conversations from accounts that explicitly switched on
 * "help train Svarga" are ever included. Everything else is invisible here,
 * and obvious personal details are stripped before a single row leaves the box.
 */

const FOUNDER_EMAIL = "adityamenon593@gmail.com";

const ExportInput = z.object({
  limit: z.number().int().min(1).max(20000),
  minAnswerChars: z.number().int().min(0).max(2000),
});

const PII =
  /(\+?\d[\d\s-]{8,}\d|[\w.+-]+@[\w-]+\.[\w.]+|\b\d{4}\s?\d{4}\s?\d{4}\b|\b[A-Z]{5}\d{4}[A-Z]\b)/g;

function scrub(text: string): string {
  return text.replace(PII, "[removed]").trim();
}

type MessageRow = {
  conversation_id: string;
  user_id: string;
  role: string;
  content: string;
  created_at: string;
};

export const exportTrainingCorpus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ExportInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: caller } = await supabaseAdmin.auth.admin.getUserById(context.userId);
    if (caller?.user?.email?.toLowerCase() !== FOUNDER_EMAIL) {
      throw new Error("This export is restricted to the owner of Svarga.ai.");
    }

    const { data: consented, error: consentError } = await supabaseAdmin
      .from("user_settings")
      .select("user_id")
      .eq("training_consent", true);
    if (consentError) throw new Error(consentError.message);

    const consentedIds = (consented ?? []).map((row) => (row as { user_id: string }).user_id);
    if (consentedIds.length === 0) {
      return { examples: [], consentedAccounts: 0, jsonl: "" };
    }

    const { data: rows, error } = await supabaseAdmin
      .from("messages")
      .select("conversation_id, user_id, role, content, created_at")
      .in("user_id", consentedIds)
      .order("created_at", { ascending: true })
      .limit(data.limit);
    if (error) throw new Error(error.message);

    const pending = new Map<string, string>();
    const examples: { instruction: string; output: string }[] = [];

    for (const row of (rows ?? []) as MessageRow[]) {
      if (row.role === "user") {
        pending.set(row.conversation_id, row.content);
        continue;
      }
      if (row.role !== "assistant") continue;

      const prompt = pending.get(row.conversation_id);
      pending.delete(row.conversation_id);
      if (!prompt) continue;

      const instruction = scrub(prompt);
      const output = scrub(row.content);
      if (instruction.length < 8 || output.length < data.minAnswerChars) continue;
      if (instruction.includes("[removed]") || output.includes("[removed]")) continue;

      examples.push({ instruction, output });
    }

    return {
      examples,
      consentedAccounts: consentedIds.length,
      jsonl: examples.map((example) => JSON.stringify(example)).join("\n"),
    };
  });
