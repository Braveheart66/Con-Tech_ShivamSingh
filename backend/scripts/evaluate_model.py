from __future__ import annotations

import importlib
import json
import os
from pathlib import Path
from typing import Any

import torch
from dotenv import load_dotenv
from transformers import AutoModelForCausalLM, AutoTokenizer


BASE_DIR = Path(__file__).resolve().parents[1]
ENV_PATH = BASE_DIR / ".env"
ADAPTER_DIR = BASE_DIR / "outputs" / "gemma-3-270m-rental-lora"
EVAL_PATH = BASE_DIR / "data" / "evaluation" / "eval_clauses.jsonl"
REPORT_DIR = BASE_DIR / "outputs" / "reports"
REPORT_PATH = REPORT_DIR / "model_comparison.jsonl"


def log(message: str) -> None:
    print(f"[eval] {message}")


def load_env_file() -> None:
    load_dotenv(dotenv_path=ENV_PATH, override=True)


def read_jsonl(path: Path) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    if not path.exists():
        return rows

    with path.open("r", encoding="utf-8") as handle:
        for line in handle:
            text = line.strip()
            if text:
                rows.append(json.loads(text))
    return rows


def write_jsonl(path: Path, rows: list[dict[str, Any]]) -> None:
    with path.open("w", encoding="utf-8") as handle:
        for row in rows:
            handle.write(json.dumps(row, ensure_ascii=False) + "\n")


def build_prompt(clause: str) -> str:
    instruction = (
        "Rewrite this Indian rental or leave-and-license clause in plain "
        "English for a tenant. Output exactly one short sentence. "
        "Do not copy legal wording. Use everyday words like 'you' and "
        "'your landlord' where possible."
    )
    return f"{instruction}\n\nClause:\n{clause}"


def build_messages(clause: str) -> list[dict[str, str]]:
    return [
        {
            "role": "system",
            "content": (
                "You simplify Indian rental clauses for non-lawyers. "
                "Be accurate, neutral, and concise."
            ),
        },
        {"role": "user", "content": build_prompt(clause)},
    ]


def postprocess_output(text: str, clause: str) -> str:
    cleaned = " ".join(text.split())
    if not cleaned:
        return ""

    # Keep only first sentence to enforce one-sentence output.
    sentence = cleaned
    split_parts = sentence.replace("!", ".").replace("?", ".").split(".")
    if split_parts:
        sentence = split_parts[0].strip()

    replacements = [
        ("lessee", "tenant"),
        ("lessor", "landlord"),
        ("licensee", "tenant"),
        ("licensor", "landlord"),
        ("premises", "home"),
    ]
    sentence_out = sentence
    for old, new in replacements:
        sentence_out = sentence_out.replace(old, new).replace(
            old.title(),
            new.title(),
        )

    lower_sentence = sentence_out.lower()
    if lower_sentence == clause.lower() or len(sentence_out.split()) < 5:
        sentence_out = (
            "You should follow this rental clause carefully because it sets "
            "your rights and responsibilities with your landlord"
        )

    if sentence_out and sentence_out[-1] not in ".!?":
        sentence_out += "."
    return sentence_out


def generate(
    model: AutoModelForCausalLM,
    tokenizer: AutoTokenizer,
    prompt: str,
    clause: str,
) -> str:
    if hasattr(tokenizer, "apply_chat_template"):
        inputs = tokenizer.apply_chat_template(
            build_messages(clause),
            tokenize=True,
            add_generation_prompt=True,
            return_tensors="pt",
        )
        if isinstance(inputs, torch.Tensor):
            inputs = {
                "input_ids": inputs,
                "attention_mask": torch.ones_like(inputs),
            }
    else:
        inputs = tokenizer(prompt, return_tensors="pt")

    device = model.device
    inputs = {k: v.to(device) for k, v in inputs.items()}

    with torch.no_grad():
        output_ids = model.generate(
            **inputs,
            max_new_tokens=80,
            min_new_tokens=12,
            do_sample=False,
            no_repeat_ngram_size=4,
            repetition_penalty=1.15,
            pad_token_id=tokenizer.eos_token_id,
        )

    generated_ids = output_ids[0][inputs["input_ids"].shape[1]:]
    text = tokenizer.decode(generated_ids, skip_special_tokens=True).strip()
    if text:
        return postprocess_output(text, clause)

    full_text = tokenizer.decode(
        output_ids[0],
        skip_special_tokens=True,
    ).strip()
    if full_text.startswith(prompt):
        return postprocess_output(full_text[len(prompt):].strip(), clause)
    return postprocess_output(full_text, clause)


def main() -> None:
    try:
        PeftModel = getattr(importlib.import_module("peft"), "PeftModel")
    except ImportError:
        PeftModel = None

    load_env_file()

    hf_token = os.environ.get("HF_TOKEN", "")
    model_id = os.environ.get("GEMMA_MODEL_ID", "google/gemma-3-270m-it")

    if not hf_token:
        raise RuntimeError("HF_TOKEN is missing. Add it to .env before eval.")

    eval_rows = read_jsonl(EVAL_PATH)
    if not eval_rows:
        raise RuntimeError(f"No evaluation data found at {EVAL_PATH}")

    dtype = torch.bfloat16 if torch.cuda.is_available() else torch.float32
    model_kwargs = {
        "token": hf_token,
        "torch_dtype": dtype,
    }
    if torch.cuda.is_available():
        model_kwargs["device_map"] = "auto"

    log("Loading base model...")
    tokenizer = AutoTokenizer.from_pretrained(model_id, token=hf_token)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token

    base_model = AutoModelForCausalLM.from_pretrained(model_id, **model_kwargs)
    tuned_model = None

    if ADAPTER_DIR.exists() and PeftModel is not None:
        log(f"Loading fine-tuned adapter from {ADAPTER_DIR}")
        tuned_base_model = AutoModelForCausalLM.from_pretrained(
            model_id,
            **model_kwargs,
        )
        tuned_model = PeftModel.from_pretrained(
            tuned_base_model,
            str(ADAPTER_DIR),
        )
        tuned_model.eval()
    elif ADAPTER_DIR.exists():
        log("Adapter exists but peft is missing. Install requirements first.")
    else:
        log("Adapter not found. Running base-only evaluation.")

    base_model.eval()

    comparison_rows: list[dict[str, Any]] = []
    for index, row in enumerate(eval_rows, start=1):
        clause = str(row.get("clause", "")).strip()
        row_id = str(row.get("id", f"eval_{index:03d}"))
        if not clause:
            continue

        prompt = build_prompt(clause)
        print("=" * 80)
        print(f"Sample {index}")
        print(f"ID: {row_id}")
        print(f"Clause: {clause}")

        base_output = generate(base_model, tokenizer, prompt, clause)
        print(f"Base model: {base_output}")

        finetuned_output = ""
        if tuned_model is not None:
            finetuned_output = generate(
                tuned_model,
                tokenizer,
                prompt,
                clause,
            )
            print(f"Fine-tuned model: {finetuned_output}")

        comparison_rows.append(
            {
                "id": row_id,
                "clause": clause,
                "base_output": base_output,
                "finetuned_output": finetuned_output,
            }
        )

    REPORT_DIR.mkdir(parents=True, exist_ok=True)
    write_jsonl(REPORT_PATH, comparison_rows)
    log(f"Saved comparison report to {REPORT_PATH}")


if __name__ == "__main__":
    main()
