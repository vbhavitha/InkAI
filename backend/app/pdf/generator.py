from pathlib import Path
from typing import Any

from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas

from .bookmarks import PDFBookmarks
from .layout import build_styles
from .metadata import apply_metadata
from .page_manager import (
    PDFPageConfig,
    build_page_config,
)
from .watermark import draw_watermark


class PDFGenerator:
    """
    Generic reusable PDF generator.

    This class does NOT know anything about assignments.

    It can later be reused for:
        - assignments
        - reports
        - certificates
        - notes
        - exports
        - other InkAI documents
    """

    def __init__(
        self,
        page_config: PDFPageConfig | None = None,
    ):
        self.page_config = (
            page_config
            or PDFPageConfig()
        )

        self.styles = build_styles()

    # ========================================================
    # VALIDATION
    # ========================================================

    def validate_document(
        self,
        document: Any,
    ) -> dict:
        """
        Validate the generic document input.
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
    # CANVAS
    # ========================================================

    def create_canvas(
        self,
        output_path: str | Path,
    ):
        output_path = Path(
            output_path
        )

        output_path.parent.mkdir(
            parents=True,
            exist_ok=True,
        )

        return canvas.Canvas(
            str(output_path),
            pagesize=(
                self.page_config.dimensions
                or A4
            ),
        )

    # ========================================================
    # PAGE DECORATION
    # ========================================================

    def draw_page(
        self,
        pdf,
        *,
        page_number: int,
        total_pages: int | None = None,
        title: str | None = None,
        watermark: str | None = None,
        show_page_numbers: bool = False,
    ):
        width = (
            self.page_config.width
        )

        height = (
            self.page_config.height
        )

        if watermark:
            draw_watermark(
                pdf,
                watermark,
                width,
                height,
            )

        if show_page_numbers:
            pdf.saveState()

            pdf.setFont(
                "Helvetica",
                8,
            )

            label = (
                f"{page_number}"
                if total_pages is None
                else f"{page_number} / {total_pages}"
            )

            pdf.drawCentredString(
                width / 2,
                self.page_config.margin_bottom
                / 2,
                label,
            )

            pdf.restoreState()

    # ========================================================
    # GENERATION
    # ========================================================

    def generate(
        self,
        document: Any,
        output_path: str | Path,
        *,
        metadata: dict | None = None,
        title: str | None = None,
        watermark: str | None = None,
        show_page_numbers: bool = False,
    ) -> str:
        """
        Generate a basic PDF from validated document data.

        Assignment-specific structured rendering will be
        connected through the PDF service layer.
        """

        document = self.validate_document(
            document
        )

        pdf = self.create_canvas(
            output_path
        )

        metadata = metadata or {}

        apply_metadata(
            pdf,
            title=(
                title
                or metadata.get("title")
            ),
            author=metadata.get(
                "author"
            ),
            subject=metadata.get(
                "subject"
            ),
            keywords=metadata.get(
                "keywords"
            ),
        )

        bookmarks = PDFBookmarks(
            pdf
        )

        # ----------------------------------------------------
        # Generic content
        # ----------------------------------------------------

        content = document.get(
            "content",
            document,
        )

        if not isinstance(
            content,
            list,
        ):
            content = [
                content
            ]

        page_number = 1

        for item in content:

            if isinstance(
                item,
                dict,
            ):
                text = (
                    item.get("text")
                    or item.get("content")
                    or ""
                )
            else:
                text = str(item)

            if isinstance(
                text,
                list,
            ):
                text = " ".join(
                    str(value)
                    for value in text
                )

            text = str(text)

            if not text.strip():
                continue

            bookmarks.add_page(
                text[:80],
                page_number,
            )

            x = (
                self.page_config.margin_left
            )

            y = (
                self.page_config.height
                - self.page_config.margin_top
            )

            pdf.setFont(
                "Helvetica",
                11,
            )

            # Basic wrapping for the generic engine.
            words = text.split()
            line = ""

            for word in words:

                candidate = (
                    f"{line} {word}".strip()
                )

                if (
                    pdf.stringWidth(
                        candidate,
                        "Helvetica",
                        11,
                    )
                    > self.page_config.content_width
                ):
                    pdf.drawString(
                        x,
                        y,
                        line,
                    )

                    y -= 16
                    line = word

                    if (
                        y
                        <= self.page_config.margin_bottom
                    ):
                        self.draw_page(
                            pdf,
                            page_number=page_number,
                            watermark=watermark,
                            show_page_numbers=show_page_numbers,
                        )

                        pdf.showPage()

                        page_number += 1

                        y = (
                            self.page_config.height
                            - self.page_config.margin_top
                        )

                else:
                    line = candidate

            if line:
                pdf.drawString(
                    x,
                    y,
                    line,
                )

            self.draw_page(
                pdf,
                page_number=page_number,
                watermark=watermark,
                show_page_numbers=show_page_numbers,
            )

            pdf.showPage()

            page_number += 1

        pdf.save()

        return str(
            Path(output_path)
        )