from pathlib import Path
from typing import Dict

from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont


# ============================================================
# FONT DIRECTORY
# ============================================================

BASE_DIR = Path(__file__).resolve().parents[2]

FONTS_DIRECTORY = (
    BASE_DIR
    / "fonts"
)


# ============================================================
# BUILT-IN FALLBACK
# ============================================================

DEFAULT_FONT = "Helvetica"
DEFAULT_BOLD_FONT = "Helvetica-Bold"
DEFAULT_ITALIC_FONT = "Helvetica-Oblique"


# ============================================================
# FONT REGISTRY
# ============================================================

REGISTERED_FONTS: Dict[str, str] = {}


def register_font(
    name: str,
    filename: str,
) -> str:
    """
    Register a TrueType font if it exists.

    Returns the ReportLab font name.
    """

    font_path = (
        FONTS_DIRECTORY
        / filename
    )

    if not font_path.exists():
        return DEFAULT_FONT

    if name not in REGISTERED_FONTS:

        try:
            pdfmetrics.registerFont(
                TTFont(
                    name,
                    str(font_path),
                )
            )

            REGISTERED_FONTS[name] = (
                str(font_path)
            )

        except Exception:
            return DEFAULT_FONT

    return name


def resolve_font(
    requested_font: str | None = None,
) -> str:
    """
    Resolve a requested font safely.

    The PDF engine must never fail merely
    because a custom font is unavailable.
    """

    if not requested_font:
        return DEFAULT_FONT

    try:
        if requested_font in pdfmetrics.getRegisteredFontNames():
            return requested_font
    except Exception:
        pass

    return DEFAULT_FONT


def get_font_family(
    requested_font: str | None = None,
) -> Dict[str, str]:
    """
    Return normal/bold/italic font names.
    """

    normal = resolve_font(
        requested_font
    )

    registered = set(
        pdfmetrics.getRegisteredFontNames()
    )

    bold = (
        f"{normal}-Bold"
        if f"{normal}-Bold" in registered
        else DEFAULT_BOLD_FONT
    )

    italic = (
        f"{normal}-Italic"
        if f"{normal}-Italic" in registered
        else DEFAULT_ITALIC_FONT
    )

    return {
        "normal": normal,
        "bold": bold,
        "italic": italic,
    }