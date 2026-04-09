from typing import Optional

from fastapi import APIRouter, File, Form, UploadFile

from app.schemas import AnalysisResponse
from app.services.analyzer import analyze_input


router = APIRouter(tags=["analysis"])


@router.post("/analyze", response_model=AnalysisResponse)
async def analyze_clause(
    text: Optional[str] = Form(default=None),
    file: Optional[UploadFile] = File(default=None),
    url: Optional[str] = Form(default=None),
) -> AnalysisResponse:
    return await analyze_input(text=text, file=file, url=url)
