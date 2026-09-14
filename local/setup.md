# Svarga on your laptop — setup

Machine this is written for: Lenovo IdeaPad Gaming 3 · Ryzen 5 6600H · 16GB RAM · RTX 3050 4GB.

Owned exclusively by Aditya Mohan Menon. Nothing here may be redistributed or relicensed
without his written permission.

---

## What the 4GB card can and cannot do

First principles: a model's weights must fit in VRAM to run fast, and training needs
roughly three to four times the weights in extra memory for gradients and optimiser state.

| Task | 4GB VRAM verdict |
|---|---|
| Run a 3B model, 4-bit | Yes, comfortably (~2.2GB) |
| Run an 8B model, 4-bit | Runs, but slow — spills to CPU RAM |
| Train a LoRA adapter on 1B–3B, 4-bit | Yes — overnight |
| Train a LoRA adapter on 8B | No |
| Full fine-tune anything | No |

So: this laptop is your **training and experiment machine**. Customers keep being served
by the cloud model on svarga.digital.

On the data question — the corpora OpenAI or Google train on are proprietary and not
obtainable, legally or otherwise. What makes a model *yours* is not their data; it is
your data: consented Svarga conversations, your document library, and openly licensed
Indic and Vedic corpora. That combination is also the only defensible one.

---

## 1. Install (once)

1. **NVIDIA driver** — latest Game Ready or Studio driver, then reboot. Check with `nvidia-smi`.
2. **Python 3.11** — from python.org, tick "Add to PATH".
3. **Ollama** — https://ollama.com/download, then in a terminal:
   ```
   ollama pull llama3.2:3b-instruct-q4_K_M
   ollama run llama3.2:3b-instruct-q4_K_M "namaste"
   ```
4. **Python packages**:
   ```
   pip install torch --index-url https://download.pytorch.org/whl/cu121
   pip install -r local/requirements.txt
   ```
5. **Credentials** — copy `local/.env.local.example` to `local/.env.local` and fill it in.
   That file is gitignored; never commit it.

---

## 2. Talk to your local Svarga

```
python local/bridge.py
```

This loads the live Svarga system prompt from `src/lib/ai/config.ts`, pulls your
remembered items and searches your document library, then answers entirely offline.

---

## 3. Build the dataset

```
python local/build_dataset.py --min-answer 120
```

Writes `local/data/svarga-corpus.jsonl`. Sources:

- Consented Svarga conversations only (same consent + PII rules as the website)
- Any openly licensed JSONL you drop into `local/data/extra/` as
  `{"instruction": "...", "output": "..."}` per line

Good open sources to start with (check each licence before commercial use):
`ai4bharat/indic-instruct-data`, `sarvamai` public sets, Wikipedia dumps,
public-domain Gita and Upaniṣad translations, `databricks/databricks-dolly-15k`.

**Read 50 examples by hand before training.** The dataset is the product; the training
run is the cheap part. Below ~1,000 examples an adapter mostly learns noise.

---

## 4. Train the adapter

```
python local/train_lora.py --epochs 2
```

QLoRA, rank 16, 4-bit base, batch 1 × 16 accumulation, gradient checkpointing,
1024-token sequences. Close Chrome first — you need the VRAM. Output lands in
`local/adapters/svarga-lora`.

---

## 5. Serve what you trained

```
python local/export_gguf.py
```

Merges the adapter into the base and prints the exact llama.cpp conversion and
`ollama create svarga` commands. After that, set `LOCAL_MODEL=svarga` in
`local/.env.local` and run `bridge.py` again — you are now talking to a model
carrying your data.

---

## 6. Run the website against your model (optional)

In your local `.env`:

```
SVARGA_LOCAL_MODEL_URL=http://localhost:11434/v1
SVARGA_LOCAL_MODEL=svarga
```

`src/lib/ai/orchestrator.ts` switches to the local model when that URL is set:
plain chat calls, no cloud reasoning options, fewer tool steps (small models loop).
Unset it and everything returns to normal. **Never set these in production** —
svarga.digital must keep using the cloud model.

---

## Honest evaluation

Before you claim anything publicly: run 30 real questions through both the cloud
Svarga and your local adapter, score them side by side, and keep the notes. A 3B
adapter will not beat a frontier model on general reasoning. What it can win on is
Svarga's voice, Indian context and your own documents — which is a real, ownable
advantage, and the honest thing to say to investors.
