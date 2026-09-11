from reportlab.lib.enums import (
    TA_CENTER,
    TA_LEFT,
    TA_RIGHT,
)

from reportlab.lib.styles import (
    ParagraphStyle,
    getSampleStyleSheet,
)

from .fonts import (
    DEFAULT_FONT,
    DEFAULT_BOLD_FONT,
)


# ============================================================
# ALIGNMENT
# ============================================================

ALIGNMENTS = {
    "left": TA_LEFT,
    "center": TA_CENTER,
    "right": TA_RIGHT,
}


def resolve_alignment(
    alignment: str | None,
):
    return ALIGNMENTS.get(
        str(alignment or "left").lower(),
        TA_LEFT,
    )


# ============================================================
# STYLE FACTORY
# ============================================================

def build_styles(
    font_name: str = DEFAULT_FONT,
):
    styles = getSampleStyleSheet()

    return {
        "body": ParagraphStyle(
            "InkAIBody",
            parent=styles["BodyText"],
            fontName=font_name,
            fontSize=11,
            leading=16,
            spaceAfter=8,
        ),

        "heading": ParagraphStyle(
            "InkAIHeading",
            parent=styles["Heading2"],
            fontName=DEFAULT_BOLD_FONT,
            fontSize=15,
            leading=19,
            spaceBefore=10,
            spaceAfter=8,
        ),

        "title": ParagraphStyle(
            "InkAITitle",
            parent=styles["Title"],
            fontName=DEFAULT_BOLD_FONT,
            fontSize=18,
            leading=22,
            alignment=TA_CENTER,
            spaceAfter=14,
        ),

        "small": ParagraphStyle(
            "InkAISmall",
            parent=styles["BodyText"],
            fontName=font_name,
            fontSize=8,
            leading=10,
        ),
    }