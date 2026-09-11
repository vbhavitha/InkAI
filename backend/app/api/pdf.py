from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, Optional
from uuid import uuid4

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
)
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.document import Document

from app.assignments.page_layout import (
    PageConfig,
)
from app.assignments.pdf_renderer import (
    AssignmentPDFRenderer,
)


# ============================================================
# ROUTER
# ============================================================

router = APIRouter(
    prefix="/api/pdf",
    tags=["PDF"],
)


# ============================================================
# CONSTANTS
# ============================================================

TEMP_USER_ID = 1

PDF_DIRECTORY = (
    Path("generated")
    / "pdf"
)

PDF_DIRECTORY.mkdir(
    parents=True,
    exist_ok=True,
)


# ============================================================
# REQUEST
# ============================================================

class PDFGenerateRequest(
    BaseModel
):
    """
    Generic PDF generation request.

    document_id:
        Existing InkAI document ID.

    The request intentionally mirrors the Step 23 API.
    """

    document_id: int

    page_size: str = "A4"

    margins: str = "normal"

    orientation: str = "portrait"

    header: bool = True

    footer: bool = True

    page_numbers: bool = True

    watermark: Optional[
        Dict[str, Any]
    ] = None

    bookmarks: bool = True

    title: Optional[str] = None

    author: Optional[str] = None

    subject: Optional[str] = None

    keywords: Optional[
        str | list[str]
    ] = None

    custom_margins: Dict[
        str,
        float
    ] = Field(
        default_factory=dict
    )

    custom_width_mm: Optional[
        float
    ] = None

    custom_height_mm: Optional[
        float
    ] = None


# ============================================================
# PAGE CONFIGURATION
# ============================================================

def build_pdf_page_config(
    request: PDFGenerateRequest,
) -> PageConfig:
    """
    Convert API settings into the existing
    Assignment PageConfig.

    This does NOT create another pagination engine.
    """

    margins = {
        "normal": {
            "top": 56.0,
            "right": 50.0,
            "bottom": 56.0,
            "left": 50.0,
        },
        "narrow": {
            "top": 36.0,
            "right": 36.0,
            "bottom": 36.0,
            "left": 36.0,
        },
        "wide": {
            "top": 72.0,
            "right": 65.0,
            "bottom": 72.0,
            "left": 65.0,
        },
    }

    margin_key = (
        str(
            request.margins
            or "normal"
        )
        .strip()
        .lower()
    )

    if margin_key == "custom":
        selected_margins = {
            "top": float(
                request.custom_margins.get(
                    "top",
                    56,
                )
            ),
            "right": float(
                request.custom_margins.get(
                    "right",
                    50,
                )
            ),
            "bottom": float(
                request.custom_margins.get(
                    "bottom",
                    56,
                )
            ),
            "left": float(
                request.custom_margins.get(
                    "left",
                    50,
                )
            ),
        }

    else:
        selected_margins = margins.get(
            margin_key,
            margins["normal"],
        )

    header_text = (
        request.title
        or ""
    )

    header_height = (
        28.0
        if request.header
        and header_text
        else 0.0
    )

    footer_height = (
        40.0
        if (
            request.footer
            or request.page_numbers
        )
        else 0.0
    )

    return PageConfig(
        paper_size=(
            request.page_size
            or "A4"
        ),

        orientation=(
            request.orientation
            or "portrait"
        ),

        margin_preset=(
            margin_key
            if margin_key
            in {
                "normal",
                "narrow",
                "wide",
            }
            else "custom"
        ),

        top=selected_margins[
            "top"
        ],

        right=selected_margins[
            "right"
        ],

        bottom=selected_margins[
            "bottom"
        ],

        left=selected_margins[
            "left"
        ],

        header_height=header_height,

        footer_height=footer_height,

        header_enabled=(
            request.header
            and bool(header_text)
        ),

        header_text=header_text,

        header_position="center",

        header_font_size=11,

        header_bold=False,

        show_footer=request.footer,

        footer_text="InkAI",

        footer_position="center",

        footer_font_size=9,

        footer_bold=False,

        show_page_number=(
            request.page_numbers
        ),

        page_number_position="center",

        page_number_show_total=True,

        page_number_prefix="Page",

        page_number_font_size=9,

        page_number_bold=False,

        custom_width_mm=(
            request.custom_width_mm
        ),

        custom_height_mm=(
            request.custom_height_mm
        ),
    )


# ============================================================
# DOCUMENT LOADING
# ============================================================

def load_document(
    db: Session,
    document_id: int,
) -> Document:
    document = (
        db.query(Document)
        .filter(
            Document.id
            == document_id,
            Document.user_id
            == TEMP_USER_ID,
        )
        .first()
    )

    if not document:
        raise HTTPException(
            status_code=404,
            detail="Document not found.",
        )

    return document


def document_to_json(
    document: Document,
) -> Dict[str, Any]:
    try:
        content = json.loads(
            document.content
        )
    except (
        TypeError,
        json.JSONDecodeError,
    ) as error:
        raise HTTPException(
            status_code=500,
            detail=(
                "Stored document content "
                "is invalid JSON."
            ),
        ) from error

    if not isinstance(
        content,
        dict,
    ):
        raise HTTPException(
            status_code=500,
            detail=(
                "Stored document content "
                "must be structured TipTap JSON."
            ),
        )

    return content


# ============================================================
# GENERATE PDF
# ============================================================

@router.post(
    "/generate"
)
def generate_pdf(
    request: PDFGenerateRequest,
    db: Session = Depends(
        get_db
    ),
):
    """
    Generate a PDF from an existing InkAI document.

    Flow:

        Document
            ↓
        TipTap JSON
            ↓
        AssignmentPageLayout
            ↓
        Paginated pages
            ↓
        AssignmentPDFRenderer
            ↓
        PDF
    """

    try:
        document = load_document(
            db,
            request.document_id,
        )

        document_json = (
            document_to_json(
                document
            )
        )

        page_config = (
            build_pdf_page_config(
                request
            )
        )

        # --------------------------------------------------------
        # AUTHORITATIVE PAGINATION
        # --------------------------------------------------------

        from app.assignments.page_layout import (
            paginate_document,
        )

        pages = paginate_document(
            document_json,
            page_config,
        )

        # --------------------------------------------------------
        # PDF ID / FILE
        # --------------------------------------------------------

        pdf_id = str(
            uuid4()
        )

        filename = (
            f"{pdf_id}.pdf"
        )

        output_path = (
            PDF_DIRECTORY
            / filename
        )

        # --------------------------------------------------------
        # METADATA
        # --------------------------------------------------------

        if isinstance(
            request.keywords,
            list,
        ):
            keywords = ", ".join(
                str(value)
                for value in request.keywords
            )
        else:
            keywords = (
                request.keywords
                or ""
            )

        metadata = {
            "title": (
                request.title
                or document.title
                or "InkAI Document"
            ),
            "author": (
                request.author
                or ""
            ),
            "subject": (
                request.subject
                or ""
            ),
            "keywords": keywords,
            "creator": "InkAI",
        }

        # --------------------------------------------------------
        # RENDER
        # --------------------------------------------------------

        renderer = (
            AssignmentPDFRenderer(
                page_config=page_config,
                handwriting={},
                watermark=(
                    request.watermark
                    or {}
                ),
                metadata=metadata,
                assignment_title=(
                    request.title
                    or document.title
                    or "Assignment"
                ),
                bookmarks_enabled=(
                    request.bookmarks
                ),
            )
        )

        renderer.render(
            pages=[
                page.to_dict()
                for page in pages
            ],
            output_path=str(
                output_path
            ),
        )

        return {
            "pdf_id": pdf_id,
            "status": "completed",
            "pages": len(pages),
            "filename": filename,
            "path": (
                f"/api/pdf/download/"
                f"{filename}"
            ),
        }

    except HTTPException:
        raise

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        )

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=(
                "Failed to generate PDF: "
                f"{error}"
            ),
        )


# ============================================================
# DOWNLOAD
# ============================================================

@router.get(
    "/download/{filename}"
)
def download_pdf(
    filename: str,
):
    """
    Download a generated PDF.
    """

    safe_filename = Path(
        filename
    ).name

    pdf_path = (
        PDF_DIRECTORY
        / safe_filename
    )

    if not pdf_path.exists():
        raise HTTPException(
            status_code=404,
            detail="PDF file not found.",
        )

    return FileResponse(
        path=str(
            pdf_path
        ),
        media_type=(
            "application/pdf"
        ),
        filename=safe_filename,
    )


__all__ = [
    "router",
    "PDFGenerateRequest",
]