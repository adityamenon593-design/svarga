export async function embedText(text: string): Promise<number[] | null> {
  const result = await embedTexts([text]);
  return result[0] ?? null;
}

export async function embedTexts(texts: string[]): Promise<(number[] | null)[]> {
  const openAiKey = process.env["OPENAI_API_KEY"];
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const useOpenAI = Boolean(openAiKey);
  const key = openAiKey ?? lovableKey;
  if (!key) {
    console.error("embedTexts: no AI provider key is configured");
    return texts.map(() => null);
  }

  const baseUrl = useOpenAI
    ? (process.env["OPENAI_BASE_URL"] ?? "https://api.openai.com/v1")
    : (process.env["LOVABLE_AI_BASE_URL"] ?? "https://ai.gateway.lovable.dev/v1");
  const model = useOpenAI
    ? (process.env["SVARGA_OPENAI_EMBEDDING_MODEL"] ?? "text-embedding-3-large")
    : "google/gemini-embedding-2";
  const results: (number[] | null)[] = [];

  // Keep batches bounded for both OpenAI and the legacy Lovable gateway.
  const batchSize = 100;
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize).map((t) => t.slice(0, 8000));
    const response = await fetch(baseUrl.replace(/\/$/, "") + "/embeddings", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + key,
        ...(useOpenAI ? {} : { "Lovable-API-Key": key }),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        input: batch,
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "unknown");
      console.error("embedTexts failed:", response.status, body);
      results.push(...batch.map(() => null));
      continue;
    }

    const json = (await response.json()) as {
      data?: Array<{ index: number; embedding: number[] }>;
    };

    const batchResults = batch.map<number[] | null>(() => null);
    for (const item of json.data ?? []) {
      if (item.embedding) batchResults[item.index] = item.embedding;
    }
    results.push(...batchResults);
  }

  return results;
}
