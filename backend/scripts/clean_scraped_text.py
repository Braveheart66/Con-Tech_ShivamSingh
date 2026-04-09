from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any


BASE_DIR = Path(__file__).resolve().parents[1]
RAW_PATH = BASE_DIR / "data" / "raw" / "all_raw.jsonl"
CLEANED_DIR = BASE_DIR / "data" / "cleaned"
CLEANED_PATH = CLEANED_DIR / "all_cleaned.jsonl"

NOISE_PATTERNS = [
    r"^accept\s+all\s+cookies$",
    r"^subscribe\s+to\s+our\s+newsletter$",
    r"^share\s+this\s+post$",
    r"^table\s+of\s+contents$",
    r"^click\s+here\s+to\s+download$",
    r"^skip\s+to\s+content$",
    r"^menu$",
    r"^home$",
    r"^next$",
    r"^previous$",
]

PROTECTED_TERMS = {
    "licensor",
    "licensee",
    "lessor",
    "lessee",
    "lock-in period",
    "notice period",
    "maintenance charges",
    "stamp duty",
    "police verification",
}

IN_DOMAIN_TERMS = {
    "rental",
    "rent",
    "tenant",
    "landlord",
    "lessee",
    "lessor",
    "licensee",
    "licensor",
    "leave and license",
    "leave-and-license",
    "security deposit",
    "notice period",
    "maintenance charges",
    "stamp duty",
    "police verification",
}

EXCLUDE_TERMS = {
    "non-compete",
    "confidentiality agreement",
    "vehicle lease",
    "sale agreement",
    "partnership deed",
    "agency agreement",
}


def log(message: str) -> None:
    print(f"[clean] {message}")


def has_protected_term(line: str) -> bool:
    lowered = line.lower()
    return any(term in lowered for term in PROTECTED_TERMS)


def is_navigation_noise(line: str) -> bool:
    lowered = line.lower()
    if any(re.match(pattern, lowered) for pattern in NOISE_PATTERNS):
        return True
    if lowered.count("|") >= 3:
        return True
    if lowered.startswith("http") and len(lowered) > 100:
        return True
    return False


def read_jsonl(path: Path) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    if not path.exists():
        return rows

    with path.open("r", encoding="utf-8") as handle:
        for line in handle:
            text = line.strip()
            if not text:
                continue
            rows.append(json.loads(text))
    return rows


def is_record_relevant(row: dict[str, Any], cleaned_text: str) -> bool:
    mixed = " ".join(
        [
            str(row.get("source_url", "")),
            str(row.get("title", "")),
            cleaned_text,
        ]
    ).lower()

    if any(term in mixed for term in EXCLUDE_TERMS):
        return False

    hits = sum(1 for term in IN_DOMAIN_TERMS if term in mixed)
    return hits >= 2


def normalize_text(text: str) -> str:
    normalized = text.replace("\r\n", "\n").replace("\r", "\n")
    normalized = re.sub(r"[ \t]+", " ", normalized)

    kept_lines: list[str] = []
    line_seen: set[str] = set()
    for raw_line in normalized.split("\n"):
        line = raw_line.strip()
        if not line:
            kept_lines.append("")
            continue

        normalized_line = re.sub(r"\s+", " ", line)
        if normalized_line in line_seen and not has_protected_term(
            normalized_line
        ):
            continue
        line_seen.add(normalized_line)

        if is_navigation_noise(normalized_line) and not has_protected_term(
            normalized_line
        ):
            continue

        kept_lines.append(normalized_line)

    cleaned = "\n".join(kept_lines)
    cleaned = re.sub(r"\n{3,}", "\n\n", cleaned)
    cleaned = re.sub(r"\s+([,.;:])", r"\1", cleaned)
    return cleaned.strip()


def to_cleaned_row(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": row.get("id", ""),
        "source_url": row.get("source_url", ""),
        "source_type": row.get("source_type", ""),
        "title": row.get("title", ""),
        "cleaned_text": normalize_text(str(row.get("text", ""))),
    }


def write_jsonl(path: Path, rows: list[dict[str, Any]]) -> None:
    with path.open("w", encoding="utf-8") as handle:
        for row in rows:
            handle.write(json.dumps(row, ensure_ascii=False) + "\n")


def main() -> None:
    CLEANED_DIR.mkdir(parents=True, exist_ok=True)

    raw_rows = read_jsonl(RAW_PATH)
    if not raw_rows:
        log(f"No records found at {RAW_PATH}")
        return

    cleaned_rows: list[dict[str, Any]] = []
    dropped_irrelevant = 0
    for row in raw_rows:
        cleaned = to_cleaned_row(row)
        if not cleaned["cleaned_text"]:
            continue
        if not is_record_relevant(row, cleaned["cleaned_text"]):
            dropped_irrelevant += 1
            continue
        cleaned_rows.append(cleaned)

    write_jsonl(CLEANED_PATH, cleaned_rows)
    log(f"Input records: {len(raw_rows)}")
    log(f"Cleaned records: {len(cleaned_rows)}")
    log(f"Dropped as irrelevant: {dropped_irrelevant}")
    log(f"Wrote cleaned data to {CLEANED_PATH}")


if __name__ == "__main__":
    main()
