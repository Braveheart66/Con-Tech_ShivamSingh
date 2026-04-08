from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any


BASE_DIR = Path(__file__).resolve().parents[1]
MANUAL_PAIRS_PATH = BASE_DIR / "data" / "training" / "manual_pairs.jsonl"


def log(message: str) -> None:
    print(f"[refine-labels] {message}")


def read_jsonl(path: Path) -> list[dict[str, Any]]:
    if not path.exists():
        return []
    with path.open("r", encoding="utf-8") as handle:
        return [json.loads(line) for line in handle if line.strip()]


def write_jsonl(path: Path, rows: list[dict[str, Any]]) -> None:
    with path.open("w", encoding="utf-8") as handle:
        for row in rows:
            handle.write(json.dumps(row, ensure_ascii=False) + "\n")


def extract_notice_phrase(text: str) -> str:
    m = re.search(
        r"(\d+\s*(?:day|days|month|months))",
        text,
        flags=re.IGNORECASE,
    )
    if not m:
        return "written notice"
    return f"{m.group(1)} written notice"


def build_targeted_output(clause: str) -> str | None:
    lower = clause.lower()

    if any(k in lower for k in ["sublet", "assign", "part with possession"]):
        return (
            "You cannot sublet or transfer this home without your landlord's "
            "written permission."
        )

    if "security deposit" in lower and any(
        k in lower for k in ["deduct", "damage", "unpaid rent", "forfeit"]
    ):
        return (
            "Your landlord can deduct unpaid rent or damage costs from your "
            "security deposit and return the balance."
        )

    if "security deposit" in lower and any(
        k in lower for k in ["refund", "refunded", "return"]
    ):
        return (
            "You should get your security deposit back after move-out, minus "
            "valid deductions listed in the agreement."
        )

    if any(
        k in lower
        for k in [
            "terminate",
            "termination",
            "notice period",
            "written notice",
        ]
    ):
        notice = extract_notice_phrase(clause)
        return (
            f"Either side can end this agreement by giving {notice}."
        )

    if "lock-in" in lower:
        return (
            "If you leave before the lock-in period ends, you may need to pay "
            "the remaining rent as per the agreement."
        )

    if any(
        k in lower
        for k in [
            "maintenance",
            "utility",
            "electricity",
            "water",
            "municipal dues",
        ]
    ):
        return (
            "You must pay utility and routine maintenance charges unless the "
            "agreement clearly assigns them to your landlord."
        )

    if any(k in lower for k in ["inspect", "inspection", "24 hours"]):
        return (
            "Your landlord can inspect the home after giving prior notice."
        )

    if any(
        k in lower for k in ["police verification", "documentation", "kyc"]
    ):
        return (
            "Your landlord must complete police verification, and both sides "
            "must share required documents."
        )

    if any(
        k in lower
        for k in ["stamp duty", "registered", "registration charges"]
    ):
        return (
            "This agreement must be registered, and stamp duty and "
            "registration "
            "charges should be paid as agreed by both sides."
        )

    if any(
        k in lower
        for k in [
            "rent shall be paid",
            "rent paid",
            "due date",
            "late fee",
            "penalty",
        ]
    ):
        return (
            "You must pay rent on time, and late payment can lead to "
            "penalties "
            "or other action under the agreement."
        )

    if any(k in lower for k in ["pets", "animals"]):
        return (
            "You can keep pets only if your landlord has given permission in "
            "the agreement."
        )

    if any(
        k in lower for k in ["illegal activities", "nuisance", "neighbours"]
    ):
        return (
            "You must not do illegal activities or disturb neighbors while "
            "living in the property."
        )

    if any(k in lower for k in ["vacate", "expiry", "lease period"]):
        return (
            "You must move out by the lease end date unless the agreement is "
            "renewed."
        )

    return None


def needs_refinement(output_text: str) -> bool:
    if not output_text.strip():
        return True

    lowered = output_text.lower().strip()
    generic_prefixes = [
        "you must ensure that",
        "you should follow this rental clause",
    ]
    return any(lowered.startswith(prefix) for prefix in generic_prefixes)


def main() -> None:
    rows = read_jsonl(MANUAL_PAIRS_PATH)
    if not rows:
        log(f"No rows found at {MANUAL_PAIRS_PATH}")
        return

    updated = 0
    for row in rows:
        clause = str(row.get("input", "")).strip()
        existing_output = str(row.get("output", "")).strip()

        if not clause:
            continue

        if not needs_refinement(existing_output):
            continue

        new_output = build_targeted_output(clause)
        if not new_output:
            continue

        row["output"] = new_output
        updated += 1

    write_jsonl(MANUAL_PAIRS_PATH, rows)

    labeled = sum(1 for row in rows if str(row.get("output", "")).strip())
    log(f"Rows updated: {updated}")
    log(f"Total labeled rows: {labeled}")
    log(f"Saved: {MANUAL_PAIRS_PATH}")


if __name__ == "__main__":
    main()
