from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any


BASE_DIR = Path(__file__).resolve().parents[1]
CLEANED_PATH = BASE_DIR / "data" / "cleaned" / "all_cleaned.jsonl"
CLAUSES_PATH = BASE_DIR / "data" / "processed" / "clauses.jsonl"

TARGET_TOTAL_CLAUSES = 260
MIN_SENTENCE_WORDS = 10
MAX_SENTENCE_WORDS = 55

LEGAL_SIGNAL_TERMS = {
    "tenant",
    "landlord",
    "lessee",
    "lessor",
    "licensee",
    "licensor",
    "rent",
    "agreement",
    "deposit",
    "maintenance",
    "notice",
    "termination",
    "utility",
    "charges",
    "sublet",
    "possession",
    "repair",
}

NOISE_HINTS = {
    "faq",
    "subscribe",
    "download",
    "template library",
    "author",
    "publisher",
}


def log(message: str) -> None:
    print(f"[expand-clauses] {message}")


def read_jsonl(path: Path) -> list[dict[str, Any]]:
    if not path.exists():
        return []
    with path.open("r", encoding="utf-8") as handle:
        return [json.loads(line) for line in handle if line.strip()]


def write_jsonl(path: Path, rows: list[dict[str, Any]]) -> None:
    with path.open("w", encoding="utf-8") as handle:
        for row in rows:
            handle.write(json.dumps(row, ensure_ascii=False) + "\n")


def normalize_signature(text: str) -> str:
    lowered = text.lower()
    lowered = re.sub(r"\s+", " ", lowered)
    lowered = re.sub(r"[^a-z0-9\s]", "", lowered)
    return lowered.strip()


def is_legal_sentence(text: str) -> bool:
    lowered = text.lower()
    if any(hint in lowered for hint in NOISE_HINTS):
        return False
    words = text.split()
    if not (MIN_SENTENCE_WORDS <= len(words) <= MAX_SENTENCE_WORDS):
        return False
    if not any(term in lowered for term in LEGAL_SIGNAL_TERMS):
        return False
    return True


def extract_candidate_sentences(text: str) -> list[str]:
    normalized = re.sub(r"\s+", " ", text).strip()
    if not normalized:
        return []

    parts = re.split(r"(?<=[.!?])\s+", normalized)
    candidates: list[str] = []
    for part in parts:
        sentence = part.strip()
        if not sentence:
            continue
        if is_legal_sentence(sentence):
            if sentence[-1] not in ".!?":
                sentence += "."
            candidates.append(sentence)
    return candidates


def main() -> None:
    clause_rows = read_jsonl(CLAUSES_PATH)
    cleaned_rows = read_jsonl(CLEANED_PATH)

    if not cleaned_rows:
        log(f"No cleaned rows found at {CLEANED_PATH}")
        return

    seen = {
        normalize_signature(str(row.get("clause", "")))
        for row in clause_rows
        if str(row.get("clause", "")).strip()
    }

    current_count = len(clause_rows)
    target = max(TARGET_TOTAL_CLAUSES, current_count)
    added = 0

    source_to_index: dict[str, int] = {}
    for row in clause_rows:
        source_id = str(row.get("id", "source_unknown")).split("_clause_")[0]
        idx = 0
        try:
            idx = int(str(row.get("id", "")).split("_clause_")[1])
        except Exception:
            idx = source_to_index.get(source_id, 0)
        source_to_index[source_id] = max(
            source_to_index.get(source_id, 0),
            idx,
        )

    for source in cleaned_rows:
        if len(clause_rows) >= target:
            break

        source_id = str(source.get("id", "source_unknown"))
        source_url = str(source.get("source_url", ""))
        title = str(source.get("title", ""))
        cleaned_text = str(source.get("cleaned_text", ""))

        for sentence in extract_candidate_sentences(cleaned_text):
            sig = normalize_signature(sentence)
            if not sig or sig in seen:
                continue

            seen.add(sig)
            source_to_index[source_id] = source_to_index.get(source_id, 0) + 1
            clause_rows.append(
                {
                    "id": (
                        f"{source_id}_clause_"
                        f"{source_to_index[source_id]:03d}"
                    ),
                    "source_url": source_url,
                    "title": title,
                    "clause": sentence,
                }
            )
            added += 1

            if len(clause_rows) >= target:
                break

    write_jsonl(CLAUSES_PATH, clause_rows)
    log(f"Original clauses: {current_count}")
    log(f"Added clauses: {added}")
    log(f"Total clauses now: {len(clause_rows)}")
    log(f"Updated file: {CLAUSES_PATH}")


if __name__ == "__main__":
    main()
