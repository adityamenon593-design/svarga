import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { useAuth } from "@/hooks/use-auth";
import { listImages, saveImage } from "@/lib/history.functions";
import { generateSvargaImage } from "@/lib/image.functions";

const PRESETS: [string, string, string] = [
  "An anatomical illustration of the human lungs lit by golden prāṇa currents",
  "A brass Jantar Mantar dial against an indigo dusk sky",
  "A Sanskrit manuscript folio with gilded yantra marginalia",
];

type Render = { id: string; prompt: string; image_url: string };

export function ImageStudio() {
  const { user } = useAuth();
  const generate = useServerFn(generateSvargaImage);
  const persistImage = useServerFn(saveImage);
  const fetchImages = useServerFn(listImages);

  const [prompt, setPrompt] = useState(PRESETS[0]);
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [gallery, setGallery] = useState<Render[]>([]);

  const refreshGallery = useCallback(async () => {
    if (!user) {
      setGallery([]);
      return;
    }
    try {
      setGallery((await fetchImages()) as Render[]);
    } catch {
      /* gallery is optional */
    }
  }, [user, fetchImages]);

  useEffect(() => {
    void refreshGallery();
  }, [refreshGallery]);

  const run = async (value: string) => {
    const trimmed = value.trim();
    if (trimmed.length < 3 || loading) return;
    setLoading(true);
    try {
      const result = await generate({ data: { prompt: trimmed } });
      setImage(result.url);
      if (user) {
        await persistImage({ data: { prompt: trimmed, imageUrl: result.url } });
        void refreshGallery();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Image generation failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
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
          {!user ? (
            <p className="mt-4 text-xs text-ink/50">
              <Link to="/auth" className="text-crimson underline-offset-2 hover:underline">
                Sign in
              </Link>{" "}
              to save every render to your gallery.
            </p>
          ) : null}
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

      {gallery.length > 0 ? (
        <div>
          <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.25em] text-ink/40">
            Your gallery
          </p>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            {gallery.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setImage(item.image_url);
                  setPrompt(item.prompt);
                }}
                className="aspect-square overflow-hidden rounded-xl border border-ink/5"
              >
                <img
                  src={item.image_url}
                  alt={item.prompt}
                  loading="lazy"
                  className="size-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
