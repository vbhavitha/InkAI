from __future__ import annotations

from pathlib import Path
from typing import Any, Dict, Optional

import fitz

from app.assignments.page_layout import (
    PageConfig,
    paginate_document,
)
from app.assignments.pdf_renderer import (
    AssignmentPDFRenderer,
)


# ============================================================
# PDF EXTRACTION
# ============================================================

def extract_pdf_pages(
    pdf_path: str | Path,
) -> list[dict[str, Any]]:
    """
    Extract page information from an existing PDF.

    Kept for the existing InkAI upload workflow.
    """

    pdf_path = Path(
        pdf_path
    )

    if not pdf_path.exists():
        raise FileNotFoundError(
            f"PDF file not found: {pdf_path}"
        )

    if not pdf_path.is_file():
        raise ValueError(
            f"PDF path is not a file: {pdf_path}"
        )

    if pdf_path.suffix.lower() != ".pdf":
        raise ValueError(
            "The supplied file is not a PDF."
        )

    pages: list[
        dict[str, Any]
    ] = []

    document = fitz.open(
        str(pdf_path)
    )

    try:
        for page_index in range(
            len(document)
        ):
            page = document[
                page_index
            ]

            pages.append(
                {
                    "page_number": (
                        page_index + 1
                    ),
                    "width": float(
                        page.rect.width
                    ),
                    "height": float(
                        page.rect.height
                    ),
                    "text": page.get_text(
                        "text"
                    ),
                }
            )

    finally:
        document.close()

    return pages


# ============================================================
# PDF SERVICE
# ============================================================

class PDFService:
    """
    Application-level PDF generation service.

    Uses the existing InkAI assignment pagination and renderer.

    No second pagination algorithm is introduced here.
    """

    def __init__(
        self,
        output_directory: str | Path = (
            "generated/pdf"
        ),
    ):
        self.output_directory = Path(
            output_directory
        )

        self.output_directory.mkdir(
            parents=True,
            exist_ok=True,
        )

    # ========================================================
    # VALIDATION
    # ========================================================

    @staticmethod
    def validate_document(
        document: Any,
    ) -> Dict[str, Any]:
        if document is None:
            raise ValueError(
                "Document is required."
            )

        if isinstance(
            document,
            dict,
        ):
            return document

        if isinstance(
            document,
            list,
        ):
            return {
                "content": document
            }

        raise ValueError(
            "Document must be a dictionary "
            "or list."
        )

    # ========================================================
    # GENERATE
    # ========================================================

    def generate(
        self,
        document: Any,
        *,
        filename: str,
        page_config: Optional[
            PageConfig
        ] = None,
        metadata: Optional[
            Dict[str, Any]
        ] = None,
        title: Optional[str] = None,
        handwriting: Optional[
            Dict[str, Any]
        ] = None,
        watermark: Optional[
            Dict[str, Any]
        ] = None,
        bookmarks: bool = True,
    ) -> Dict[str, Any]:
        """
        Generate a structured InkAI PDF.

        Returns:
            {
                "path": "...",
                "pages": 5,
                "filename": "..."
            }
        """

        validated_document = (
            self.validate_document(
                document
            )
        )

        config = (
            page_config
            or PageConfig()
        )

        # ----------------------------------------------------
        # AUTHORITATIVE PAGINATION
        # ----------------------------------------------------

        pages = paginate_document(
            validated_document,
            config,
        )

        # ----------------------------------------------------
        # OUTPUT
        # ----------------------------------------------------

        output_path = (
            self.output_directory
            / filename
        )

        output_path.parent.mkdir(
            parents=True,
            exist_ok=True,
        )

        # ----------------------------------------------------
        # RENDER
        # ----------------------------------------------------

        renderer = (
            AssignmentPDFRenderer(
                page_config=config,
                handwriting=(
                    handwriting
                    or {}
                ),
                watermark=(
                    watermark
                    or {}
                ),
                metadata=(
                    metadata
                    or {}
                ),
                assignment_title=(
                    title
                    or ""
                ),
                bookmarks_enabled=(
                    bookmarks
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
            "path": str(
                output_path
            ),
            "filename": filename,
            "pages": len(
                pages
            ),
        }


__all__ = [
    "PDFService",
    "extract_pdf_pages",
]