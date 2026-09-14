# Svarga on your laptop: local model + your own data

Goal: a real model running on your Lenovo IdeaPad (RTX 3050 4GB, 16GB RAM, Ryzen 5 6600H), trained on Svarga's own data, and talking to the Svarga database.

## First, the honest part

You asked to train it on "the best data ChatGPT/Astra trains on". That data is not public — it is proprietary, unlicensed for redistribution, and no one outside those labs can legally obtain it. What we *can* do, and what actually produces a good Indian model:

- Openly licensed datasets (Indic instruction sets, Wikipedia, open Gita/Vedic texts, open Q&A corpora)
- Your own consented Svarga conversations (already exportable)
- Your uploaded PDFs/EPUBs in the Library

On a 4GB graphics card the ceiling is real: you can **run** a 3B–4B model comfortably and **train an adapter** on a 1B–3B model. An 8B model will run slowly on CPU+GPU split; training an 8B locally is not possible. So the laptop becomes your training and experimentation machine, not the thing that serves customers.

## What gets built

**1. Local model runtime**
Ollama on Windows with a 3B instruct base (Llama 3.2 3B or Qwen 2.5 3B, 4-bit). One command to start, exposes a local API on port 11434.

**2. Local Svarga bridge**
A small script that gives the local model the same Svarga brain the website has:
- Pulls the Svarga system prompt (voice, Vedic grounding, safety rules) from the existing config
- Connects to the Svarga database read-only with your owner credentials
- Fetches your document-library chunks and your remembered memory items, and feeds them to the local model as context before it answers
- Runs as a terminal chat, so you can talk to your own Svarga offline

**3. Data pipeline to disk**
A script that calls the existing owner-only export, writes `data/svarga-corpus.jsonl` to your laptop, and merges it with openly licensed Indic/Vedic datasets into a single reviewed training file. Includes a manual review step — dataset quality is the whole game.

**4. Local training run**
A QLoRA adapter script tuned for 4GB VRAM: 1B–3B base, 4-bit, batch size 1, gradient accumulation, gradient checkpointing, sequence length 1024. Trains overnight on your card. Outputs an adapter you own outright.

**5. Serve what you trained**
Convert the adapter into a GGUF model file, register it with Ollama, and point the local bridge at it. At that point you are chatting with a model carrying your name and your data.

**6. Optional switch in the website**
An environment-controlled local-model mode: when you run the app on your laptop with the local runtime up, Svarga answers from your model instead of the cloud one. Off by default, so the live site is never affected.

## Technical notes

- New folder `local/` in the repo: `setup.md`, `bridge.py`, `build-dataset.py`, `train-lora.py`, `export-gguf.py`, `requirements.txt`
- Database access from the laptop uses a `.env.local` file you fill in — no credentials committed
- Training stack: PyTorch + CUDA 12, `unsloth`, `peft`, `trl`, `bitsandbytes`, `transformers`
- Base model choice is left configurable; default `unsloth/Llama-3.2-3B-Instruct-bnb-4bit`, with an Indic alternative noted. Licences are checked and recorded, since Svarga is all-rights-reserved
- Existing `exportTrainingCorpus` is reused unchanged — consent gating and PII stripping stay exactly as they are
- The published site keeps using the cloud model; nothing about launch changes

## What you do on your side

Install Python 3.11, the NVIDIA CUDA driver, and Ollama. The setup guide will list exact commands in order. Everything else is scripted.
