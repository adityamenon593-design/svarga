export async function embedText(text: string): Promise<number[] | null> {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) {
    console.error("embedText: LOVABLE_API_KEY is missing");
    return null;
  }

  const response = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-embedding-2",
      input: text.slice(0, 8000),
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "unknown");
    console.error("embedText failed:", response.status, body);
    return null;
  }

  const json = (await response.json()) as {
    data?: Array<{ embedding: number[] }>;
  };
  return json.data?.[0]?.embedding ?? null;
}
