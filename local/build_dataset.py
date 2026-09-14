"""Build the Svarga training dataset on this laptop.

Sources, in order of value:
  1. Consented Svarga conversations (owner-only, PII-scrubbed, same rules as the site)
  2. Openly licensed instruction data you drop into local/data/extra/*.jsonl
  3. Your own document library, turned into question/answer style study pairs

Writes local/data/svarga-corpus.jsonl — review it by hand before training.

    python local/build_dataset.py --min-answer 120

Owned exclusively by Aditya Mohan Menon. Not for redistribution.
"""

from __future__ import annotations

import argparse
import json
import re

from svarga_common import DATA_DIR, env, supabase_client

PII = re.compile(
    r"(\+?\d[\d\s-]{8,}\d|[\w.+-]+@[\w-]+\.[\w.]+|\b\d{4}\s?\d{4}\s?\d{4}\b|\b[A-Z]{5}\d{4}[A-Z]\b)"
)


def consented_pairs(sb, limit: int, min_answer: int) -> list[dict]:
    """Same contract as exportTrainingCorpus on the site: consent only, drop anything
    that contained personal data rather than patching it."""
    consented = (
        sb.table("user_settings").select("user_id").eq("training_consent", True).execute().data
        or []
    )
    ids = [r["user_id"] for r in consented]
    if not ids:
        print("No accounts have switched training consent on — skipping conversation data.")
        return []

    rows = (
        sb.table("messages")
        .select("conversation_id, role, content, created_at")
        .in_("user_id", ids)
        .order("created_at")
        .limit(limit)
        .execute()
        .data
        or []
    )

    pending: dict[str, str] = {}
    pairs: list[dict] = []
    for row in rows:
        if row["role"] == "user":
            pending[row["conversation_id"]] = row["content"]
            continue
        if row["role"] != "assistant":
            continue
        prompt = pending.pop(row["conversation_id"], None)
        if not prompt:
            continue
        answer = row["content"]
        if PII.search(prompt) or PII.search(answer):
            continue
        if len(prompt.strip()) < 8 or len(answer.strip()) < min_answer:
            continue
        pairs.append({"instruction": prompt.strip(), "output": answer.strip()})

    print(f"{len(pairs)} consented conversation pairs from {len(ids)} accounts.")
    return pairs


def extra_pairs() -> list[dict]:
    """Svarga's own committed seed set, plus any openly licensed files you add."""
    from svarga_common import ROOT

    folders = [ROOT / "seed", DATA_DIR / "extra"]
    out: list[dict] = []
    for folder in folders:
        folder.mkdir(exist_ok=True)
        for path in sorted(folder.glob("*.jsonl")):
            for line in path.read_text(encoding="utf-8").splitlines():
                line = line.strip()
                if not line:
                    continue
                try:
                    item = json.loads(line)
                except json.JSONDecodeError:
                    continue
                if item.get("instruction") and item.get("output"):
                    out.append(
                        {
                            "instruction": item["instruction"].strip(),
                            "output": item["output"].strip(),
                        }
                    )
    print(f"{len(out)} pairs from the Svarga seed set and local/data/extra/.")
    return out



def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=20000)
    parser.add_argument("--min-answer", type=int, default=120)
    args = parser.parse_args()

    sb = supabase_client()
    env("SVARGA_OWNER_USER_ID")  # fail early if the env file is incomplete

    pairs = consented_pairs(sb, args.limit, args.min_answer) + extra_pairs()

    seen: set[str] = set()
    unique: list[dict] = []
    for pair in pairs:
        key = pair["instruction"].lower()[:200]
        if key in seen:
            continue
        seen.add(key)
        unique.append(pair)

    out = DATA_DIR / "svarga-corpus.jsonl"
    out.write_text(
        "\n".join(json.dumps(p, ensure_ascii=False) for p in unique) + "\n", encoding="utf-8"
    )
    print(f"\nWrote {len(unique)} examples to {out}")
    if len(unique) < 1000:
        print("Under 1,000 examples the adapter mostly learns noise. Gather more before training.")
    print("Read a random 50 by hand before you train. The dataset is the product.")


if __name__ == "__main__":
    main()
