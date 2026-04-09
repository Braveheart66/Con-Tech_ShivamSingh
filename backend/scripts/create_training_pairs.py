from __future__ import annotations

import json
from pathlib import Path
from typing import Any


BASE_DIR = Path(__file__).resolve().parents[1]
CLAUSES_PATH = BASE_DIR / "data" / "processed" / "clauses.jsonl"
TRAIN_DIR = BASE_DIR / "data" / "training"
MANUAL_PAIRS_PATH = TRAIN_DIR / "manual_pairs.jsonl"

INSTRUCTION = (
    "Simplify this Indian rental agreement clause into plain English "
    "in one sentence."
)


def log(message: str) -> None:
    print(f"[pairs] {message}")


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


def main() -> None:
    TRAIN_DIR.mkdir(parents=True, exist_ok=True)

    clause_rows = read_jsonl(CLAUSES_PATH)
    if not clause_rows:
        log(f"No clause records found at {CLAUSES_PATH}")
        return

    existing_rows = read_jsonl(MANUAL_PAIRS_PATH)
    existing_output_by_id = {
        str(row.get("id", "")): str(row.get("output", ""))
        for row in existing_rows
        if str(row.get("id", "")).strip()
    }
    existing_output_by_input = {
        str(row.get("input", "")).strip(): str(row.get("output", ""))
        for row in existing_rows
        if str(row.get("input", "")).strip()
    }

    output_rows: list[dict[str, Any]] = []
    seen_ids: set[str] = set()
    seen_inputs: set[str] = set()

    for row in clause_rows:
        clause_text = str(row.get("clause", ""))
        row_id = str(row.get("id", ""))
        preserved_output = existing_output_by_id.get(
            row_id,
            existing_output_by_input.get(clause_text, ""),
        )

        output_rows.append(
            {
                "id": row_id,
                "source_url": row.get("source_url", ""),
                "instruction": INSTRUCTION,
                "input": clause_text,
                "output": preserved_output,
            }
        )
        seen_ids.add(row_id)
        seen_inputs.add(clause_text.strip())

    # Keep prior labeled rows that are not part of current clause extraction.
    for row in existing_rows:
        existing_output = str(row.get("output", "")).strip()
        if not existing_output:
            continue

        row_id = str(row.get("id", ""))
        clause_text = str(row.get("input", "")).strip()
        if row_id in seen_ids or clause_text in seen_inputs:
            continue

        output_rows.append(
            {
                "id": row_id,
                "source_url": row.get("source_url", "user_provided"),
                "instruction": row.get("instruction", INSTRUCTION),
                "input": clause_text,
                "output": existing_output,
            }
        )

    write_jsonl(MANUAL_PAIRS_PATH, output_rows)
    log(f"Input clauses: {len(clause_rows)}")
    log(f"Manual labeling rows: {len(output_rows)}")
    log(f"Wrote manual pairs to {MANUAL_PAIRS_PATH}")


if __name__ == "__main__":
    main()
