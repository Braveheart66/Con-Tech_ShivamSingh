from __future__ import annotations

import json
from pathlib import Path
from typing import Any


BASE_DIR = Path(__file__).resolve().parents[1]
MANUAL_PAIRS_PATH = BASE_DIR / "data" / "training" / "manual_pairs.jsonl"
TRAIN_SFT_PATH = BASE_DIR / "data" / "training" / "train_sft.jsonl"


def log(message: str) -> None:
    print(f"[prepare] {message}")


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


def to_sft_record(row: dict[str, Any]) -> dict[str, Any]:
    instruction = str(row.get("instruction", "")).strip()
    clause = str(row.get("input", "")).strip()
    output = str(row.get("output", "")).strip()

    user_text = f"{instruction}\n\nClause:\n{clause}"
    return {
        "messages": [
            {"role": "user", "content": user_text},
            {"role": "assistant", "content": output},
        ]
    }


def main() -> None:
    rows = read_jsonl(MANUAL_PAIRS_PATH)
    if not rows:
        log(f"No manual pairs found at {MANUAL_PAIRS_PATH}")
        return

    kept_rows: list[dict[str, Any]] = []
    skipped = 0
    for row in rows:
        output = str(row.get("output", "")).strip()
        if not output:
            skipped += 1
            continue
        kept_rows.append(to_sft_record(row))

    write_jsonl(TRAIN_SFT_PATH, kept_rows)
    log(f"Input manual rows: {len(rows)}")
    log(f"Skipped empty outputs: {skipped}")
    log(f"Prepared SFT rows: {len(kept_rows)}")
    log(f"Wrote SFT dataset to {TRAIN_SFT_PATH}")


if __name__ == "__main__":
    main()
