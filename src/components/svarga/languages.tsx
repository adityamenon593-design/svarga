import { Link } from "@tanstack/react-router";
import { useState } from "react";

type Language = {
  code: string;
  name: string;
  native: string;
  greeting: string;
  prompts?: string[];
};

/** 39 languages Svarga speaks — 22 scheduled Indian languages, major regional
 *  languages of Bharat, and the world languages our users write in. */
export const LANGUAGES: Language[] = [
  {
    code: "hi",
    name: "Hindi",
    native: "हिन्दी",
    greeting: "नमस्ते! मैं स्वर्ग हूँ।",
    prompts: [
      "पीएम-किसान के लिए आवेदन कैसे करें?",
      "मेरे बजट के हिसाब से महीने की बचत योजना बनाइए।",
      "यूपीएससी की तैयारी का तीन महीने का प्लान दीजिए।",
    ],
  },
  {
    code: "bn",
    name: "Bengali",
    native: "বাংলা",
    greeting: "নমস্কার! আমি স্বর্গ।",
    prompts: [
      "রেশন কার্ডের জন্য কী কী নথি লাগে?",
      "আমার ছোট ব্যবসার জন্য একটি বাজেট তৈরি করো।",
    ],
  },
  {
    code: "mr",
    name: "Marathi",
    native: "मराठी",
    greeting: "नमस्कार! मी स्वर्ग आहे.",
    prompts: ["शेतीसाठी पीक विमा कसा काढायचा?", "माझ्या मुलाच्या अभ्यासाचे वेळापत्रक तयार कर."],
  },
  {
    code: "te",
    name: "Telugu",
    native: "తెలుగు",
    greeting: "నమస్కారం! నేను స్వర్గ.",
    prompts: ["ఆయుష్మాన్ భారత్ కార్డు ఎలా పొందాలి?", "నా నెలవారీ ఖర్చుల ప్రణాళిక రాయి."],
  },
  {
    code: "ta",
    name: "Tamil",
    native: "தமிழ்",
    greeting: "வணக்கம்! நான் ஸ்வர்கா.",
    prompts: ["விவசாய கடன் பெறுவது எப்படி?", "எனக்கு ஒரு வேலை விண்ணப்ப கடிதம் எழுதுங்கள்."],
  },
  {
    code: "gu",
    name: "Gujarati",
    native: "ગુજરાતી",
    greeting: "નમસ્તે! હું સ્વર્ગ છું.",
    prompts: ["નાના વેપાર માટે GST કેવી રીતે ભરવો?", "મારા માટે બચતની યોજના બનાવો."],
  },
  {
    code: "ur",
    name: "Urdu",
    native: "اردو",
    greeting: "السلام علیکم! میں سورگ ہوں۔",
    prompts: ["راشن کارڈ کے لیے درخواست کیسے دیں؟", "میرے لیے ایک سی وی لکھیں۔"],
  },
  {
    code: "kn",
    name: "Kannada",
    native: "ಕನ್ನಡ",
    greeting: "ನಮಸ್ಕಾರ! ನಾನು ಸ್ವರ್ಗ.",
    prompts: ["ಸರ್ಕಾರಿ ಯೋಜನೆಗಳ ಬಗ್ಗೆ ತಿಳಿಸಿ.", "ನನ್ನ ಪರೀಕ್ಷೆಗೆ ಓದುವ ಯೋಜನೆ ಮಾಡಿ."],
  },
  {
    code: "ml",
    name: "Malayalam",
    native: "മലയാളം",
    greeting: "നമസ്കാരം! ഞാൻ സ്വർഗ ആണ്.",
    prompts: ["കേരളത്തിലെ സർക്കാർ പദ്ധതികൾ പറയൂ.", "എനിക്ക് ഒരു ബിസിനസ് പ്ലാൻ എഴുതൂ."],
  },
  {
    code: "or",
    name: "Odia",
    native: "ଓଡ଼ିଆ",
    greeting: "ନମସ୍କାର! ମୁଁ ସ୍ୱର୍ଗ।",
    prompts: ["ଚାଷ ପାଇଁ ସରକାରୀ ସହାୟତା କ'ଣ?", "ମୋ ପାଇଁ ଏକ ବଜେଟ୍ ତିଆରି କର।"],
  },
  {
    code: "pa",
    name: "Punjabi",
    native: "ਪੰਜਾਬੀ",
    greeting: "ਸਤ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ ਸਵਰਗ ਹਾਂ।",
    prompts: ["ਕਿਸਾਨਾਂ ਲਈ ਸਕੀਮਾਂ ਦੱਸੋ।", "ਮੇਰੇ ਲਈ ਨੌਕਰੀ ਦੀ ਅਰਜ਼ੀ ਲਿਖੋ।"],
  },
  {
    code: "as",
    name: "Assamese",
    native: "অসমীয়া",
    greeting: "নমস্কাৰ! মই স্বৰ্গ।",
  },
  { code: "sa", name: "Sanskrit", native: "संस्कृतम्", greeting: "नमस्ते! अहं स्वर्गः।" },
  { code: "ne", name: "Nepali", native: "नेपाली", greeting: "नमस्ते! म स्वर्ग हुँ।" },
  { code: "kok", name: "Konkani", native: "कोंकणी", greeting: "नमस्कार! हांव स्वर्ग." },
  { code: "mai", name: "Maithili", native: "मैथिली", greeting: "प्रणाम! हम स्वर्ग छी।" },
  { code: "bho", name: "Bhojpuri", native: "भोजपुरी", greeting: "प्रणाम! हम स्वर्ग बानी।" },
  { code: "doi", name: "Dogri", native: "डोगरी", greeting: "नमस्कार! मैं स्वर्ग आं।" },
  { code: "ks", name: "Kashmiri", native: "کٲشُر", greeting: "آداب! بہ چھُس سورگ۔" },
  { code: "sd", name: "Sindhi", native: "سنڌي", greeting: "سلام! مان سورگ آهيان." },
  { code: "sat", name: "Santali", native: "ᱥᱟᱱᱛᱟᱲᱤ", greeting: "ᱡᱚᱦᱟᱨ! ᱤᱧ ᱥᱣᱟᱨᱜᱟ." },
  { code: "mni", name: "Manipuri", native: "ꯃꯤꯇꯩꯂꯣꯟ", greeting: "খুরুমজরি! ঐহাক্না স্বর্গনি।" },
  { code: "brx", name: "Bodo", native: "बर'", greeting: "खुलुमबाइ! आं स्वर्ग।" },
  { code: "tcy", name: "Tulu", native: "ತುಳು", greeting: "ನಮಸ್ಕಾರ! ಯಾನ್ ಸ್ವರ್ಗ." },
  { code: "raj", name: "Rajasthani", native: "राजस्थानी", greeting: "खम्मा घणी! म्हैं स्वर्ग हूँ।" },
  { code: "mag", name: "Magahi", native: "मगही", greeting: "प्रणाम! हम स्वर्ग हियै।" },
  { code: "awa", name: "Awadhi", native: "अवधी", greeting: "प्रणाम! हम स्वर्ग अहइ।" },
  { code: "gom", name: "Marwari", native: "मारवाड़ी", greeting: "राम राम! म्हैं स्वर्ग हूँ।" },
  { code: "en", name: "English", native: "English", greeting: "Hello! I am Svarga." },
  { code: "en-IN", name: "Hinglish", native: "Hinglish", greeting: "Hi! Main Svarga hoon." },
  { code: "ar", name: "Arabic", native: "العربية", greeting: "مرحبا! أنا سفارغا." },
  { code: "fr", name: "French", native: "Français", greeting: "Bonjour ! Je suis Svarga." },
  { code: "es", name: "Spanish", native: "Español", greeting: "¡Hola! Soy Svarga." },
  { code: "de", name: "German", native: "Deutsch", greeting: "Hallo! Ich bin Svarga." },
  { code: "pt", name: "Portuguese", native: "Português", greeting: "Olá! Eu sou Svarga." },
  { code: "ru", name: "Russian", native: "Русский", greeting: "Здравствуйте! Я Сварга." },
  { code: "zh", name: "Chinese", native: "中文", greeting: "你好！我是斯瓦尔加。" },
  { code: "ja", name: "Japanese", native: "日本語", greeting: "こんにちは！スワルガです。" },
  { code: "sw", name: "Swahili", native: "Kiswahili", greeting: "Habari! Mimi ni Svarga." },
];

const FEATURES = [
  "Answers in your language, not a translation of English",
  "Government schemes, farming, exams and money — explained locally",
  "Voice input and read-aloud replies",
  "Your documents searched in the same language",
];

export function LanguageSelector() {
  const [active, setActive] = useState<Language>(LANGUAGES[0]!);
  const prompts = active.prompts ?? [
    `Ask anything in ${active.native} — Svarga replies in ${active.native}.`,
    "Explain a government scheme step by step.",
    "Help me write an application letter.",
  ];

  return (
    <section id="languages" className="border-t border-ink/10 bg-cream py-20">
      <div className="mx-auto max-w-5xl px-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-ink/40">
          39 languages · one intelligence
        </p>
        <h2 className="mt-3 font-display text-3xl text-ink sm:text-4xl">
          Svarga speaks the language you think in
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink/70">
          Pick a language to see how Svarga greets you and what you can ask. Bharat first — and the
          world after.
        </p>

        <div className="mt-8 flex flex-wrap gap-2">
          {LANGUAGES.map((language) => (
            <button
              key={language.code}
              type="button"
              onClick={() => setActive(language)}
              aria-pressed={active.code === language.code}
              className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                active.code === language.code
                  ? "border-saffron bg-saffron/15 text-ink"
                  : "border-ink/10 text-ink/60 hover:border-saffron/60 hover:text-ink"
              }`}
            >
              {language.native}
            </button>
          ))}
        </div>

        <div className="mt-8 grid gap-6 rounded-3xl border border-ink/10 bg-white p-6 sm:p-8 lg:grid-cols-2">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink/40">
              {active.name}
            </p>
            <p className="mt-3 font-display text-2xl leading-snug text-ink">{active.greeting}</p>
            <ul className="mt-5 space-y-2">
              {prompts.map((prompt) => (
                <li
                  key={prompt}
                  className="rounded-xl border border-ink/10 px-3 py-2 text-sm text-ink/75"
                >
                  {prompt}
                </li>
              ))}
            </ul>
            <Link
              to="/chat"
              className="mt-6 inline-flex rounded-full bg-crimson px-5 py-2.5 text-sm text-cream transition-opacity hover:opacity-90"
            >
              Chat in {active.native}
            </Link>
          </div>
          <ul className="space-y-3 border-ink/10 lg:border-l lg:pl-8">
            {FEATURES.map((feature) => (
              <li key={feature} className="flex gap-3 text-sm text-ink/75">
                <span className="mt-1 size-1.5 shrink-0 rounded-full bg-saffron" />
                {feature}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
