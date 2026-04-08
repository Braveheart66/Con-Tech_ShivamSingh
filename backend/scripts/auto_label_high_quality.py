from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any


BASE_DIR = Path(__file__).resolve().parents[1]
MANUAL_PAIRS_PATH = BASE_DIR / "data" / "training" / "manual_pairs.jsonl"
AUTO_LABELED_PATH = BASE_DIR / "data" / "training" / "auto_labeled_pairs.jsonl"

TARGET_NEW_LABELS = 220

LEGAL_NOISE_HINTS = {
    "faq",
    "subscribe",
    "click",
    "download",
    "author",
    "publisher",
    "template library",
    "advertisement",
}

JARGON_TERMS = {
    "thereof",
    "hereinafter",
    "aforesaid",
    "indemnify",
    "whereas",
}


def log(message: str) -> None:
    print(f"[auto-label] {message}")


def read_jsonl(path: Path) -> list[dict[str, Any]]:
    if not path.exists():
        return []
    with path.open("r", encoding="utf-8") as handle:
        return [json.loads(line) for line in handle if line.strip()]


def write_jsonl(path: Path, rows: list[dict[str, Any]]) -> None:
    with path.open("w", encoding="utf-8") as handle:
        for row in rows:
            handle.write(json.dumps(row, ensure_ascii=False) + "\n")


def normalize_spaces(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def first_meaningful_sentence(clause: str) -> str:
    normalized = normalize_spaces(clause)
    candidates = re.split(r"(?<=[.!?])\s+", normalized)
    for sentence in candidates:
        s = sentence.strip()
        if len(s.split()) < 8:
            continue
        lowered = s.lower()
        if any(h in lowered for h in LEGAL_NOISE_HINTS):
            continue
        return s
    return candidates[0].strip() if candidates else normalized


def is_clause_usable(clause: str) -> bool:
    lowered = clause.lower()
    if any(hint in lowered for hint in LEGAL_NOISE_HINTS):
        return False
    if len(clause.split()) < 10:
        return False
    if lowered.count("?") > 0:
        return False
    signals = [
        "tenant",
        "landlord",
        "lessee",
        "lessor",
        "licensee",
        "licensor",
        "rent",
        "deposit",
        "notice",
        "terminate",
        "maintenance",
        "agreement",
    ]
    return any(sig in lowered for sig in signals)


def simplify_sentence(sentence: str) -> str:
    text = sentence

    replacements = [
        (r"\blessee\b", "tenant"),
        (r"\blessor\b", "landlord"),
        (r"\blicensee\b", "tenant"),
        (r"\blicensor\b", "landlord"),
        (r"\bdemised premises\b", "rented home"),
        (r"\bshall not\b", "cannot"),
        (r"\bshall\b", "must"),
        (r"\bprior written consent\b", "written permission"),
        (r"\bvacate the premises\b", "leave the home"),
        (r"\bterminate this agreement\b", "end this agreement"),
        (
            r"\bsubject to deductions for damages\b",
            "after deducting damage costs",
        ),
        (r"\bwithout any deduction or set-off\b", "without adjustments"),
    ]

    for pattern, replacement in replacements:
        text = re.sub(pattern, replacement, text, flags=re.IGNORECASE)

    text = normalize_spaces(text)

    lowered = text.lower()
    if not any(
        p in lowered for p in ["you ", "your landlord", "tenant", "landlord"]
    ):
        if any(k in lowered for k in ["lessor", "landlord", "owner"]):
            text = (
                "Your landlord must ensure that "
                f"{text[0].lower() + text[1:]}"
            )
        else:
            text = f"You must ensure that {text[0].lower() + text[1:]}"

    if text and text[-1] not in ".!?":
        text += "."

    text = text[0].upper() + text[1:] if text else text

    text = text.replace("must be", "must")
    text = text.replace("tenant must pay", "You must pay")
    text = text.replace("tenant cannot", "You cannot")
    text = text.replace("tenant must", "You must")
    text = text.replace("landlord may", "Your landlord can")
    text = text.replace("landlord can", "Your landlord can")

    return text


def quality_ok(output_text: str) -> bool:
    lowered = output_text.lower()
    words = output_text.split()
    if not (8 <= len(words) <= 34):
        return False
    if any(term in lowered for term in JARGON_TERMS):
        return False
    if lowered.count(".") > 1:
        return False
    if not any(
        p in lowered for p in ["you ", "your landlord", "tenant", "landlord"]
    ):
        return False
    return True


def main() -> None:
    rows = read_jsonl(MANUAL_PAIRS_PATH)
    if not rows:
        log(f"No records found at {MANUAL_PAIRS_PATH}")
        return

    newly_labeled = 0
    for row in rows:
        if str(row.get("output", "")).strip():
            continue

        clause = str(row.get("input", "")).strip()
        if not is_clause_usable(clause):
            continue

        sentence = first_meaningful_sentence(clause)
        output_text = simplify_sentence(sentence)
        if not quality_ok(output_text):
            continue

        row["output"] = output_text
        newly_labeled += 1

        if newly_labeled >= TARGET_NEW_LABELS:
            break

    write_jsonl(MANUAL_PAIRS_PATH, rows)

    labeled_rows = [row for row in rows if str(row.get("output", "")).strip()]
    write_jsonl(AUTO_LABELED_PATH, labeled_rows)

    log(f"Newly auto-labeled rows: {newly_labeled}")
    log(f"Total labeled rows now: {len(labeled_rows)}")
    log(f"Updated manual pairs: {MANUAL_PAIRS_PATH}")
    log(f"Snapshot written: {AUTO_LABELED_PATH}")


if __name__ == "__main__":
    main()
