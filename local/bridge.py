"""Svarga local bridge — talk to your own model, with Svarga's brain.

Pulls the live Svarga system prompt, your remembered items and your document
library out of the Svarga database, then answers with a model running on this
laptop through Ollama. No cloud model is called.

    python local/bridge.py

Owned exclusively by Aditya Mohan Menon. Not for redistribution.
"""

from __future__ import annotations

import sys

import requests

from svarga_common import env, load_system_prompt, supabase_client

OLLAMA = env("OLLAMA_URL", "http://localhost:11434").rstrip("/")
MODEL = env("LOCAL_MODEL", "llama3.2:3b-instruct-q4_K_M")


def load_memory(sb, user_id: str) -> list[str]:
    rows = (
        sb.table("user_memory")
        .select("kind, content")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .limit(40)
        .execute()
        .data
        or []
    )
    return [f"{r['kind']}: {r['content']}" for r in rows]


def search_library(sb, user_id: str, query: str, limit: int = 4) -> list[tuple[str, str]]:
    """Keyword search over the user's own document chunks.

    Deliberately keyword-based, not vector-based: embeddings would mean calling
    out to a cloud service, and this stack is meant to run offline.
    """
    terms = [w for w in query.lower().split() if len(w) > 3][:4]
    if not terms:
        return []
    rows = (
        sb.table("document_chunks")
        .select("content, documents!inner(title, user_id)")
        .eq("documents.user_id", user_id)
        .or_(",".join(f"content.ilike.%{t}%" for t in terms))
        .limit(limit)
        .execute()
        .data
        or []
    )
    return [(r.get("documents", {}).get("title", "Document"), r["content"]) for r in rows]


def ask(messages: list[dict]) -> str:
    response = requests.post(
        f"{OLLAMA}/api/chat",
        json={"model": MODEL, "messages": messages, "stream": True},
        stream=True,
        timeout=600,
    )
    response.raise_for_status()
    parts: list[str] = []
    import json as _json

    for line in response.iter_lines():
        if not line:
            continue
        chunk = _json.loads(line)
        piece = chunk.get("message", {}).get("content", "")
        if piece:
            parts.append(piece)
            sys.stdout.write(piece)
            sys.stdout.flush()
    print()
    return "".join(parts)


def main() -> None:
    user_id = env("SVARGA_OWNER_USER_ID")
    sb = supabase_client()
    system = load_system_prompt()

    memory = load_memory(sb, user_id)
    if memory:
        system += "\n\nWhat you already know about this person:\n- " + "\n- ".join(memory)

    print(f"Svarga local — model: {MODEL}")
    print(f"Loaded {len(memory)} remembered items. Type 'exit' to leave.\n")

    history: list[dict] = [{"role": "system", "content": system}]

    while True:
        try:
            question = input("you > ").strip()
        except (EOFError, KeyboardInterrupt):
            print()
            return
        if not question or question.lower() in {"exit", "quit"}:
            return

        context_note = ""
        try:
            hits = search_library(sb, user_id, question)
            if hits:
                context_note = "\n\nFrom your library (cite the titles you use):\n" + "\n\n".join(
                    f"[{title}] {content[:1200]}" for title, content in hits
                )
        except Exception as exc:  # library search is a bonus, never a blocker
            print(f"(library unavailable: {exc})")

        history.append({"role": "user", "content": question + context_note})
        print("svarga > ", end="", flush=True)
        answer = ask(history)
        history.append({"role": "assistant", "content": answer})
        history = history[:1] + history[-12:]


if __name__ == "__main__":
    main()
