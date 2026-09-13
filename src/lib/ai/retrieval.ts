import type { SvargaSource } from "./types";

/**
 * Retrieval adapter. It is intentionally corpus-agnostic: production data can be
 * backed by pgvector, another vector store, or a managed search provider without
 * coupling the answer layer to a vendor.
 */
export interface RetrievalProvider {
  search(query: string, limit: number): Promise<SvargaSource[]>;
}

class EmptyRetrievalProvider implements RetrievalProvider {
  async search(): Promise<SvargaSource[]> {
    return [];
  }
}

export const retrievalProvider: RetrievalProvider = new EmptyRetrievalProvider();

export async function retrieveContext(query: string): Promise<SvargaSource[]> {
  const limit = Math.max(1, Math.min(Number(process.env.SVARGA_RAG_TOP_K ?? 6), 12));
  return retrievalProvider.search(query, limit);
}
