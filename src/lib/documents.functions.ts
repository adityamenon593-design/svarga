import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const CreateDocumentInput = z.object({
  title: z.string().min(1).max(500),
  kind: z.enum(["pdf", "text", "epub", "other"]),
});

const DocumentIdInput = z.object({ id: z.string().uuid() });

export type DocumentRow = {
  id: string;
  user_id: string;
  title: string;
  file_path: string;
  kind: string;
  status: string;
  error: string | null;
  created_at: string;
  updated_at: string;
};

export const listDocuments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("documents" as "documents")
      .select("*")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .returns<DocumentRow[]>();
    if (error) throw new Error(error.message);
    return (data ?? []) as DocumentRow[];
  });

export const createDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => CreateDocumentInput.parse(input))
  .handler(async ({ context, data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const filePath = `${context.userId}/${crypto.randomUUID()}`;

    const { data: row, error: insertError } = await supabaseAdmin
      .from("documents" as "documents")
      .insert({
        user_id: context.userId,
        title: data.title,
        file_path: filePath,
        kind: data.kind,
        status: "pending",
      })
      .select()
      .single();
    if (insertError || !row) {
      throw new Error(insertError?.message ?? "Failed to create document record");
    }

    const { data: signed, error: signError } = await supabaseAdmin.storage
      .from("documents")
      .createSignedUploadUrl(filePath);
    if (signError || !signed?.signedUrl) {
      throw new Error(signError?.message ?? "Failed to create upload URL");
    }

    return {
      document: row as DocumentRow,
      signedUrl: signed.signedUrl,
      token: signed.token,
    };
  });

export const ingestDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => DocumentIdInput.parse(input))
  .handler(async ({ context, data }) => {
    const { runIngestion } = await import("./ingestion.server");
    await runIngestion({ documentId: data.id, userId: context.userId });
    return { ok: true };
  });

export const deleteDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => DocumentIdInput.parse(input))
  .handler(async ({ context, data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: doc, error: fetchError } = await supabaseAdmin
      .from("documents" as "documents")
      .select("file_path")
      .eq("id", data.id)
      .eq("user_id", context.userId)
      .single();
    if (fetchError || !doc) {
      throw new Error(fetchError?.message ?? "Not found");
    }

    await supabaseAdmin.from("documents" as "documents").delete().eq("id", data.id);
    await supabaseAdmin.storage.from("documents").remove([doc.file_path]);
    return { ok: true };
  });
