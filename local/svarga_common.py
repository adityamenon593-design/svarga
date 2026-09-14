"""Shared helpers for the Svarga local stack.

Owned exclusively by Aditya Mohan Menon. Not for redistribution.
"""

from __future__ import annotations

import os
import re
from pathlib import Path

from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parent
PROJECT_ROOT = ROOT.parent
DATA_DIR = ROOT / "data"
DATA_DIR.mkdir(exist_ok=True)

load_dotenv(ROOT / ".env.local")


def env(name: str, default: str | None = None) -> str:
    value = os.environ.get(name, default)
    if value is None or value == "":
        raise SystemExit(
            f"Missing {name}. Copy local/.env.local.example to local/.env.local and fill it in."
        )
    return value


def load_system_prompt() -> str:
    """Read the live Svarga voice straight out of the website config.

    One source of truth: if the site's prompt changes, the local model follows.
    """
    config = (PROJECT_ROOT / "src" / "lib" / "ai" / "config.ts").read_text(encoding="utf-8")
    match = re.search(r"export const SYSTEM_PROMPT = `(.*?)`;", config, re.S)
    if not match:
        raise SystemExit("Could not find SYSTEM_PROMPT in src/lib/ai/config.ts")
    text = match.group(1)
    # Strip TS template interpolations; they are cosmetic for local use.
    text = re.sub(r"\$\{[^}]*\}", "", text)
    return text.replace("\\`", "`").strip()


def supabase_client():
    from supabase import create_client

    return create_client(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"))
