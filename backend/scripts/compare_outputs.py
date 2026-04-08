from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any


BASE_DIR = Path(__file__).resolve().parents[1]
COMPARISON_PATH = BASE_DIR / "outputs" / "reports" / "model_comparison.jsonl"
MARKDOWN_PATH = BASE_DIR / "outputs" / "reports" / "model_comparison.md"

JARGON_TERMS = {
    "hereby",
    "thereof",
    "whereas",
    "indemnify",
    "liable",
    "notwithstanding",
    "aforesaid",
    "hereinafter",
    "party of the first part",
    "termination",
    "forfeit",
    "lessee",
    "lessor",
    "licensor",
    "licensee",
}

PLAIN_ENGLISH_HINTS = {
    "you",
    "your",
    "tenant",
    "landlord",
    "must",
    "can",
    "need",
    "pay",
    "notice",
    "deposit",
    "rent",
}


def log(message: str) -> None:
    print(f"[compare] {message}")


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


def tokenize(text: str) -> list[str]:
    return re.findall(r"[a-zA-Z']+", text.lower())


def jargon_count(text: str) -> int:
    words = tokenize(text)
    return sum(1 for word in words if word in JARGON_TERMS)


def plain_hint_count(text: str) -> int:
    words = tokenize(text)
    return sum(1 for word in words if word in PLAIN_ENGLISH_HINTS)


def build_improvement_notes(base_output: str, finetuned_output: str) -> str:
    if not finetuned_output.strip():
        return "Fine-tuned output missing; could not compare."

    notes: list[str] = []

    base_len = len(base_output.split())
    tuned_len = len(finetuned_output.split())
    if tuned_len < base_len:
        notes.append("Fine-tuned output is shorter and likely easier to scan.")
    elif tuned_len == base_len:
        notes.append("Both outputs have similar length.")
    else:
        notes.append("Fine-tuned output is longer; may need tighter phrasing.")

    base_jargon = jargon_count(base_output)
    tuned_jargon = jargon_count(finetuned_output)
    if tuned_jargon < base_jargon:
        notes.append("Fine-tuned output uses less legal jargon.")
    elif tuned_jargon == base_jargon:
        notes.append("Both outputs use similar levels of legal jargon.")
    else:
        notes.append("Fine-tuned output uses more legal jargon.")

    base_plain = plain_hint_count(base_output)
    tuned_plain = plain_hint_count(finetuned_output)
    if tuned_plain > base_plain:
        notes.append("Fine-tuned output uses more plain-English tenant terms.")
    elif tuned_plain == base_plain:
        notes.append("Both outputs use similar plain-English terms.")
    else:
        notes.append(
            "Fine-tuned output uses fewer plain-English tenant terms."
        )

    return " ".join(notes)


def to_markdown_table(rows: list[dict[str, Any]]) -> str:
    lines = [
        "# Model Comparison Report",
        "",
        "| ID | Original Clause | Base Model Output | "
        "Fine-tuned Model Output | Improvement Notes |",
        "| --- | --- | --- | --- | --- |",
    ]

    for row in rows:
        clause = str(row.get("clause", "")).replace("|", "\\|")
        base_output = str(row.get("base_output", "")).replace("|", "\\|")
        tuned_output = str(row.get("finetuned_output", "")).replace("|", "\\|")
        notes = build_improvement_notes(base_output, tuned_output).replace(
            "|", "\\|"
        )
        row_id = str(row.get("id", ""))
        lines.append(
            f"| {row_id} | {clause} | {base_output} | "
            f"{tuned_output} | {notes} |"
        )

    lines.append("")
    lines.append(
        "Notes are generated with deterministic heuristics, without calling "
        "another LLM."
    )
    return "\n".join(lines)


def main() -> None:
    rows = read_jsonl(COMPARISON_PATH)
    if not rows:
        log(f"No comparison rows found at {COMPARISON_PATH}")
        return

    markdown = to_markdown_table(rows)
    MARKDOWN_PATH.parent.mkdir(parents=True, exist_ok=True)
    MARKDOWN_PATH.write_text(markdown, encoding="utf-8")

    log(f"Loaded rows: {len(rows)}")
    log(f"Saved Markdown report to {MARKDOWN_PATH}")


if __name__ == "__main__":
    main()
