import re


def split_into_clauses(text: str, max_clause_chars: int = 600) -> list[str]:
    if not text:
        return []

    split_pattern = r"\n(?=(?:\d+\.|clause\s+\d+|section\s+\d+|[A-Z]\.|-\s))"
    chunks = [
        chunk.strip()
        for chunk in re.split(split_pattern, text, flags=re.IGNORECASE)
        if chunk.strip()
    ]

    clauses: list[str] = []
    for chunk in chunks:
        if len(chunk) <= max_clause_chars:
            clauses.append(chunk)
            continue

        sentence_parts = re.split(r"(?<=[.!?])\s+", chunk)
        buffer = ""
        for sentence in sentence_parts:
            candidate = f"{buffer} {sentence}".strip()
            if len(candidate) <= max_clause_chars:
                buffer = candidate
            else:
                if buffer:
                    clauses.append(buffer)
                buffer = sentence.strip()
        if buffer:
            clauses.append(buffer)

    return clauses
