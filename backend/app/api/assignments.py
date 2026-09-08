from __future__ import annotations

from typing import Any, Dict, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.assignments.assignment_service import (
    AssignmentService,
)
from app.assignments.page_layout import (
    PageConfig,
)


router = APIRouter(
    prefix="/api/assignments",
    tags=["Assignments"],
)


# ============================================================
# REQUEST SCHEMAS
# ============================================================


class AssignmentRequest(BaseModel):
    """
    Phase 8 assignment request.

    The document is the structured TipTap JSON generated
    by Phase 6.
    """

    document: Dict[str, Any]

    assignment: Dict[str, Any] = Field(
        default_factory=dict
    )

    page: Dict[str, Any] = Field(
        default_factory=dict
    )


# ============================================================
# PAGE CONFIG
# ============================================================


def build_page_config(
    page: Optional[Dict[str, Any]] = None,
) -> PageConfig:
    """
    Convert frontend page settings into the backend
    pagination configuration.
    """

    page = page or {}

    paper_size = page.get(
        "paperSize",
        "A4",
    )

    orientation = page.get(
        "orientation",
        "portrait",
    )

    margin_preset = page.get(
        "marginPreset",
        "normal",
    )

    custom_margins = (
        page.get("customMargins")
        or {}
    )

    # --------------------------------------------------------
    # Default margins
    # --------------------------------------------------------

    margins = {
        "top": 56,
        "right": 50,
        "bottom": 56,
        "left": 50,
    }

    # --------------------------------------------------------
    # Presets
    # --------------------------------------------------------

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

    return PageConfig(
        paper_size=paper_size,
        orientation=orientation,
        margin_preset=margin_preset,
        top=margins["top"],
        right=margins["right"],
        bottom=margins["bottom"],
        left=margins["left"],
    )


# ============================================================
# PREVIEW / PAGINATION
# ============================================================


@router.post("/paginate")
def paginate_assignment(
    request: AssignmentRequest,
):
    """
    STEP 13 + STEP 14

    Takes the structured Phase 6 document and returns
    automatically paginated structured content.

    Automatic pagination:
        When the page becomes full → new page.

    Manual pagination:
        A Phase 6 pageBreak node → new page immediately.
    """

    try:

        page_config = build_page_config(
            request.page
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