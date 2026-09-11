from __future__ import annotations

from pathlib import Path
from typing import Any

from app.pdf.generator import PDFGenerator
from app.pdf.page_manager import build_page_config


# ============================================================
# PDF UPLOAD / EXTRACTION
# ============================================================

def extract_pdf_pages(
    pdf_path: str | Path,
) -> list[dict[str, Any]]:
    """
    Extract pages from an existing PDF.

    This function is kept here because the existing InkAI
    upload workflow imports it from:

        app.services.pdf_service

    The reusable PDF generation engine is separate from this
    extraction functionality.
    """

    pdf_path = Path(pdf_path)

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

    try:
        import fitz
    except ImportError as error:
        raise RuntimeError(
            "PyMuPDF is required for PDF page extraction. "
            "Install it with: pip install pymupdf"
        ) from error

    pages: list[dict[str, Any]] = []

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
# REUSABLE PDF SERVICE
# ============================================================

class PDFService:
    """
    Application-level reusable PDF service.

    Flow:

        Document JSON
              ↓
           Validate
              ↓
        Configure PDF
              ↓
           Render
              ↓
            Save
              ↓
        Return PDF path

    This service is intentionally independent from
    assignment-specific business logic.
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

    def validate(
        self,
        document: Any,
    ) -> dict:
        """
        Validate a generic document.

        Structured dictionaries and lists are accepted.
        """

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
            "Document must be a dictionary or list."
        )

    # ========================================================
    # GENERATE
    # ========================================================

    def generate(
        self,
        document: Any,
        *,
        filename: str,
        page: dict | None = None,
        metadata: dict | None = None,
        title: str | None = None,
        watermark: str | None = None,
        show_page_numbers: bool = False,
    ) -> str:
        """
        Validate, configure, render and save a PDF.
        """

        validated_document = (
            self.validate(
                document
            )
        )

        page_config = (
            build_page_config(
                page or {}
            )
        )

        generator = PDFGenerator(
            page_config=page_config
        )

        output_path = (
            self.output_directory
            / filename
        )

        return generator.generate(
            validated_document,
            output_path,
            metadata=(
                metadata or {}
            ),
            title=title,
            watermark=watermark,
            show_page_numbers=(
                show_page_numbers
            ),
        )