"""Train a Svarga LoRA adapter on a 4GB laptop GPU (RTX 3050).

    python local/train_lora.py --epochs 2

Tuned hard for 4GB: 4-bit base, batch size 1, gradient accumulation,
gradient checkpointing, 1024-token sequences. Expect an overnight run.

Owned exclusively by Aditya Mohan Menon. Not for redistribution.
"""

from __future__ import annotations

import argparse

from svarga_common import DATA_DIR, ROOT, env, load_system_prompt


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--epochs", type=float, default=2.0)
    parser.add_argument("--seq-len", type=int, default=1024)
    parser.add_argument("--lr", type=float, default=2e-4)
    args = parser.parse_args()

    import torch
    from datasets import load_dataset
    from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training
    from transformers import (
        AutoModelForCausalLM,
        AutoTokenizer,
        BitsAndBytesConfig,
        TrainingArguments,
    )
    from trl import SFTTrainer

    if not torch.cuda.is_available():
        raise SystemExit("No CUDA GPU detected. Install the NVIDIA driver + CUDA build of PyTorch.")

    corpus = DATA_DIR / "svarga-corpus.jsonl"
    if not corpus.exists():
        raise SystemExit("Run local/build_dataset.py first.")

    base = env("BASE_MODEL", "unsloth/Llama-3.2-3B-Instruct-bnb-4bit")
    system = load_system_prompt()[:4000]

    tokenizer = AutoTokenizer.from_pretrained(base)
    tokenizer.pad_token = tokenizer.pad_token or tokenizer.eos_token

    model = AutoModelForCausalLM.from_pretrained(
        base,
        quantization_config=BitsAndBytesConfig(
            load_in_4bit=True,
            bnb_4bit_quant_type="nf4",
            bnb_4bit_compute_dtype=torch.float16,
            bnb_4bit_use_double_quant=True,
        ),
        device_map={"": 0},
    )
    model = prepare_model_for_kbit_training(model, use_gradient_checkpointing=True)
    model = get_peft_model(
        model,
        LoraConfig(
            r=16,
            lora_alpha=32,
            lora_dropout=0.05,
            bias="none",
            task_type="CAUSAL_LM",
            target_modules=[
                "q_proj",
                "k_proj",
                "v_proj",
                "o_proj",
                "gate_proj",
                "up_proj",
                "down_proj",
            ],
        ),
    )
    model.print_trainable_parameters()

    dataset = load_dataset("json", data_files=str(corpus), split="train")

    def to_text(row: dict) -> dict:
        # Every example carries the Svarga voice, so the adapter learns tone as well as content.
        return {
            "text": tokenizer.apply_chat_template(
                [
                    {"role": "system", "content": system},
                    {"role": "user", "content": row["instruction"]},
                    {"role": "assistant", "content": row["output"]},
                ],
                tokenize=False,
            )
        }

    dataset = dataset.map(to_text, remove_columns=dataset.column_names)

    out_dir = ROOT / "adapters" / "svarga-lora"
    trainer = SFTTrainer(
        model=model,
        tokenizer=tokenizer,
        train_dataset=dataset,
        dataset_text_field="text",
        max_seq_length=args.seq_len,
        args=TrainingArguments(
            output_dir=str(out_dir),
            per_device_train_batch_size=1,
            gradient_accumulation_steps=16,
            gradient_checkpointing=True,
            num_train_epochs=args.epochs,
            learning_rate=args.lr,
            lr_scheduler_type="cosine",
            warmup_ratio=0.03,
            fp16=True,
            optim="paged_adamw_8bit",
            logging_steps=10,
            save_strategy="epoch",
            report_to=[],
        ),
    )
    trainer.train()
    trainer.model.save_pretrained(str(out_dir))
    tokenizer.save_pretrained(str(out_dir))
    print(f"\nAdapter saved to {out_dir}. Next: python local/export_gguf.py")


if __name__ == "__main__":
    main()
