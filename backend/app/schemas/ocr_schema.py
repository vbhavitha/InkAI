from typing import List, Optional

from pydantic import BaseModel, Field


class OCRWord(BaseModel):
    """
    Represents one OCR-detected text region.

    The bounding box is preserved so the frontend can
    highlight the corresponding word on the image.
    """

    text: str

    confidence: Optional[float] = Field(
        default=None,
        ge=0.0,
        le=1.0
    )

    bounding_box: List[List[float]]

    # -------------------------------------------------
    # WORD REVIEW INFORMATION
    # -------------------------------------------------

    confidence_level: Optional[str] = None

    needs_review: bool = False

    original_text: Optional[str] = None

    suggested_alternatives: List[str] = Field(
        default_factory=list
    )


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

    confidence_label: Optional[str] = None

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