from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any


BASE_DIR = Path(__file__).resolve().parents[1]
CLEANED_PATH = BASE_DIR / "data" / "cleaned" / "all_cleaned.jsonl"
PROCESSED_DIR = BASE_DIR / "data" / "processed"
CLAUSES_PATH = PROCESSED_DIR / "clauses.jsonl"

MIN_CLAUSE_CHARS = 55
MAX_CLAUSE_CHARS = 700

LEGAL_SIGNAL_TERMS = {
    "tenant",
    "landlord",
    "licensor",
    "licensee",
    "lessor",
    "lessee",
    "rent",
    "deposit",
    "notice",
    "termination",
    "maintenance",
    "stamp duty",
    "police verification",
    "agreement",
    "charges",
    "repair",
    "utility",
    "possession",
    "sublet",
}


def log(message: str) -> None:
    print(f"[split] {message}")


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


def is_useful_clause(clause: str) -> bool:
    compact = re.sub(r"\s+", " ", clause).strip().lower()
    if len(compact) < MIN_CLAUSE_CHARS:
        return False
    if compact.count(" ") < 6:
        return False

    symbol_count = len(re.findall(r"[^a-z0-9\s,.;:()\-]", compact))
    if symbol_count > max(8, len(compact) // 8):
        return False

    has_legal_signal = any(term in compact for term in LEGAL_SIGNAL_TERMS)
    return has_legal_signal


def split_text_into_clauses(text: str) -> list[str]:
    pattern = r"\n(?=(?:\d+\.|clause\s+\d+|section\s+\d+|[A-Z][\.)]|-\s))"
    rough_parts = [
        part.strip()
        for part in re.split(pattern, text, flags=re.IGNORECASE)
        if part.strip()
    ]

    clauses: list[str] = []
    for part in rough_parts:
        if len(part) <= MAX_CLAUSE_CHARS:
            clauses.append(part)
            continue

        sentences = re.split(r"(?<=[.!?])\s+", part)
        current = ""
        for sentence in sentences:
            candidate = f"{current} {sentence}".strip()
            if len(candidate) <= MAX_CLAUSE_CHARS:
                current = candidate
            else:
                if current:
                    clauses.append(current)
                current = sentence.strip()
        if current:
            clauses.append(current)

    filtered: list[str] = []
    seen = set()
    for clause in clauses:
        compact = re.sub(r"\s+", " ", clause).strip()
        if not is_useful_clause(compact):
            continue
        if compact in seen:
            continue
        seen.add(compact)
        filtered.append(compact)
    return filtered


def main() -> None:
    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)

    cleaned_rows = read_jsonl(CLEANED_PATH)
    if not cleaned_rows:
        log(f"No cleaned records found at {CLEANED_PATH}")
        return

    clause_rows: list[dict[str, Any]] = []
    for row in cleaned_rows:
        source_id = str(row.get("id", "source_unknown"))
        clauses = split_text_into_clauses(str(row.get("cleaned_text", "")))

        for idx, clause in enumerate(clauses, start=1):
            clause_rows.append(
                {
                    "id": f"{source_id}_clause_{idx:03d}",
                    "source_url": row.get("source_url", ""),
                    "title": row.get("title", ""),
                    "clause": clause,
                }
            )

    write_jsonl(CLAUSES_PATH, clause_rows)
    log(f"Cleaned records: {len(cleaned_rows)}")
    log(f"Clause records: {len(clause_rows)}")
    log(f"Wrote clauses to {CLAUSES_PATH}")


if __name__ == "__main__":
    main()
