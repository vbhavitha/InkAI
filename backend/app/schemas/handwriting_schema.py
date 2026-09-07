from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


# ============================================================
# BASE SETTINGS
# ============================================================


class HandwritingBase(BaseModel):
    """
    Common handwriting-generation settings.

    naturalness is always represented internally as:

        0.0 - 1.0

    The frontend may display naturalness as 0 - 100,
    but the API/database representation remains 0.0 - 1.0.
    """

    style: str = Field(
        default="neat_student",
        min_length=1,
        max_length=100,
    )

    font: str | None = Field(
        default=None,
        max_length=255,
    )

    ink_color: str = Field(
        default="blue",
        min_length=1,
        max_length=50,
    )

    paper_style: str = Field(
        default="ruled",
        min_length=1,
        max_length=50,
    )

    font_size: float = Field(
        default=22,
        ge=8,
        le=100,
    )

    line_spacing: float = Field(
        default=1.5,
        ge=0.5,
        le=5.0,
    )

    letter_spacing: float = Field(
        default=0.0,
        ge=-5,
        le=20,
    )

    naturalness: float = Field(
        default=0.5,
        ge=0,
        le=1,
    )

    random_seed: int = Field(
        default=12345,
        ge=0,
    )


# ============================================================
# CREATE
# ============================================================


class HandwritingDocumentCreate(
    HandwritingBase
):
    """
    Schema used when creating handwriting settings
    for an existing document.
    """

    document_id: int = Field(
        gt=0,
    )

    user_id: int = Field(
        gt=0,
    )


# ============================================================
# UPDATE
# ============================================================


class HandwritingDocumentUpdate(
    BaseModel
):
    """
    Schema used when updating handwriting settings.

    All fields are optional so the frontend can modify
    only the settings that changed.
    """

    style: str | None = Field(
        default=None,
        min_length=1,
        max_length=100,
    )

    font: str | None = Field(
        default=None,
        max_length=255,
    )

    ink_color: str | None = Field(
        default=None,
        min_length=1,
        max_length=50,
    )

    paper_style: str | None = Field(
        default=None,
        min_length=1,
        max_length=50,
    )

    font_size: float | None = Field(
        default=None,
        ge=8,
        le=100,
    )

    line_spacing: float | None = Field(
        default=None,
        ge=0.5,
        le=5.0,
    )

    letter_spacing: float | None = Field(
        default=None,
        ge=-5,
        le=20,
    )

    naturalness: float | None = Field(
        default=None,
        ge=0,
        le=1,
    )

    random_seed: int | None = Field(
        default=None,
        ge=0,
    )


# ============================================================
# RESPONSE
# ============================================================


class HandwritingDocumentResponse(
    HandwritingBase
):
    """
    Schema returned by the handwriting document API.
    """

    id: int

    document_id: int

    user_id: int

    created_at: datetime

    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )


# ============================================================
# RENDER REQUEST
# ============================================================


class HandwritingRenderRequest(
    BaseModel
):
    """
    Schema used by the handwriting renderer.

    Endpoint:

        POST /api/handwriting/render

    naturalness is represented internally as:

        0.0 - 1.0
    """

    document_id: str = Field(
        min_length=1,
    )

    style: str = Field(
        default="neat_student",
        min_length=1,
        max_length=100,
    )

    ink: str = Field(
        default="blue",
        min_length=1,
        max_length=50,
    )

    paper: str = Field(
        default="ruled",
        min_length=1,
        max_length=50,
    )

    font_size: float = Field(
        default=22,
        ge=8,
        le=100,
    )

    naturalness: float = Field(
        default=0.5,
        ge=0,
        le=1,
    )

    seed: int = Field(
        default=12345,
        ge=0,
    )


# ============================================================
# RENDER RESPONSE
# ============================================================


class HandwritingRenderResponse(
    BaseModel
):
    """
    Response returned after a handwriting render request.
    """

    document_id: str

    pages: int = Field(
        default=0,
        ge=0,
    )

    preview_url: str | None = None

    status: str

    settings: dict | None = None


# ============================================================
# PDF REQUEST
# ============================================================


class HandwritingPDFRequest(
    HandwritingRenderRequest
):
    """
    Schema used for final handwriting PDF generation.

    The actual PDF renderer remains a placeholder for now.
    """

    page_numbers: bool = True

    quality: str = Field(
        default="high",
        min_length=1,
        max_length=30,
    )


# ============================================================
# PDF RESPONSE
# ============================================================


class HandwritingPDFResponse(
    BaseModel
):
    """
    Response returned by the handwriting PDF generator.
    """

    document_id: str

    status: str

    download_url: str | None = None

    settings: dict | None = None