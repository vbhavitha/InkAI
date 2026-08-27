from typing import List, Optional

from pydantic import BaseModel, Field


class OCRWord(BaseModel):
    """
    Represents a single word detected by an OCR engine.
    """

    text: str

    confidence: float = Field(
        ...,
        ge=0.0,
        le=1.0
    )

    bounding_box: List[List[float]]


class OCRParagraph(BaseModel):
    """
    Represents a paragraph or text region detected
    by an OCR engine.
    """

    text: str

    confidence: Optional[float] = Field(
        default=None,
        ge=0.0,
        le=1.0
    )

    bounding_box: Optional[
        List[List[float]]
    ] = None


class OCRResult(BaseModel):
    """
    Common OCR result format used throughout InkAI.

    Every OCR engine should convert its output into
    this structure.
    """

    full_text: str

    overall_confidence: Optional[float] = Field(
        default=None,
        ge=0.0,
        le=1.0
    )

    words: List[OCRWord] = Field(
        default_factory=list
    )

    paragraphs: List[OCRParagraph] = Field(
        default_factory=list
    )

    detected_language: Optional[str] = None

    processing_time: float = Field(
        ...,
        ge=0.0
    )

    confidence_label: Optional[str] = None