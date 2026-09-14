"""Merge the Svarga adapter into the base model and register it with Ollama.

    python local/export_gguf.py

Produces local/adapters/svarga-merged (HF format) and writes an Ollama Modelfile.
Converting to GGUF needs llama.cpp's convert script — the exact command is
printed at the end so you can run it against your llama.cpp checkout.

Owned exclusively by Aditya Mohan Menon. Not for redistribution.
"""

from __future__ import annotations

from svarga_common import ROOT, env, load_system_prompt


def main() -> None:
    import torch
    from peft import PeftModel
    from transformers import AutoModelForCausalLM, AutoTokenizer

    adapter = ROOT / "adapters" / "svarga-lora"
    if not adapter.exists():
        raise SystemExit("No adapter found. Run local/train_lora.py first.")

    base = env("BASE_MODEL", "unsloth/Llama-3.2-3B-Instruct-bnb-4bit").replace("-bnb-4bit", "")
    merged = ROOT / "adapters" / "svarga-merged"

    print(f"Merging {adapter.name} into {base} (needs ~8GB RAM, runs on CPU)…")
    model = AutoModelForCausalLM.from_pretrained(base, torch_dtype=torch.float16, device_map="cpu")
    model = PeftModel.from_pretrained(model, str(adapter)).merge_and_unload()
    model.save_pretrained(str(merged), safe_serialization=True)
    AutoTokenizer.from_pretrained(base).save_pretrained(str(merged))

    system = load_system_prompt().replace('"""', "'''")[:6000]
    modelfile = ROOT / "adapters" / "Modelfile"
    modelfile.write_text(
        f'FROM ./svarga.gguf\nPARAMETER temperature 0.6\nPARAMETER num_ctx 4096\nSYSTEM """{system}"""\n',
        encoding="utf-8",
    )

    print(f"\nMerged model: {merged}")
    print("\nNow convert and register (from your llama.cpp checkout):")
    print(f"  python convert_hf_to_gguf.py {merged} --outfile {ROOT / 'adapters' / 'svarga.gguf'}")
    print(f"  llama-quantize {ROOT / 'adapters' / 'svarga.gguf'} svarga-q4.gguf Q4_K_M")
    print(f"  ollama create svarga -f {modelfile}")
    print("\nThen set LOCAL_MODEL=svarga in local/.env.local and run local/bridge.py.")


if __name__ == "__main__":
    main()
