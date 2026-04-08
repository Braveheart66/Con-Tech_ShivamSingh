from __future__ import annotations

import json
import importlib
import os
from pathlib import Path

import torch
from dotenv import load_dotenv
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    BitsAndBytesConfig,
    TrainingArguments,
)


BASE_DIR = Path(__file__).resolve().parents[1]
SFT_PATH = BASE_DIR / "data" / "training" / "train_sft.jsonl"
OUTPUT_DIR = BASE_DIR / "outputs" / "gemma-3-270m-rental-lora"
ENV_PATH = BASE_DIR / ".env"


def log(message: str) -> None:
    print(f"[train] {message}")


def load_env_file() -> None:
    load_dotenv(dotenv_path=ENV_PATH, override=True)


def read_sft_texts(path: Path) -> list[str]:
    records: list[str] = []
    if not path.exists():
        return records

    with path.open("r", encoding="utf-8") as handle:
        for line in handle:
            text = line.strip()
            if not text:
                continue

            row = json.loads(text)
            messages = row.get("messages", [])
            if len(messages) < 2:
                continue

            user_msg = str(messages[0].get("content", "")).strip()
            assistant_msg = str(messages[1].get("content", "")).strip()
            if not user_msg or not assistant_msg:
                continue

            records.append(
                json.dumps(
                    {
                        "messages": [
                            {"role": "user", "content": user_msg},
                            {
                                "role": "assistant",
                                "content": assistant_msg,
                            },
                        ]
                    },
                    ensure_ascii=False,
                )
            )

    return records


def build_quantization_config() -> BitsAndBytesConfig | None:
    if not torch.cuda.is_available():
        return None

    try:
        importlib.import_module("bitsandbytes")

        return BitsAndBytesConfig(
            load_in_4bit=True,
            bnb_4bit_use_double_quant=True,
            bnb_4bit_quant_type="nf4",
            bnb_4bit_compute_dtype=torch.bfloat16,
        )
    except Exception:
        return None


def main() -> None:
    try:
        datasets_module = importlib.import_module("datasets")
        Dataset = getattr(datasets_module, "Dataset")
        LoraConfig = getattr(importlib.import_module("peft"), "LoraConfig")
        SFTTrainer = getattr(importlib.import_module("trl"), "SFTTrainer")

        # Workaround for Python 3.14 and datasets fingerprint serialization.
        fingerprint_mod = importlib.import_module("datasets.fingerprint")
        arrow_dataset_mod = importlib.import_module("datasets.arrow_dataset")

        def _fixed_fingerprint(*args, **kwargs) -> str:
            return "py314-fixed-fingerprint"

        setattr(fingerprint_mod, "generate_fingerprint", _fixed_fingerprint)
        setattr(arrow_dataset_mod, "generate_fingerprint", _fixed_fingerprint)
    except ImportError as exc:
        raise RuntimeError(
            "Missing training dependencies. "
            "Run pip install -r requirements.txt"
        ) from exc

    load_env_file()
    os.environ.setdefault("HF_DATASETS_DISABLE_FINGERPRINTING", "1")

    hf_token = os.environ.get("HF_TOKEN", "")
    model_id = os.environ.get("GEMMA_MODEL_ID", "google/gemma-3-270m-it")

    if not hf_token:
        raise RuntimeError(
            "HF_TOKEN is missing. Add it to .env before training."
        )

    train_rows = read_sft_texts(SFT_PATH)
    if not train_rows:
        raise RuntimeError(
            "No train examples found. Fill manual outputs and run "
            "prepare_sft_dataset.py first."
        )

    log(f"Training samples: {len(train_rows)}")

    tokenizer = AutoTokenizer.from_pretrained(model_id, token=hf_token)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token

    def format_example(serialized: str) -> str:
        row = json.loads(serialized)
        messages = row["messages"]
        if hasattr(tokenizer, "apply_chat_template"):
            return tokenizer.apply_chat_template(
                messages,
                tokenize=False,
                add_generation_prompt=False,
            )

        user_text = messages[0]["content"]
        assistant_text = messages[1]["content"]
        return (
            "<start_of_turn>user\n"
            f"{user_text}\n"
            "<end_of_turn>\n"
            "<start_of_turn>model\n"
            f"{assistant_text}\n"
            "<end_of_turn>"
        )

    train_texts = [format_example(item) for item in train_rows]
    try:
        train_ds = Dataset.from_dict({"text": train_texts})
    except Exception:
        log(
            "Dataset fingerprint path failed, switching to pandas-backed "
            "dataset fallback."
        )
        try:
            import pandas as pd

            train_df = pd.DataFrame({"text": train_texts})
            train_ds = Dataset.from_pandas(train_df, preserve_index=False)
        except Exception as inner_exc:
            raise RuntimeError(
                "Unable to construct training dataset on this Python setup."
            ) from inner_exc

    quant_config = build_quantization_config()
    torch_dtype = (
        torch.bfloat16 if torch.cuda.is_available() else torch.float32
    )

    if not torch.cuda.is_available():
        log("Warning: CUDA is not available. Falling back to CPU training.")

    model_kwargs = {
        "token": hf_token,
        "torch_dtype": torch_dtype,
    }
    if quant_config is not None:
        model_kwargs["quantization_config"] = quant_config
        model_kwargs["device_map"] = "auto"

    log("Loading base model...")
    model = AutoModelForCausalLM.from_pretrained(model_id, **model_kwargs)

    peft_config = LoraConfig(
        r=16,
        lora_alpha=32,
        lora_dropout=0.05,
        bias="none",
        task_type="CAUSAL_LM",
    )

    training_args = TrainingArguments(
        output_dir=str(OUTPUT_DIR),
        per_device_train_batch_size=2,
        gradient_accumulation_steps=4,
        learning_rate=2e-4,
        num_train_epochs=3,
        logging_steps=10,
        save_steps=100,
        report_to="none",
        bf16=torch.cuda.is_available(),
        fp16=False,
        remove_unused_columns=False,
    )

    trainer = SFTTrainer(
        model=model,
        args=training_args,
        train_dataset=train_ds,
        peft_config=peft_config,
        processing_class=tokenizer,
        formatting_func=lambda example: example["text"],
    )

    log("Starting fine-tuning...")
    trainer.train()

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    trainer.model.save_pretrained(str(OUTPUT_DIR))
    tokenizer.save_pretrained(str(OUTPUT_DIR))
    log(f"Saved LoRA adapter and tokenizer to {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
