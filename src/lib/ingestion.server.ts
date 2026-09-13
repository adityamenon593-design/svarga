import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";
import JSZip from "jszip";

export async function runIngestion({
  documentId,
  userId,
}: {
  documentId: string;
  userId: string;
}): Promise<void> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { embedTexts } = await import("./ai/embeddings.server");

  const { data: doc, error } = await supabaseAdmin
    .from("documents" as const)
    .select("*")
    .eq("id", documentId)
    .single();
  if (error || !doc) {
    throw new Error(error?.message ?? "Document not found");
  }

  await supabaseAdmin
    .from("documents" as const)
    .update({ status: "processing", error: null })
    .eq("id", documentId);

  try {
    const { data: file, error: downloadError } = await supabaseAdmin.storage
      .from("documents")
      .download(doc.file_path);
    if (downloadError || !file) {
      throw new Error(downloadError?.message ?? "Failed to download file");
    }

    const buffer = await file.arrayBuffer();
    const text = await extractText(buffer, doc.kind);
    if (!text.trim()) {
      throw new Error("No extractable text found in file");
    }

    const chunks = chunkText(text);
    const embeddings = await embedTexts(chunks);

    const rows = chunks
      .map((content, index) => ({
        document_id: documentId,
        chunk_index: index,
        content,
        embedding: embeddings[index],
      }))
      .filter((row): row is typeof row & { embedding: number[] } => row.embedding != null)
      .map((row) => ({ ...row, embedding: `[${row.embedding.join(",")}]` }));

    if (rows.length === 0) {
      throw new Error("Failed to generate embeddings for the document");
    }

    const { error: insertError } = await supabaseAdmin
      .from("document_chunks" as const)
      .insert(rows as { document_id: string; chunk_index: number; content: string; embedding: string }[]);
    if (insertError) {
      throw new Error(insertError.message);
    }

    await supabaseAdmin
      .from("documents" as const)
      .update({ status: "ready", error: null })
      .eq("id", documentId);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await supabaseAdmin
      .from("documents" as const)
      .update({ status: "error", error: message })
      .eq("id", documentId);
    throw err;
  }
}

async function extractText(buffer: ArrayBuffer, kind: string): Promise<string> {
  if (kind === "text") {
    return new TextDecoder().decode(buffer);
  }

  if (kind === "pdf") {
    // pdfjs-dist types are strict about init parameters; runtime accepts our options.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const loadingTask = pdfjs.getDocument({
      data: new Uint8Array(buffer),
      useSystemFonts: true,
    } as any);
    const pdf = await loadingTask.promise;
    let text = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text +=
        content.items.map((item) => (item as { str: string }).str).join(" ") + "\n";
    }
    return text;
  }

  if (kind === "epub") {
    const zip = await JSZip.loadAsync(buffer);
    let text = "";
    for (const [name, file] of Object.entries(zip.files)) {
      if (file.dir) continue;
      if (/\.(xhtml|html|htm|xml)$/i.test(name) && !name.startsWith("META-INF")) {
        const content = await file.async("string");
        text += content.replace(/<[^>]+>/g, " ") + "\n";
      }
    }
    return text;
  }

  throw new Error("Unsupported document kind");
}

function chunkText(text: string, chunkSize = 1200, overlap = 200): string[] {
  const cleaned = text.replace(/\s+/g, " ").trim();
  const chunks: string[] = [];
  let start = 0;

  while (start < cleaned.length) {
    const end = Math.min(start + chunkSize, cleaned.length);
    const fallback = start + Math.floor(chunkSize * 0.6);
    const boundary = end < cleaned.length ? Math.max(cleaned.lastIndexOf(" ", end), fallback) : end;
    const splitAt = end < cleaned.length && boundary > start ? boundary : end;
    chunks.push(cleaned.slice(start, splitAt).trim());
    const next = splitAt - overlap;
    if (next <= start) break;
    start = next;
  }

  return chunks.filter(Boolean);
}
