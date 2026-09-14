import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";

/**
 * Gita listening mode — a quiet, hands-free audio room.
 * Play your own recorded classes, or let Svarga recite the Gita verse by verse.
 * Everything auto-advances so the screen can be put down; a sleep timer stops it.
 */

type Verse = { ref: string; iast: string; meaning: string };

const VERSES: Verse[] = [
  {
    ref: "BG 2.13",
    iast: "dehino 'smin yathā dehe kaumāraṁ yauvanaṁ jarā, tathā dehāntara-prāptir dhīras tatra na muhyati",
    meaning:
      "As the embodied self passes through childhood, youth and age in this body, so it passes to another body. The steady one is not bewildered by this.",
  },
  {
    ref: "BG 2.14",
    iast: "mātrā-sparśās tu kaunteya śītoṣṇa-sukha-duḥkha-dāḥ, āgamāpāyino 'nityās tāṁs titikṣasva bhārata",
    meaning:
      "Contact with the senses brings cold and heat, pleasure and pain. They come and go and do not last. Bear them patiently.",
  },
  {
    ref: "BG 2.20",
    iast: "na jāyate mriyate vā kadācin nāyaṁ bhūtvā bhavitā vā na bhūyaḥ, ajo nityaḥ śāśvato 'yaṁ purāṇo na hanyate hanyamāne śarīre",
    meaning:
      "The self is never born and never dies. Unborn, eternal, everlasting and ancient, it is not slain when the body is slain.",
  },
  {
    ref: "BG 2.47",
    iast: "karmaṇy evādhikāras te mā phaleṣu kadācana, mā karma-phala-hetur bhūr mā te saṅgo 'stv akarmaṇi",
    meaning:
      "You have a right to your action alone, never to its fruits. Do not act for the fruit, and do not be attached to inaction.",
  },
  {
    ref: "BG 2.48",
    iast: "yoga-sthaḥ kuru karmāṇi saṅgaṁ tyaktvā dhanañjaya, siddhy-asiddhyoḥ samo bhūtvā samatvaṁ yoga ucyate",
    meaning:
      "Established in yoga, do your work, letting go of attachment, the same in success and failure. Evenness of mind is called yoga.",
  },
  {
    ref: "BG 2.62",
    iast: "dhyāyato viṣayān puṁsaḥ saṅgas teṣūpajāyate, saṅgāt sañjāyate kāmaḥ kāmāt krodho 'bhijāyate",
    meaning:
      "Dwelling on objects of sense, a person grows attached to them. From attachment comes desire, and from desire anger is born.",
  },
  {
    ref: "BG 3.35",
    iast: "śreyān sva-dharmo viguṇaḥ para-dharmāt sv-anuṣṭhitāt, sva-dharme nidhanaṁ śreyaḥ para-dharmo bhayāvahaḥ",
    meaning:
      "Better one's own duty imperfectly done than another's duty done well. To die in one's own duty is better; another's duty brings fear.",
  },
  {
    ref: "BG 4.7",
    iast: "yadā yadā hi dharmasya glānir bhavati bhārata, abhyutthānam adharmasya tadātmānaṁ sṛjāmy aham",
    meaning: "Whenever dharma declines and adharma rises, then I bring myself forth.",
  },
  {
    ref: "BG 6.35",
    iast: "asaṁśayaṁ mahā-bāho mano durnigrahaṁ calam, abhyāsena tu kaunteya vairāgyeṇa ca gṛhyate",
    meaning:
      "Without doubt the mind is restless and hard to hold. Yet by steady practice and by non-attachment it is held.",
  },
  {
    ref: "BG 9.26",
    iast: "patraṁ puṣpaṁ phalaṁ toyaṁ yo me bhaktyā prayacchati, tad ahaṁ bhakty-upahṛtam aśnāmi prayatātmanaḥ",
    meaning:
      "A leaf, a flower, a fruit, water — whoever offers it to me with love, that offering of the pure-hearted I accept.",
  },
  {
    ref: "BG 12.15",
    iast: "yasmān nodvijate loko lokān nodvijate ca yaḥ, harṣāmarṣa-bhayodvegair mukto yaḥ sa ca me priyaḥ",
    meaning:
      "The one who troubles no one and is troubled by no one, free of elation, envy, fear and anxiety — that one is dear to me.",
  },
  {
    ref: "BG 18.66",
    iast: "sarva-dharmān parityajya mām ekaṁ śaraṇaṁ vraja, ahaṁ tvāṁ sarva-pāpebhyo mokṣayiṣyāmi mā śucaḥ",
    meaning:
      "Letting go of all else, take refuge in me alone. I shall free you from all wrongs. Do not grieve.",
  },
];

const TIMERS = [0, 15, 30, 45, 60] as const;
const SPEEDS = [0.75, 1, 1.25, 1.5] as const;

type SourceMode = "verses" | "recordings";

export function GitaListening() {
  const [sourceMode, setSourceMode] = useState<SourceMode>("verses");
  const [tracks, setTracks] = useState<{ name: string; url: string }[]>([]);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState<number>(0);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [speed, setSpeed] = useState<number>(1);
  const [token, setToken] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const stopRef = useRef(false);
  const fileInput = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    void supabase.auth
      .getSession()
      .then(({ data }) => setToken(data.session?.access_token ?? null));
  }, []);

  const halt = useCallback(() => {
    stopRef.current = true;
    setPlaying(false);
    setLoading(false);
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.onended = null;
    }
  }, []);

  // Sleep timer — counts down and stops playback, so it can be left running at night.
  useEffect(() => {
    if (remaining === null) return;
    if (remaining <= 0) {
      halt();
      setRemaining(null);
      return;
    }
    const id = window.setTimeout(() => setRemaining((r) => (r === null ? null : r - 1)), 60_000);
    return () => window.clearTimeout(id);
  }, [remaining, halt]);

  const playUrl = (url: string) =>
    new Promise<void>((resolve, reject) => {
      const audio = audioRef.current ?? new Audio();
      audioRef.current = audio;
      audio.src = url;
      audio.onended = () => resolve();
      audio.onerror = () => reject(new Error("Could not play that audio."));
      void audio.play().catch(reject);
    });

  const speakVerse = async (verse: Verse) => {
    const response = await fetch("/api/voice/speak", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        text: `${verse.ref}. ${verse.iast}. ${verse.meaning}`.slice(0, 3000),
      }),
    });
    if (!response.ok) throw new Error(await response.text());
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    try {
      await playUrl(url);
    } finally {
      URL.revokeObjectURL(url);
    }
  };

  // Plays continuously from `from` onwards, hands-free, until the end or a stop.
  const runFrom = async (from: number) => {
    stopRef.current = false;
    setPlaying(true);
    const list = sourceMode === "verses" ? VERSES : tracks;
    for (let i = from; i < list.length; i += 1) {
      if (stopRef.current) break;
      setIndex(i);
      try {
        if (sourceMode === "verses") {
          setLoading(true);
          await speakVerse(VERSES[i]!);
        } else {
          await playUrl(tracks[i]!.url);
        }
      } catch (error) {
        if (stopRef.current) break;
        toast.error(error instanceof Error ? error.message.slice(0, 160) : "Playback stopped.");
        break;
      } finally {
        setLoading(false);
      }
      // A breath of silence between verses keeps the listening unhurried.
      if (sourceMode === "verses" && !stopRef.current)
        await new Promise((r) => window.setTimeout(r, 1500));
    }
    setPlaying(false);
  };

  const toggle = () => {
    if (playing) {
      halt();
      return;
    }
    if (sourceMode === "recordings" && tracks.length === 0) {
      fileInput.current?.click();
      return;
    }
    if (timer > 0) setRemaining(timer);
    void runFrom(index);
  };

  const jump = (next: number) => {
    const list = sourceMode === "verses" ? VERSES : tracks;
    const target = Math.max(0, Math.min(list.length - 1, next));
    if (playing) {
      halt();
      window.setTimeout(() => void runFrom(target), 150);
    } else {
      setIndex(target);
    }
  };

  const addFiles = (files: FileList | null) => {
    if (!files?.length) return;
    const added = Array.from(files)
      .filter((f) => f.type.startsWith("audio/") || /\.(mp3|m4a|wav|ogg|aac)$/i.test(f.name))
      .map((f) => ({ name: f.name.replace(/\.[^.]+$/, ""), url: URL.createObjectURL(f) }));
    if (!added.length) {
      toast.error("Those files are not audio recordings.");
      return;
    }
    setTracks((prev) => [...prev, ...added]);
    setSourceMode("recordings");
    setIndex(0);
  };

  const list = sourceMode === "verses" ? VERSES : tracks;
  const nowRef = sourceMode === "verses" ? VERSES[index]?.ref : tracks[index]?.name;

  return (
    <section id="listen" className="border-t border-ink/10 py-14">
      <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.25em] text-crimson">
        Listening
      </p>
      <h2 className="mb-2 font-display text-4xl font-semibold">Gita classes, hands-free.</h2>
      <p className="mb-8 max-w-2xl text-sm text-ink/60">
        Put the phone down and listen. Play your own recorded classes, or let Svarga recite the Gita
        verse by verse — it moves on by itself, and the sleep timer stops it while you rest.
      </p>

      <div className="rounded-3xl border border-ink/10 bg-ink p-6 text-cream shadow-2xl shadow-ink/20 sm:p-8">
        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              ["verses", "Gita recitation"],
              ["recordings", "My recordings"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                halt();
                setSourceMode(id);
                setIndex(0);
              }}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                sourceMode === id
                  ? "bg-saffron text-ink"
                  : "border border-cream/20 text-cream/70 hover:text-cream"
              }`}
            >
              {label}
            </button>
          ))}
          <input
            ref={fileInput}
            type="file"
            accept="audio/*"
            multiple
            className="hidden"
            onChange={(event) => {
              addFiles(event.target.files);
              event.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            className="ml-auto rounded-full border border-cream/20 px-4 py-1.5 text-xs font-semibold text-cream/70 transition-colors hover:text-cream"
          >
            + Add recordings
          </button>
        </div>

        <div className="mt-8 text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-cream/40">
            {loading ? "Preparing…" : playing ? "Now playing" : "Ready"}
          </p>
          <p className="mt-3 font-display text-2xl font-semibold text-cream">
            {nowRef ?? "Add a recording to begin"}
          </p>
          {sourceMode === "verses" && VERSES[index] && (
            <>
              <p className="mx-auto mt-4 max-w-2xl text-sm italic leading-relaxed text-saffron/90">
                {VERSES[index]!.iast}
              </p>
              <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-cream/70">
                {VERSES[index]!.meaning}
              </p>
            </>
          )}
        </div>

        <div className="mt-8 flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => jump(index - 1)}
            disabled={index === 0}
            aria-label="Previous"
            className="rounded-full border border-cream/20 px-4 py-2 text-sm text-cream/70 transition-colors hover:text-cream disabled:opacity-30"
          >
            ⏮
          </button>
          <button
            type="button"
            onClick={toggle}
            className="grid size-16 place-items-center rounded-full bg-saffron text-2xl text-ink transition-transform hover:scale-105"
            aria-label={playing ? "Pause" : "Play"}
          >
            {playing ? "❚❚" : "▶"}
          </button>
          <button
            type="button"
            onClick={() => jump(index + 1)}
            disabled={index >= list.length - 1}
            aria-label="Next"
            className="rounded-full border border-cream/20 px-4 py-2 text-sm text-cream/70 transition-colors hover:text-cream disabled:opacity-30"
          >
            ⏭
          </button>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-cream/40">
            Sleep timer
          </span>
          {TIMERS.map((minutes) => (
            <button
              key={minutes}
              type="button"
              onClick={() => {
                setTimer(minutes);
                setRemaining(playing && minutes > 0 ? minutes : null);
              }}
              className={`rounded-full px-3 py-1 text-xs transition-colors ${
                timer === minutes
                  ? "bg-cream text-ink"
                  : "border border-cream/20 text-cream/60 hover:text-cream"
              }`}
            >
              {minutes === 0 ? "Off" : `${minutes}m`}
            </button>
          ))}
          {remaining !== null && (
            <span className="font-mono text-[10px] text-saffron">stops in {remaining}m</span>
          )}
        </div>

        {sourceMode === "recordings" && tracks.length > 0 && (
          <ul className="mt-8 space-y-1 border-t border-cream/10 pt-4">
            {tracks.map((track, i) => (
              <li key={track.url}>
                <button
                  type="button"
                  onClick={() => jump(i)}
                  className={`w-full truncate rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                    i === index ? "bg-cream/10 text-cream" : "text-cream/55 hover:text-cream"
                  }`}
                >
                  {i + 1}. {track.name}
                </button>
              </li>
            ))}
          </ul>
        )}

        <p className="mt-6 text-center text-[11px] text-cream/35">
          Your recordings stay on this device — they are played locally and never uploaded.
        </p>
      </div>
    </section>
  );
}
