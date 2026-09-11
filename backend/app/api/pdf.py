from pathlib import Path
from uuid import uuid4

from fastapi import (
    APIRouter,
    HTTPException,
)
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

from app.services.pdf_service import (
    PDFService,
)


# ============================================================
# ROUTER
# ============================================================

router = APIRouter(
    prefix="/api/pdf",
    tags=["PDF"],
)


# ============================================================
# REQUEST
# ============================================================

class PDFGenerateRequest(
    BaseModel
):
    document: dict

    page: dict = Field(
        default_factory=dict
    )

    metadata: dict = Field(
        default_factory=dict
    )

    title: str | None = None

    watermark: str | None = None

    show_page_numbers: bool = False


# ============================================================
# GENERATE PDF
# ============================================================

@router.post("/generate")
def generate_pdf(
    request: PDFGenerateRequest,
):
    """
    Generic PDF generation endpoint.

    This endpoint is intentionally separate
    from /api/assignments.
    """

    try:
        pdf_service = PDFService()

        filename = (
            f"{uuid4()}.pdf"
        )

        output_path = (
            pdf_service.generate(
                document=request.document,
                filename=filename,
                page=request.page,
                metadata=request.metadata,
                title=request.title,
                watermark=request.watermark,
                show_page_numbers=(
                    request.show_page_numbers
                ),
            )
        )

        return {
            "status": "completed",
            "path": output_path,
            "filename": filename,
        }

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
    pdf_path = (
        Path("generated")
        / "pdf"
        / filename
    )

    if not pdf_path.exists():
        raise HTTPException(
            status_code=404,
            detail="PDF file not found.",
        )

    return FileResponse(
        path=str(pdf_path),
        media_type="application/pdf",
        filename=filename,
    )