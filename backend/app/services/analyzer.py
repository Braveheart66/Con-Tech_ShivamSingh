from pathlib import Path
from typing import Optional

from fastapi import HTTPException, UploadFile

from app.schemas import AnalysisResponse
from app.services.clean_text import clean_extracted_text
from app.services.extract_image import extract_text_from_image_bytes
from app.services.extract_pdf import extract_text_from_pdf_bytes
from app.services.scrape_web import scrape_text_from_url
from app.services.simplify import simplify_legal_text
from app.services.split_clauses import split_into_clauses
from app.utils.file_validation import validate_upload_file


async def analyze_input(
    text: Optional[str] = None,
    file: Optional[UploadFile] = None,
    url: Optional[str] = None,
) -> AnalysisResponse:
    provided_inputs = [
        bool(text and text.strip()),
        file is not None,
        bool(url and url.strip()),
    ]
    if sum(provided_inputs) != 1:
        raise HTTPException(
            status_code=400,
            detail="Provide exactly one input source: text, file, or url.",
        )

    source_type = "text"
    file_name: Optional[str] = None
    extracted_text = ""

    if text and text.strip():
        source_type = "text"
        extracted_text = text
    elif file is not None:
        await validate_upload_file(file)
        file_bytes = await file.read()
        extension = Path(file.filename or "").suffix.lower()
        file_name = file.filename

        if extension == ".pdf":
            source_type = "pdf"
            extracted_text = extract_text_from_pdf_bytes(file_bytes)
        else:
            source_type = "image"
            extracted_text = extract_text_from_image_bytes(file_bytes)
    elif url and url.strip():
        source_type = "web_url"
        file_name = url
        try:
            extracted_text = scrape_text_from_url(url.strip())
        except Exception as exc:
            raise HTTPException(
                status_code=400,
                detail=f"Failed to scrape URL: {exc}",
            ) from exc

    cleaned_text = clean_extracted_text(extracted_text)
    clauses = split_into_clauses(cleaned_text)
    simplification = simplify_legal_text(cleaned_text)

    warnings = list(simplification.get("warnings", []))
    if not clauses:
        warnings.append(
            "No clear clauses were detected. The agreement format "
            "may be unstructured."
        )

    return AnalysisResponse(
        source_type=source_type,
        file_name=file_name,
        extracted_text=cleaned_text,
        plain_english=simplification.get("plain_english", ""),
        key_points=simplification.get("key_points", []),
        risk_score=int(simplification.get("risk_score", 0)),
        risk_level=simplification.get("risk_level", "Low Risk"),
        reasons=simplification.get("reasons", []),
        flags=simplification.get("flags", []),
        warnings=warnings,
    )
