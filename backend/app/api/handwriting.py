from fastapi import APIRouter, HTTPException

from app.handwriting.handwriting_styles import (
    get_handwriting_styles,
    get_handwriting_style,
    validate_handwriting_styles,
)


router = APIRouter(
    prefix="/api/handwriting",
    tags=["Handwriting"],
)


@router.get("/styles")
def list_handwriting_styles():
    """
    Return all handwriting styles available to the frontend.
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
            }
            for style_id, style in styles.items()
        ]
    }


@router.get("/styles/{style_id}")
def get_style(style_id: str):
    """
    Return details about a specific handwriting style.
    """
    style = get_handwriting_style(style_id)

    if not style:
        raise HTTPException(
            status_code=404,
            detail=f"Handwriting style '{style_id}' not found.",
        )

    return {
        "id": style_id,
        **style,
    }


@router.get("/styles/validate")
def validate_styles():
    """
    Verify that all fonts referenced by the handwriting
    styles exist on disk.
    """
    missing_fonts = validate_handwriting_styles()

    return {
        "valid": len(missing_fonts) == 0,
        "missing_fonts": missing_fonts,
    }