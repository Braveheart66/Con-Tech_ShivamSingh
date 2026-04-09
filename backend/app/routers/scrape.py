from fastapi import APIRouter, HTTPException

from app.schemas import ScrapeUrlRequest, ScrapeUrlResponse
from app.services.clean_text import clean_extracted_text
from app.services.scrape_web import scrape_text_from_url
from app.services.simplify import simplify_legal_text
from app.services.split_clauses import split_into_clauses


router = APIRouter(tags=["scraping"])


@router.post("/scrape-url", response_model=ScrapeUrlResponse)
def scrape_url(payload: ScrapeUrlRequest) -> ScrapeUrlResponse:
    try:
        extracted = scrape_text_from_url(str(payload.url))
    except Exception as exc:
        raise HTTPException(
            status_code=400,
            detail=f"Unable to scrape URL: {exc}",
        ) from exc

    cleaned = clean_extracted_text(extracted)
    clauses = split_into_clauses(cleaned)

    if payload.simplify:
        simplified = simplify_legal_text(cleaned)
        return ScrapeUrlResponse(
            url=payload.url,
            extracted_text=cleaned,
            clauses=clauses,
            plain_english=simplified.get("plain_english", ""),
            key_points=simplified.get("key_points", []),
            risk_score=int(simplified.get("risk_score", 0)),
            risk_level=simplified.get("risk_level", "Low Risk"),
            reasons=simplified.get("reasons", []),
            flags=simplified.get("flags", []),
            warnings=simplified.get("warnings", []),
        )

    return ScrapeUrlResponse(
        url=payload.url,
        extracted_text=cleaned,
        clauses=clauses,
    )
