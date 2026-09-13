import type { SvargaSource } from "./types";

export interface WebSearchProvider {
  search(query: string, limit?: number): Promise<SvargaSource[]>;
}

function pickProvider(): WebSearchProvider | null {
  if (process.env["PERPLEXITY_API_KEY"]) return new PerplexityProvider();
  if (process.env["FIRECRAWL_API_KEY"]) return new FirecrawlProvider();
  return null;
}

export const webSearchProvider: WebSearchProvider | null = pickProvider();

class PerplexityProvider implements WebSearchProvider {
  async search(query: string, limit = 5): Promise<SvargaSource[]> {
    const key = process.env["PERPLEXITY_API_KEY"];
    if (!key) return [];
    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar",
        messages: [
          {
            role: "system",
            content:
              "You are a precise research assistant. Answer with current facts and include citations as numbered [1], [2], etc.",
          },
          { role: "user", content: query },
        ],
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "Unknown error");
      throw new Error(`Perplexity search failed [${response.status}]: ${text}`);
    }

    const json = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
      citations?: string[];
    };

    const citations = json.citations ?? [];
    return citations.slice(0, limit).map((url, index) => ({
      id: `web-${index}`,
      title: url,
      kind: "web" as const,
      authority: "secondary" as const,
      locator: url,
      excerpt: json.choices?.[0]?.message?.content ?? "",
    }));
  }
}

class FirecrawlProvider implements WebSearchProvider {
  private async call<T>(path: string, body: unknown): Promise<T> {
    const key = process.env["FIRECRAWL_API_KEY"];
    if (!key) throw new Error("FIRECRAWL_API_KEY is not configured");

    const usesGateway = !key.startsWith("fc-");
    const url = usesGateway
      ? `https://connector-gateway.lovable.dev/firecrawl/v2${path}`
      : `https://api.firecrawl.dev/v2${path}`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (usesGateway) {
      const lovableKey = process.env["LOVABLE_API_KEY"];
      if (!lovableKey) throw new Error("LOVABLE_API_KEY is not configured");
      headers["Authorization"] = `Bearer ${lovableKey}`;
      headers["X-Connection-Api-Key"] = key;
    } else {
      headers["Authorization"] = `Bearer ${key}`;
    }

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "Unknown error");
      throw new Error(`Firecrawl search failed [${response.status}]: ${text}`);
    }

    return (await response.json()) as T;
  }

  async search(query: string, limit = 5): Promise<SvargaSource[]> {
    type Result = {
      data?: Array<{ url?: string; title?: string; description?: string; markdown?: string }>;
    };
    const json = await this.call<Result>("/search", {
      query,
      limit,
      scrapeOptions: { formats: ["markdown"] },
    });

    return (json.data ?? [])
      .filter((item) => item.url)
      .map((item, index) => ({
        id: `web-${index}`,
        title: item.title || item.url || "Web result",
        kind: "web" as const,
        authority: "secondary" as const,
        locator: item.url!,
        excerpt: item.markdown || item.description || "",
      }));
  }
}
