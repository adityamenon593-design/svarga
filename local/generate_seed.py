"""Generate a Svarga seed training set.

First principles: an adapter learns a *voice and a domain*, not facts it can't
verify. So the seed set is written to teach exactly what makes Svarga different
from a generic model — Indian context, honest Vedic grounding, Hinglish
code-switching, ₹/lakh/crore money sense, and Svarga's answer discipline.

Output: local/seed/svarga-seed.jsonl (committed — this is Svarga's own asset).
Generated with the Lovable AI gateway; reviewed by hand before training.

    python local/generate_seed.py --per-topic 10

Owned exclusively by Aditya Mohan Menon. Not for redistribution.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import time
from pathlib import Path

import requests

ROOT = Path(__file__).resolve().parent
OUT_DIR = ROOT / "seed"
OUT_DIR.mkdir(exist_ok=True)

GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions"
MODEL = os.environ.get("SEED_MODEL", "google/gemini-2.5-flash")

TOPICS = [
    "Indian personal finance: SIPs, PPF, NPS, tax regimes, home loans, EMI maths in ₹ lakh/crore",
    "Indian government schemes and paperwork: Aadhaar, PAN, GST, Udyam, MSME loans, PM schemes",
    "Bhagavad Gītā and Upaniṣads applied to real modern dilemmas, with verse references and honest caveats",
    "Jyotiṣa and Indian classical sciences explained accurately as tradition, never as prophecy or fear",
    "Āyurveda and Indian food/lifestyle, clearly separated from medical advice",
    "Indian farming, weather, crop prices, irrigation and kisan questions in plain language",
    "Indian students: JEE/NEET/UPSC/CA preparation strategy, college choices, study plans",
    "Indian small business and startup operations: pricing, GST invoices, hiring, cash flow",
    "Hinglish code-switching conversations where the user mixes Hindi and English naturally",
    "Indian languages, culture, festivals, cricket and cinema questions answered warmly",
    "Technology and coding help answered in Svarga's concise, answer-first style",
    "Emotional and life questions: stress, family pressure, career doubt — warm, grounded, non-preachy",
]

INSTRUCTION = """You are writing gold-standard training examples for Svarga, an Indian AI assistant.

Topic: {topic}

Write {n} diverse question/answer pairs. Rules for every answer:
- Lead with the answer in the first sentence. No preamble, no "great question".
- Concrete: real numbers, real names, exact steps. Use ₹, lakh/crore, IST, DD/MM/YYYY, km/kg/°C.
- Warm and direct, like a knowledgeable Indian friend. Never robotic, never flattering.
- Short answers for simple asks (2-4 lines); structured depth only where it's earned (max ~250 words).
- Say plainly when something is uncertain, traditional-but-unproven, or needs a professional.
- Never predict the future, never give medical/legal rulings, never take a political or religious side.
- Questions must be realistic — how actual Indian users type, including some Hinglish and some typos.

Return ONLY a JSON array: [{{"instruction": "...", "output": "..."}}, ...]"""


def generate(topic: str, n: int) -> list[dict]:
    key = os.environ["LOVABLE_API_KEY"]
    response = requests.post(
        GATEWAY,
        headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
        json={
            "model": MODEL,
            "messages": [{"role": "user", "content": INSTRUCTION.format(topic=topic, n=n)}],
        },
        timeout=300,
    )
    if response.status_code != 200:
        print(f"  [{response.status_code}] {response.text[:200]}")
        return []
    text = response.json()["choices"][0]["message"]["content"]
    match = re.search(r"\[.*\]", text, re.S)
    if not match:
        return []
    try:
        items = json.loads(match.group(0))
    except json.JSONDecodeError:
        return []
    return [
        {"instruction": i["instruction"].strip(), "output": i["output"].strip()}
        for i in items
        if isinstance(i, dict) and i.get("instruction") and i.get("output")
    ]


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--per-topic", type=int, default=10)
    args = parser.parse_args()

    out = OUT_DIR / "svarga-seed.jsonl"
    existing = []
    if out.exists():
        existing = [json.loads(line) for line in out.read_text(encoding="utf-8").splitlines() if line.strip()]

    pairs = list(existing)
    for topic in TOPICS:
        print(f"→ {topic[:60]}…")
        got = generate(topic, args.per_topic)
        print(f"  {len(got)} pairs")
        pairs.extend(got)
        time.sleep(1)

    seen: set[str] = set()
    unique = []
    for pair in pairs:
        key = pair["instruction"].lower()[:160]
        if key in seen:
            continue
        seen.add(key)
        unique.append(pair)

    out.write_text(
        "\n".join(json.dumps(p, ensure_ascii=False) for p in unique) + "\n", encoding="utf-8"
    )
    print(f"\n{len(unique)} examples in {out}")


if __name__ == "__main__":
    main()
