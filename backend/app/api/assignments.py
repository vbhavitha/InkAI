from __future__ import annotations

from typing import Any, Dict

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.assignments.assignment_service import AssignmentService
from app.assignments.page_layout import PageConfig


# ============================================================
# ROUTER
# ============================================================

router = APIRouter(
    prefix="/api/assignments",
    tags=["Assignments"],
)


# ============================================================
# REQUEST SCHEMA
# ============================================================

class AssignmentRequest(BaseModel):
    """
    Assignment request received from the Phase 8 frontend.

    document:
        Structured TipTap JSON from Phase 6.

    assignment:
        Assignment metadata and settings.

    page:
        Page size, orientation and margin settings.
    """

    document: Dict[str, Any]

    assignment: Dict[str, Any] = Field(
        default_factory=dict
    )

    page: Dict[str, Any] = Field(
        default_factory=dict
    )


# ============================================================
# PAGE CONFIGURATION
# ============================================================

def build_page_config(
    page: Dict[str, Any] | None = None,
    assignment: Dict[str, Any] | None = None,
) -> PageConfig:

    page = page or {}
    assignment = assignment or {}

    # --------------------------------------------------------
    # Paper
    # --------------------------------------------------------

    paper_size = page.get(
        "paperSize",
        "A4",
    )

    orientation = page.get(
        "orientation",
        "portrait",
    )

    # --------------------------------------------------------
    # Margins
    # --------------------------------------------------------

    margin_preset = page.get(
        "marginPreset",
        "normal",
    )

    custom_margins = (
        page.get("customMargins")
        or {}
    )

    margins = {
        "top": 56,
        "right": 50,
        "bottom": 56,
        "left": 50,
    }

    if margin_preset == "narrow":

        margins = {
            "top": 36,
            "right": 36,
            "bottom": 36,
            "left": 36,
        }

    elif margin_preset == "wide":

        margins = {
            "top": 72,
            "right": 65,
            "bottom": 72,
            "left": 65,
        }

    elif margin_preset == "custom":

        margins = {
            "top": custom_margins.get(
                "top",
                56,
            ),
            "right": custom_margins.get(
                "right",
                50,
            ),
            "bottom": custom_margins.get(
                "bottom",
                56,
            ),
            "left": custom_margins.get(
                "left",
                50,
            ),
        }

    # --------------------------------------------------------
    # Footer / Page numbers
    # --------------------------------------------------------

    show_footer = assignment.get(
        "showFooter",
        True,
    )

    footer_text = assignment.get(
        "footerText",
        "InkAI",
    )

    show_page_number = assignment.get(
        "showPageNumber",
        True,
    )

    page_number_position = assignment.get(
        "pageNumberPosition",
        "center",
    )

    # --------------------------------------------------------
    # Page configuration
    # --------------------------------------------------------

    return PageConfig(
        paper_size=paper_size,
        orientation=orientation,
        margin_preset=margin_preset,

        top=margins["top"],
        right=margins["right"],
        bottom=margins["bottom"],
        left=margins["left"],

        # Reserve space for footer/page number.
        footer_height=40,

        show_footer=show_footer,
        footer_text=footer_text,

        show_page_number=show_page_number,
        page_number_position=page_number_position,
    )


# ============================================================
# STEP 13 + STEP 14 + STEP 15 + STEP 16
# ============================================================

@router.post("/paginate")
def paginate_assignment(
    request: AssignmentRequest,
):
    """
    Paginate a Phase 6 structured document.

    Supports:

    STEP 13
        Automatic pagination when page space is exhausted.

    STEP 14
        Explicit TipTap pageBreak nodes.

    STEP 15
        Page numbers and total page count.

    STEP 16
        Optional footer configuration.
    """

    try:

        page_config = build_page_config(
            page=request.page,
            assignment=request.assignment,
        )

        service = AssignmentService(
            page_config=page_config
        )

        result = service.build_assignment(
            document=request.document,
            assignment=request.assignment,
        )

        return result

    except ValueError as error:

        raise HTTPException(
            status_code=400,
            detail=str(error),
        )

    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=(
                "Failed to paginate assignment: "
                f"{error}"
            ),
        )