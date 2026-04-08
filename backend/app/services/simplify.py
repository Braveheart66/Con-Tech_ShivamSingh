import re


RISK_KEYWORDS = {
    "high": [
        "eviction",
        "termination without notice",
        "forfeit",
        "indemnify",
        "penalty",
    ],
    "medium": [
        "lock-in",
        "notice period",
        "security deposit",
        "arbitration",
        "maintenance",
    ],
}


def _detect_risk(text: str) -> str:
    lowered = text.lower()
    for risk_level, keywords in RISK_KEYWORDS.items():
        if any(keyword in lowered for keyword in keywords):
            return risk_level
    return "low"


def _extract_key_points(text: str, max_points: int = 5) -> list[str]:
    sentences = re.split(r"(?<=[.!?])\s+", text)
    points = [
        sentence.strip()
        for sentence in sentences
        if len(sentence.strip()) > 20
    ]
    return points[:max_points]


def simplify_legal_text(legal_text: str) -> dict:
    if not legal_text.strip():
        return {
            "plain_english": "No legal text was found to simplify.",
            "key_points": [],
            "risk_level": "low",
            "warnings": [
                "Input text was empty after extraction and cleaning."
            ],
        }

    risk_level = _detect_risk(legal_text)
    key_points = _extract_key_points(legal_text)

    plain_english = (
        "This clause appears to describe responsibilities between "
        "landlord and tenant/licensee. It has been converted into "
        "plain English summary form for easier reading. A legal "
        "professional should verify enforceability under Indian "
        "rental or leave-and-license law."
    )

    warnings = [
        "Mock simplifier is active. Replace simplify_legal_text "
        "with Gemma inference for production output."
    ]
    if risk_level in {"medium", "high"}:
        warnings.append(
            "Potentially sensitive legal obligations detected. "
            "Manual review is recommended."
        )

    return {
        "plain_english": plain_english,
        "key_points": key_points,
        "risk_level": risk_level,
        "warnings": warnings,
    }
