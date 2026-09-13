import { tool } from "ai";
import { z } from "zod";

import { embedText } from "./embeddings.server";
import type { SvargaSource } from "./types";
import { webSearchProvider } from "./web-search";

/**
 * Agentic tools. Svarga decides on its own when to look something up, search the
 * user's private library, compute, or check the current date in IST. Everything
 * here runs server-side only.
 */
export function svargaTools(userId?: string | null) {
  return {
    web_search: tool({
      description:
        "Search the live web for current facts, news, prices, schemes, results or anything after your knowledge cutoff. Always cite the returned URLs.",
      inputSchema: z.object({
        query: z.string().describe("A focused search query."),
      }),
      execute: async ({ query }) => {
        if (!webSearchProvider)
          return { available: false, results: [] as SvargaSource[], note: "Live web search is not configured on this deployment. Answer from your own knowledge and say it may not be current." };
        try {
          const results = await webSearchProvider.search(query, 6);
          return {
            available: true,
            results: results.map((r) => ({
              title: r.title,
              url: r.locator ?? "",
              excerpt: (r.excerpt ?? "").slice(0, 1200),
            })),
          };
        } catch (error) {
          return {
            available: false,
            results: [],
            note: error instanceof Error ? error.message.slice(0, 200) : "Search failed.",
          };
        }
      },
    }),

    search_library: tool({
      description:
        "Search the signed-in user's own uploaded document library (books, PDFs, scripture) for passages relevant to a question.",
      inputSchema: z.object({
        query: z.string().describe("What to look for inside the user's documents."),
      }),
      execute: async ({ query }) => {
        if (!userId) return { results: [], note: "The user is not signed in, so no private library is available." };
        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const embedding = await embedText(query);
          if (!embedding) return { results: [], note: "Library index unavailable." };
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data, error } = await (supabaseAdmin.rpc as any)("match_document_chunks", {
            query_embedding: embedding,
            match_count: 6,
            p_user_id: userId,
          });
          if (error || !data) return { results: [], note: "No matching passages found." };
          return {
            results: (
              data as Array<{ content: string; title: string; document_id: string }>
            ).map((row) => ({
              title: row.title,
              documentId: row.document_id,
              excerpt: row.content.slice(0, 1200),
            })),
          };
        } catch {
          return { results: [], note: "Library search failed." };
        }
      },
    }),

    calculate: tool({
      description:
        "Evaluate an arithmetic expression exactly (supports + - * / % ** parentheses). Use for money, percentages, unit maths, lakhs/crores.",
      inputSchema: z.object({
        expression: z.string().describe("A pure arithmetic expression, e.g. (14500*0.18)+14500"),
      }),
      execute: async ({ expression }) => {
        const safe = expression.replace(/[^0-9+\-*/%.()e ]/gi, "");
        if (!safe.trim()) return { error: "Empty expression." };
        try {
          // eslint-disable-next-line no-new-func
          const value = Function(`"use strict";return (${safe});`)() as unknown;
          if (typeof value !== "number" || !Number.isFinite(value))
            return { error: "Not a finite number." };
          return { expression: safe, value };
        } catch {
          return { error: "Could not evaluate that expression." };
        }
      },
    }),

    current_datetime: tool({
      description:
        "Get the current date and time in India Standard Time. Use before answering anything about 'today', deadlines, ages or schedules.",
      inputSchema: z.object({}),
      execute: async () => {
        const now = new Date();
        return {
          iso: now.toISOString(),
          ist: now.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
        };
      },
    }),
  };
}
