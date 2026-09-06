from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.handwriting.glyph_variation import (
    generate_page_variations,
)

from app.handwriting.handwriting_styles import (
    get_handwriting_styles,
    get_handwriting_style,
    validate_handwriting_styles,
)


router = APIRouter(
    prefix="/api/handwriting",
    tags=["Handwriting"],
)


# ============================================================
# REQUEST MODEL
# ============================================================

class GlyphVariationRequest(BaseModel):
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
# STYLE LIST
# ============================================================

@router.get("/styles")
def list_handwriting_styles():

    styles = get_handwriting_styles()

    return {
        "styles": [
            {
                "id": style_id,
                "name": style["name"],
                "description": style[
                    "description"
                ],
                "default_size": style[
                    "default_size"
                ],
                "spacing": style[
                    "spacing"
                ],
                "line_spacing": style[
                    "line_spacing"
                ],
                "category": style[
                    "category"
                ],
                "fonts": style[
                    "fonts"
                ],
                "font_variants": style.get(
                    "font_variants",
                    [],
                ),
            }

            for (
                style_id,
                style,
            ) in styles.items()
        ]
    }


# ============================================================
# SINGLE STYLE
# ============================================================

@router.get("/styles/{style_id}")
def get_style(
    style_id: str,
):

    style = get_handwriting_style(
        style_id
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

    missing_fonts = (
        validate_handwriting_styles()
    )

    return {
        "valid": (
            len(missing_fonts) == 0
        ),
        "missing_fonts": missing_fonts,
    }


# ============================================================
# GLYPH VARIATION
# ============================================================

@router.post("/variation")
def create_glyph_variation(
    request: GlyphVariationRequest,
):

    font_variants = []

    if request.style_id:

        style = get_handwriting_style(
            request.style_id
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
        enable_variation=(
            request.enable_variation
        ),
    )