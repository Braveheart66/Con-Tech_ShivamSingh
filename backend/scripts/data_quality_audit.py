from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any


BASE_DIR = Path(__file__).resolve().parents[1]
RAW_PATH = BASE_DIR / "data" / "raw" / "all_raw.jsonl"
CLEANED_PATH = BASE_DIR / "data" / "cleaned" / "all_cleaned.jsonl"
CLAUSES_PATH = BASE_DIR / "data" / "processed" / "clauses.jsonl"
REPORT_DIR = BASE_DIR / "outputs" / "reports"
REPORT_JSON = REPORT_DIR / "data_quality_report.json"
REPORT_MD = REPORT_DIR / "data_quality_report.md"

LEGAL_TERMS = {
    "tenant",
    "landlord",
    "licensor",
    "licensee",
    "lessor",
    "lessee",
    "notice period",
    "lock-in period",
    "maintenance charges",
    "stamp duty",
    "police verification",
    "security deposit",
}


def log(message: str) -> None:
    print(f"[quality] {message}")


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


def count_term_hits(text: str) -> int:
    lowered = text.lower()
    return sum(1 for term in LEGAL_TERMS if term in lowered)


def unique_ratio(items: list[str]) -> float:
    if not items:
        return 0.0
    return len(set(items)) / len(items)


def avg_word_count(texts: list[str]) -> float:
    if not texts:
        return 0.0
    total = sum(len(re.findall(r"\w+", text)) for text in texts)
    return total / len(texts)


def make_report(
    raw_rows: list[dict[str, Any]],
    cleaned_rows: list[dict[str, Any]],
    clauses: list[dict[str, Any]],
) -> dict[str, Any]:
    raw_texts = [str(row.get("text", "")) for row in raw_rows]
    cleaned_texts = [str(row.get("cleaned_text", "")) for row in cleaned_rows]
    clause_texts = [str(row.get("clause", "")) for row in clauses]

    legal_term_hits = sum(count_term_hits(text) for text in clause_texts)
    clause_with_signal = sum(
        1 for text in clause_texts if count_term_hits(text) > 0
    )

    clause_unique = unique_ratio(
        [re.sub(r"\s+", " ", c).strip() for c in clause_texts]
    )
    source_unique = unique_ratio(
        [str(row.get("source_url", "")) for row in raw_rows]
    )

    quality_score = 0.0
    quality_score += min(40.0, len(clauses) * 0.6)
    quality_score += min(20.0, clause_unique * 20.0)
    quality_score += min(20.0, source_unique * 20.0)
    quality_score += min(
        20.0,
        (clause_with_signal / max(1, len(clauses))) * 20.0,
    )

    return {
        "raw_records": len(raw_rows),
        "cleaned_records": len(cleaned_rows),
        "clause_records": len(clauses),
        "avg_raw_words": round(avg_word_count(raw_texts), 2),
        "avg_cleaned_words": round(avg_word_count(cleaned_texts), 2),
        "avg_clause_words": round(avg_word_count(clause_texts), 2),
        "unique_source_ratio": round(source_unique, 4),
        "unique_clause_ratio": round(clause_unique, 4),
        "clauses_with_legal_signal": clause_with_signal,
        "legal_term_hits": legal_term_hits,
        "quality_score_100": round(quality_score, 2),
    }


def report_markdown(report: dict[str, Any]) -> str:
    lines = [
        "# Data Quality Audit",
        "",
        "| Metric | Value |",
        "| --- | --- |",
    ]

    for key, value in report.items():
        lines.append(f"| {key} | {value} |")

    lines.extend(
        [
            "",
            "Interpretation guide:",
            "- quality_score_100 >= 75: strong dataset for fine-tuning.",
            "- quality_score_100 55-74: usable, improve breadth and clauses.",
            "- quality_score_100 < 55: improve scraping before labeling.",
        ]
    )
    return "\n".join(lines)


def main() -> None:
    raw_rows = read_jsonl(RAW_PATH)
    cleaned_rows = read_jsonl(CLEANED_PATH)
    clauses = read_jsonl(CLAUSES_PATH)

    if not raw_rows:
        log(f"No raw records found at {RAW_PATH}")
        return

    REPORT_DIR.mkdir(parents=True, exist_ok=True)
    report = make_report(raw_rows, cleaned_rows, clauses)

    REPORT_JSON.write_text(
        json.dumps(report, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    REPORT_MD.write_text(report_markdown(report), encoding="utf-8")

    log(f"Saved JSON report to {REPORT_JSON}")
    log(f"Saved Markdown report to {REPORT_MD}")


if __name__ == "__main__":
    main()
