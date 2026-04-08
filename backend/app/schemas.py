from typing import Literal, Optional

from pydantic import BaseModel, Field, HttpUrl


class AnalysisResponse(BaseModel):
    source_type: Literal["text", "pdf", "image", "web_url"]
    file_name: Optional[str] = None
    extracted_text: str
    plain_english: str
    key_points: list[str] = Field(default_factory=list)
    risk_score: int = 0
    risk_level: str = "Low Risk"
    reasons: list[str] = Field(default_factory=list)
    flags: list[str] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)


class ScrapeUrlRequest(BaseModel):
    url: HttpUrl
    simplify: bool = True


class ScrapeUrlResponse(BaseModel):
    url: HttpUrl
    extracted_text: str
    clauses: list[str] = Field(default_factory=list)
    plain_english: Optional[str] = None
    key_points: list[str] = Field(default_factory=list)
    risk_score: int = 0
    risk_level: Optional[str] = None
    reasons: list[str] = Field(default_factory=list)
    flags: list[str] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)
