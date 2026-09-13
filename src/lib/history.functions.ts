import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const SaveTurnInput = z.object({
  conversationId: z.string().uuid().nullable(),
  prompt: z.string().min(1).max(8000),
  answer: z.string().min(1).max(60000),
});

const IdInput = z.object({ id: z.string().uuid() });

const SaveImageInput = z.object({
  prompt: z.string().min(3).max(1200),
  imageUrl: z.string().min(5),
});

/** Lists the signed-in user's conversation threads, newest first. */
export const listConversations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("conversations")
      .select("id, title, updated_at")
      .order("updated_at", { ascending: false })
      .limit(30);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

/** Loads every message in one of the user's conversations. */
export const listMessages = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => IdInput.parse(input))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("messages")
      .select("id, role, content, created_at")
      .eq("conversation_id", data.id)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

/** Persists one question/answer pair, creating the thread on first turn. */
export const saveTurn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => SaveTurnInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    let conversationId = data.conversationId;

    if (!conversationId) {
      const title = data.prompt.slice(0, 70);
      const { data: created, error } = await supabase
        .from("conversations")
        .insert({ user_id: userId, title })
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      conversationId = created.id;
    } else {
      await supabase
        .from("conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", conversationId);
    }

    const { error: messageError } = await supabase.from("messages").insert([
      { conversation_id: conversationId, user_id: userId, role: "user", content: data.prompt },
      { conversation_id: conversationId, user_id: userId, role: "assistant", content: data.answer },
    ]);
    if (messageError) throw new Error(messageError.message);

    return { conversationId };
  });

/** Deletes one of the user's conversations and its messages. */
export const deleteConversation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => IdInput.parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("conversations").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Lists the user's saved renders. */
export const listImages = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("generated_images")
      .select("id, prompt, image_url, created_at")
      .order("created_at", { ascending: false })
      .limit(12);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

/** Saves a render to the user's gallery. */
export const saveImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => SaveImageInput.parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("generated_images")
      .insert({ user_id: context.userId, prompt: data.prompt, image_url: data.imageUrl });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
