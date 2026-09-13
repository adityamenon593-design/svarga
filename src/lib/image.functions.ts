import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ImageInput = z.object({
  prompt: z.string().min(3).max(1200),
});

type GatewayImageResponse = {
  choices?: Array<{
    message?: {
      images?: Array<{ image_url?: { url?: string } }>;
      content?: string;
    };
  }>;
  data?: Array<{ b64_json?: string; url?: string }>;
};

/** Generates an image with Lovable AI and returns a data/remote URL. */
export const generateSvargaImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ImageInput.parse(input))
  .handler(async ({ data, context }) => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("Image generation is not configured.");

    const { checkQuota, recordUsage } = await import("@/lib/entitlements.server");
    const gate = await checkQuota(context.userId, "image");
    if (!gate.ok) throw new Error(gate.message);

    const res = await fetch("https://ai.gateway.lovable.dev/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": apiKey,
        "X-Lovable-AIG-SDK": "fetch",
      },
      body: JSON.stringify({
        model: "google/gemini-3-pro-image",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `${data.prompt}\n\nRender with luminous, reverent craft: warm cream and saffron light, deep ink shadows, precise geometry. Museum-grade detail, no watermarks, no gibberish text.`,
              },
            ],
          },
        ],
        modalities: ["image", "text"],
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      if (res.status === 429) throw new Error("Too many requests — please wait a moment.");
      if (res.status === 402)
        throw new Error("AI credits are exhausted. Add credits to keep generating.");
      throw new Error(detail || `Image generation failed (${res.status}).`);
    }

    const json = (await res.json()) as GatewayImageResponse;
    const url =
      json.choices?.[0]?.message?.images?.[0]?.image_url?.url ??
      json.data?.[0]?.url ??
      (json.data?.[0]?.b64_json ? `data:image/png;base64,${json.data[0].b64_json}` : undefined);

    if (!url) throw new Error("The model returned no image. Try rephrasing the prompt.");
    await recordUsage(context.userId, "image");
    return { url };
  });
