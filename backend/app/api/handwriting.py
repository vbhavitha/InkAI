from __future__ import annotations

from pathlib import Path
from typing import Any

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from pydantic import BaseModel, Field

from app.handwriting.glyph_variation import (
    generate_page_variations,
)

from app.handwriting.handwriting_styles import (
    get_handwriting_styles,
    get_handwriting_style,
    validate_handwriting_styles,
)

from app.schemas.handwriting_schema import (
    HandwritingRenderRequest,
    HandwritingPDFRequest,
)

from app.storage.storage_service import (
    save_handwriting_preview,
    save_handwriting_final,
)


router = APIRouter(
    prefix="/api/handwriting",
    tags=["Handwriting"],
)


# ============================================================
# REQUEST MODELS
# ============================================================


class GlyphVariationRequest(BaseModel):
    """
    Request used to generate deterministic glyph variations
    for a page of handwriting text.
    """

    document_id: str = Field(
        min_length=1,
    )

    page_number: int = Field(
        ge=1,
    )

    text: str = ""

    style_id: str | None = None

    enable_variation: bool = True


# ============================================================
# HELPERS
# ============================================================


def normalize_naturalness(
    value: float,
) -> float:
    """
    Convert naturalness to the internal 0.0 - 1.0 range.

    Supported input:

        0.0 - 1.0
        0   - 100

    Examples:

        0    -> 0.0
        25   -> 0.25
        50   -> 0.50
        75   -> 0.75
        100  -> 1.0

    Values already between 0 and 1 are preserved.
    """

    if value <= 1:
        return max(
            0.0,
            min(1.0, value),
        )

    return (
        max(
            0.0,
            min(100.0, value),
        )
        / 100.0
    )


def validate_style(
    style_id: str,
) -> dict[str, Any]:
    """
    Retrieve and validate a handwriting style.
    """

    style = get_handwriting_style(
        style_id,
    )

    if not style:
        raise HTTPException(
            status_code=404,
            detail=(
                f"Handwriting style "
                f"'{style_id}' not found."
            ),
        )

    return style


def validate_upload(
    file: UploadFile,
) -> None:
    """
    Basic validation for generated image uploads.
    """

    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="Uploaded file must have a filename.",
        )

    content_type = (
        file.content_type or ""
    ).lower()

    allowed_types = {
        "image/png",
        "image/jpeg",
        "image/webp",
    }

    if content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=(
                "Only PNG, JPEG, and WEBP "
                "images are supported."
            ),
        )


# ============================================================
# STYLE LIST
# ============================================================


@router.get("/styles")
def list_handwriting_styles():
    """
    Return all available handwriting styles.
    """

    styles = get_handwriting_styles()

    return {
        "styles": [
            {
                "id": style_id,
                "name": style["name"],
                "description": style["description"],
                "default_size": style["default_size"],
                "spacing": style["spacing"],
                "line_spacing": style["line_spacing"],
                "category": style["category"],
                "fonts": style["fonts"],
                "font_variants": style.get(
                    "font_variants",
                    [],
                ),
            }
            for style_id, style in styles.items()
        ]
    }


# ============================================================
# SINGLE STYLE
# ============================================================


@router.get("/styles/{style_id}")
def get_style(
    style_id: str,
):
    """
    Return details for one handwriting style.
    """

    style = get_handwriting_style(
        style_id,
    )

    if not style:
        raise HTTPException(
            status_code=404,
            detail=(
                f"Handwriting style "
                f"'{style_id}' not found."
            ),
        )

    return {
        "id": style_id,
        **style,
    }


# ============================================================
# VALIDATE FONTS
# ============================================================


@router.get("/styles/validate")
def validate_styles():
    """
    Check whether all configured handwriting
    font files exist.
    """

    missing_fonts = validate_handwriting_styles()

    return {
        "valid": len(missing_fonts) == 0,
        "missing_fonts": missing_fonts,
    }


# ============================================================
# GLYPH VARIATION
# ============================================================


@router.post("/variation")
def create_glyph_variation(
    request: GlyphVariationRequest,
):
    """
    Generate deterministic glyph variations
    for a page of handwriting text.
    """

    font_variants = []

    if request.style_id:
        style = get_handwriting_style(
            request.style_id,
        )

        if not style:
            raise HTTPException(
                status_code=404,
                detail=(
                    f"Handwriting style "
                    f"'{request.style_id}' "
                    f"not found."
                ),
            )

        font_variants = style.get(
            "font_variants",
            [],
        )

    return generate_page_variations(
        text=request.text,
        document_id=request.document_id,
        page_number=request.page_number,
        font_variants=font_variants,
        enable_variation=request.enable_variation,
    )


# ============================================================
# HANDWRITING RENDER
# ============================================================


@router.post("/render")
def render_handwriting(
    request: HandwritingRenderRequest,
):
    """
    Validate a handwriting rendering configuration.

    The actual handwriting preview is currently
    generated by the frontend canvas renderer.

    This endpoint prepares rendering metadata that
    can later be consumed by the backend renderer.
    """

    style = validate_style(
        request.style,
    )

    naturalness = normalize_naturalness(
        request.naturalness,
    )

    return {
        "document_id": request.document_id,
        "pages": 0,
        "preview_url": None,
        "status": "ready",
        "settings": {
            "style": request.style,
            "style_name": style.get(
                "name",
                request.style,
            ),
            "ink": request.ink,
            "paper": request.paper,
            "font_size": request.font_size,
            "naturalness": naturalness,
            "seed": request.seed,
        },
    }


# ============================================================
# HANDWRITING PREVIEW INFO
# ============================================================


@router.get("/preview/{document_id}")
def get_handwriting_preview(
    document_id: str,
):
    """
    Return preview information for a document.

    The frontend canvas remains responsible for
    generating the actual preview.
    """

    if not document_id:
        raise HTTPException(
            status_code=400,
            detail="Document ID is required.",
        )

    return {
        "document_id": document_id,
        "status": "frontend_rendered",
        "preview_url": None,
    }


# ============================================================
# SAVE HANDWRITING PREVIEW
# ============================================================


@router.post("/preview")
async def save_handwriting_preview_endpoint(
    document_id: str = Form(...),
    page_number: int = Form(...),
    file: UploadFile = File(...),
):
    """
    Save a generated handwriting preview page.

    The frontend canvas can send the generated PNG
    as multipart/form-data.

    Storage:

        backend/storage/handwriting/previews/
    """

    if not document_id.strip():
        raise HTTPException(
            status_code=400,
            detail="Document ID is required.",
        )

    if page_number < 1:
        raise HTTPException(
            status_code=400,
            detail="Page number must be at least 1.",
        )

    validate_upload(file)

    try:
        file_bytes = await file.read()

        if not file_bytes:
            raise HTTPException(
                status_code=400,
                detail="Uploaded preview file is empty.",
            )

        extension = Path(
            file.filename or "preview.png"
        ).suffix.lower()

        if extension not in {
            ".png",
            ".jpg",
            ".jpeg",
            ".webp",
        }:
            extension = ".png"

        path = save_handwriting_preview(
            document_id=document_id,
            page_number=page_number,
            file_bytes=file_bytes,
            extension=extension,
        )

        return {
            "document_id": document_id,
            "page_number": page_number,
            "status": "saved",
            "path": str(path),
            "url": (
                "/files/handwriting/previews/"
                f"{path.name}"
            ),
        }

    except HTTPException:
        raise

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=(
                "Failed to save handwriting preview."
            ),
        ) from error


# ============================================================
# SAVE FINAL HANDWRITING PNG
# ============================================================


@router.post("/export/png")
async def export_handwriting_png(
    document_id: str = Form(...),
    file: UploadFile = File(...),
):
    """
    Save the final generated handwriting PNG.

    The frontend canvas is currently responsible
    for rendering the image.

    Storage:

        backend/storage/handwriting/final/
    """

    if not document_id.strip():
        raise HTTPException(
            status_code=400,
            detail="Document ID is required.",
        )

    validate_upload(file)

    try:
        file_bytes = await file.read()

        if not file_bytes:
            raise HTTPException(
                status_code=400,
                detail="Uploaded PNG file is empty.",
            )

        path = save_handwriting_final(
            document_id=document_id,
            file_bytes=file_bytes,
            extension=".png",
        )

        return {
            "document_id": document_id,
            "status": "completed",
            "path": str(path),
            "download_url": (
                "/files/handwriting/final/"
                f"{path.name}"
            ),
        }

    except HTTPException:
        raise

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=(
                "Failed to save final handwriting image."
            ),
        ) from error


# ============================================================
# HANDWRITING PDF
# ============================================================


@router.post("/pdf")
def generate_handwriting_pdf(
    request: HandwritingPDFRequest,
):
    """
    Placeholder for the final handwriting PDF renderer.

    The actual PDF renderer will be implemented
    separately.

    Current architecture:

        Structured Document
                |
        Handwriting Renderer
                |
          +-----+------+
          |            |
       Canvas         PDF
       Preview      Renderer

    Preview rendering remains independent from
    final PDF generation.
    """

    validate_style(
        request.style,
    )

    naturalness = normalize_naturalness(
        request.naturalness,
    )

    return {
        "document_id": request.document_id,
        "status": "ready_for_pdf_renderer",
        "settings": {
            "style": request.style,
            "ink": request.ink,
            "paper": request.paper,
            "font_size": request.font_size,
            "naturalness": naturalness,
            "seed": request.seed,
            "page_numbers": request.page_numbers,
            "quality": request.quality,
        },
        "download_url": None,
    }