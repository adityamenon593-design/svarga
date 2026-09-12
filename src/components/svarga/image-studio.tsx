import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";

import { generateSvargaImage } from "@/lib/image.functions";

const PRESETS: [string, string, string] = [
  "An anatomical illustration of the human lungs lit by golden prāṇa currents",
  "A brass Jantar Mantar dial against an indigo dusk sky",
  "A Sanskrit manuscript folio with gilded yantra marginalia",
];

export function ImageStudio() {
  const generate = useServerFn(generateSvargaImage);
  const [prompt, setPrompt] = useState(PRESETS[0]);
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const run = async (value: string) => {
    const trimmed = value.trim();
    if (trimmed.length < 3 || loading) return;
    setLoading(true);
    try {
      const result = await generate({ data: { prompt: trimmed } });
      setImage(result.url);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Image generation failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-5 md:grid-cols-2">
      <div className="rounded-2xl border border-ink/5 bg-sand/50 p-6">
        <label
          htmlFor="studio-prompt"
          className="font-mono text-[10px] uppercase tracking-[0.25em] text-crimson"
        >
          Prompt
        </label>
        <textarea
          id="studio-prompt"
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          rows={3}
          className="mt-2 w-full resize-none rounded-xl border border-ink/10 bg-cream px-4 py-3 text-sm leading-relaxed text-ink outline-none focus:border-saffron"
        />
        <div className="mt-3 flex flex-wrap gap-2">
          {PRESETS.map((preset) => (
            <button
              key={preset}
              onClick={() => setPrompt(preset)}
              className="rounded-full border border-ink/15 px-3 py-1 text-xs text-ink/60 transition-colors hover:border-crimson hover:text-crimson"
            >
              {preset.split(" ").slice(0, 3).join(" ")}…
            </button>
          ))}
        </div>
        <button
          onClick={() => void run(prompt)}
          disabled={loading}
          className="mt-5 rounded-full bg-crimson px-6 py-3 text-sm font-semibold text-cream transition-opacity disabled:opacity-60"
        >
          {loading ? "Rendering…" : "Generate image"}
        </button>
      </div>

      <div className="grid aspect-[16/11] place-items-center overflow-hidden rounded-2xl border border-ink/5 bg-ink/90">
        {image ? (
          <img src={image} alt={prompt} className="size-full object-cover" />
        ) : (
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-cream/40">
            {loading ? "Rendering…" : "Your render appears here"}
          </span>
        )}
      </div>
    </div>
  );
}
