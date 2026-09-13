export async function embedText(text: string): Promise<number[] | null> {
  const result = await embedTexts([text]);
  return result[0] ?? null;
}

export async function embedTexts(texts: string[]): Promise<(number[] | null)[]> {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) {
    console.error("embedTexts: LOVABLE_API_KEY is missing");
    return texts.map(() => null);
  }

  const results: (number[] | null)[] = [];

  // google/gemini-embedding-* rejects > 100 inputs per request
  const batchSize = 100;
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize).map((t) => t.slice(0, 8000));
    const response = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-embedding-2",
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
