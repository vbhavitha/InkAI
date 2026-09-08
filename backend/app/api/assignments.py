from __future__ import annotations

from pathlib import Path
from typing import Any, Dict
from uuid import uuid4

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field

from app.assignments.assignment_service import AssignmentService
from app.assignments.page_layout import PageConfig
from app.assignments.pdf_renderer import AssignmentPDFRenderer
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.database.database import get_db


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

class AssignmentGenerateRequest(BaseModel):
    document_id: str

    template: str = "college_assignment"

    paper: str = "ruled"

    handwriting_style: str = "school_notebook"

    ink: str = "blue"

    page_numbers: bool = True

    assignment: Dict[str, Any] = Field(
        default_factory=dict
    )

    handwriting: Dict[str, Any] = Field(
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

@router.post("/generate")
def generate_assignment(
    request: AssignmentGenerateRequest,
    db: Session = Depends(get_db),
):
    """
    Generate a high-resolution assignment PDF.

    The browser preview is NOT used as the PDF source.

    The assignment is rebuilt and rendered on the backend.
    """

    try:
        # ---------------------------------------------------------
        # 1. Load the source document
        # ---------------------------------------------------------

        from app.api.documents import get_document

        document = get_document(
            request.document_id
        )

        if not document:
            raise HTTPException(
                status_code=404,
                detail="Document not found.",
            )

        # ---------------------------------------------------------
        # 2. Build assignment settings
        # ---------------------------------------------------------

        assignment = {
            **request.assignment,

            "template": request.template,

            "paperStyle": request.paper,

            "handwritingStyle": (
                request.handwriting_style
            ),

            "ink": request.ink,

            "showPageNumber": (
                request.page_numbers
            ),
        }

        # ---------------------------------------------------------
        # 3. Build page configuration
        # ---------------------------------------------------------

        page_config = build_page_config(
            page=assignment,
            assignment=assignment,
        )

        # ---------------------------------------------------------
        # 4. Paginate structured Phase 6 document
        # ---------------------------------------------------------

        service = AssignmentService(
            page_config=page_config
        )

        result = service.build_assignment(
            document=document,
            assignment=assignment,
        )

        pages = result.get(
            "pages",
            [],
        )

        # ---------------------------------------------------------
        # 5. Create high-resolution PDF
        # ---------------------------------------------------------

        output_directory = Path(
            "generated"
        ) / "assignments"

        output_directory.mkdir(
            parents=True,
            exist_ok=True,
        )

        assignment_id = str(
            uuid4()
        )

        output_path = (
            output_directory
            / f"{assignment_id}.pdf"
        )

        renderer = AssignmentPDFRenderer(
            page_config=page_config
        )

        renderer.render(
            pages=pages,
            output_path=str(
                output_path
            ),
        )

        # ---------------------------------------------------------
        # 6. Return generation result
        # ---------------------------------------------------------

        return {
            "assignment_id": assignment_id,
            "status": "completed",
            "pages": len(pages),
            "download_url": (
                f"/api/assignments/"
                f"{assignment_id}/download"
            ),
        }

    except HTTPException:
        raise

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=(
                "Failed to generate assignment PDF: "
                f"{error}"
            ),
        )

@router.get("/{assignment_id}/download")
def download_assignment(
    assignment_id: str,
):
    output_path = (
        Path("generated")
        / "assignments"
        / f"{assignment_id}.pdf"
    )

    if not output_path.exists():
        raise HTTPException(
            status_code=404,
            detail="Generated PDF not found.",
        )

    return FileResponse(
        path=str(output_path),
        media_type="application/pdf",
        filename="InkAI_Assignment.pdf",
    )