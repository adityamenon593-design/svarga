import type { SvargaSource } from "./types";
import { embedText } from "./embeddings.server";
import { webSearchProvider } from "./web-search";

export interface RetrievalProvider {
  search(query: string, limit: number): Promise<SvargaSource[]>;
}

async function retrieveLibrary(userId: string, query: string, limit: number): Promise<SvargaSource[]> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const embedding = await embedText(query);
    if (!embedding) return [];

    const { data, error } = await (supabaseAdmin.rpc as any)("match_document_chunks", {
      query_embedding: embedding,
      match_count: limit,
      p_user_id: userId,
    });

    if (error || !data) {
      console.error("match_document_chunks error:", error);
      return [];
    }

    return (data as Array<{ id: string; content: string; title: string; document_id: string; similarity: number }>).map(
      (row) => ({
        id: row.id,
        title: row.title,
        kind: "library" as const,
        authority: "primary" as const,
        locator: `#library/${row.document_id}`,
        excerpt: row.content,
        score: row.similarity,
      }),
    );
  } catch (error) {
    console.error("Library retrieval failed:", error);
    return [];
  }
}

export async function retrieveContext(query: string, userId?: string): Promise<SvargaSource[]> {
  const limit = Math.max(1, Math.min(Number(process.env["SVARGA_RAG_TOP_K"] ?? 6), 12));
  const [web, library] = await Promise.allSettled([
    webSearchProvider
      ? webSearchProvider.search(query, limit).catch((error) => {
          console.error("Web search failed:", error);
          return [];
        })
      : [],
    userId ? retrieveLibrary(userId, query, limit) : [],
  ]);

  const webSources = web.status === "fulfilled" ? web.value : [];
  const librarySources = library.status === "fulfilled" ? library.value : [];
  return [...librarySources, ...webSources];
}
