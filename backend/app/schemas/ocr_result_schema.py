from typing import Optional

from pydantic import BaseModel, Field


class OCRResultCreate(BaseModel):
    file_id: Optional[str] = None

    full_text: str

    overall_confidence: Optional[float] = Field(
        default=None,
        ge=0.0,
        le=1.0
    )

    language: Optional[str] = None

    engine_used: Optional[str] = None

    processing_time: Optional[float] = Field(
        default=None,
        ge=0.0
    )


class OCRResultResponse(BaseModel):
    id: int
    user_id: int
    file_id: Optional[str] = None
    full_text: str
    overall_confidence: Optional[float] = None
    language: Optional[str] = None
    engine_used: Optional[str] = None
    processing_time: Optional[float] = None

    class Config:
        from_attributes = True