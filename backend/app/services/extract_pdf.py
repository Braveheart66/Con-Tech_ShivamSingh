from io import BytesIO

import pdfplumber


def extract_text_from_pdf_bytes(file_bytes: bytes) -> str:
    if not file_bytes:
        return ""

    page_texts: list[str] = []
    with pdfplumber.open(BytesIO(file_bytes)) as pdf:
        for page in pdf.pages:
            text = page.extract_text() or ""
            if text.strip():
                page_texts.append(text.strip())

    return "\n\n".join(page_texts)
