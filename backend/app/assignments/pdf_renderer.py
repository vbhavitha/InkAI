from __future__ import annotations

from pathlib import Path
from typing import Any, Dict, List, Optional

from reportlab.pdfgen import canvas

from app.assignments.page_layout import (
    AssignmentPageLayout,
    PageConfig,
)


class AssignmentPDFRenderer:
    """
    Render paginated InkAI assignment data into a PDF.

    Flow:

        Assignment JSON
              ↓
        Template / Assignment Service
              ↓
        Page Layout
              ↓
        Handwriting-ready pages
              ↓
        PDF Renderer
              ↓
        PDF File
    """

    def __init__(
        self,
        page_config: Optional[PageConfig] = None,
    ):
        self.page_config = page_config or PageConfig()
        self.layout = AssignmentPageLayout(
            self.page_config
        )

    def render(
        self,
        pages: List[Dict[str, Any]],
        output_path: Optional[str] = None,
    ) -> str:
        """
        Render all assignment pages into one PDF.

        Args:
            pages: Paginated assignment pages.
            output_path: Destination PDF path.

        Returns:
            Path to the generated PDF.
        """

        if not pages:
            pages = [
                {
                    "pageNumber": 1,
                    "nodes": [],
                }
            ]

        if output_path is None:
            output_path = "assignment.pdf"

        output_file = Path(output_path)

        output_file.parent.mkdir(
            parents=True,
            exist_ok=True,
        )

        page_width, page_height = (
            self.layout.get_page_size()
        )

        pdf = canvas.Canvas(
            str(output_file),
            pagesize=(page_width, page_height),
        )

        total_pages = len(pages)

        for page in pages:
            self.render_page(
                pdf=pdf,
                page=page,
                total_pages=total_pages,
            )

            pdf.showPage()

        pdf.save()

        return str(output_file)

    def render_page(
        self,
        pdf: canvas.Canvas,
        page: Dict[str, Any],
        total_pages: int,
    ) -> None:
        """
        Render one assignment page.
        """

        page_number = page.get(
            "pageNumber",
            1,
        )

        nodes = page.get(
            "nodes",
            [],
        )

        self.render_nodes(
            pdf=pdf,
            nodes=nodes,
        )

        self.render_footer(
            pdf=pdf,
            page_number=page_number,
            total_pages=total_pages,
        )

    def render_nodes(
        self,
        pdf: canvas.Canvas,
        nodes: List[Dict[str, Any]],
    ) -> None:
        """
        Basic ReportLab rendering for structured nodes.

        The handwriting renderer can later replace the
        text drawing portion while keeping this page
        and footer infrastructure intact.
        """

        page_width, page_height = (
            self.layout.get_page_size()
        )

        x = self.page_config.left
        y = (
            page_height
            - self.page_config.top
        )

        usable_width = self.layout.get_usable_width()

        for node in nodes:
            node_type = node.get(
                "type",
                "paragraph",
            )

            if node_type == "pageBreak":
                continue

            text = self.extract_text(node)

            if not text:
                continue

            if node_type == "heading":
                pdf.setFont(
                    "Helvetica-Bold",
                    16,
                )
            else:
                pdf.setFont(
                    "Helvetica",
                    11,
                )

            lines = self.wrap_text(
                text,
                usable_width,
            )

            for line in lines:
                if (
                    y
                    < self.page_config.bottom
                    + self.page_config.footer_height
                ):
                    return

                pdf.drawString(
                    x,
                    y,
                    line,
                )

                y -= self.page_config.line_height

            y -= 8

    def extract_text(
        self,
        node: Dict[str, Any],
    ) -> str:
        """
        Extract visible text from a TipTap node
        without destroying the original structured
        document.
        """

        node_type = node.get("type")

        if node_type == "text":
            return node.get(
                "text",
                "",
            )

        parts = []

        for child in node.get(
            "content",
            [],
        ):
            child_text = self.extract_text(
                child
            )

            if child_text:
                parts.append(
                    child_text
                )

        if node_type in {
            "paragraph",
            "heading",
            "listItem",
            "tableCell",
            "tableHeader",
        }:
            return " ".join(parts)

        return " ".join(parts)

    def wrap_text(
        self,
        text: str,
        max_width: float,
    ) -> List[str]:
        """
        Simple text wrapping based on ReportLab
        string width.
        """

        words = text.split()

        if not words:
            return []

        lines: List[str] = []
        current_line = ""

        pdf_font = "Helvetica"
        font_size = 11

        for word in words:
            candidate = (
                f"{current_line} {word}".strip()
            )

            width = (
                canvas.Canvas
                if False
                else 0
            )

            # Approximate width.
            # ReportLab's Helvetica average character
            # width is sufficient for this basic renderer.
            estimated_width = (
                len(candidate)
                * font_size
                * 0.5
            )

            if (
                estimated_width > max_width
                and current_line
            ):
                lines.append(
                    current_line
                )
                current_line = word
            else:
                current_line = candidate

        if current_line:
            lines.append(
                current_line
            )

        return lines

    def render_footer(
        self,
        pdf: canvas.Canvas,
        page_number: int,
        total_pages: int,
    ) -> None:
        """
        Render footer text and page numbering.
        """

        if (
            not self.page_config.show_footer
            and not self.page_config.show_page_number
        ):
            return

        page_width, _ = (
            self.layout.get_page_size()
        )

        footer_y = 16
        page_number_y = 30

        pdf.setFont(
            "Helvetica",
            9,
        )

        # Footer separator
        if self.page_config.show_footer:
            pdf.setStrokeColorRGB(
                0.75,
                0.75,
                0.75,
            )

            pdf.line(
                self.page_config.left,
                42,
                page_width
                - self.page_config.right,
                42,
            )

        # Footer text
        if self.page_config.show_footer:
            footer_text = (
                self.page_config.footer_text
                or ""
            )

            if footer_text:
                pdf.drawCentredString(
                    page_width / 2,
                    footer_y,
                    footer_text,
                )

        # Page number
        if self.page_config.show_page_number:
            page_text = (
                f"Page {page_number} "
                f"of {total_pages}"
            )

            position = (
                self.page_config
                .page_number_position
            )

            if position == "left":
                pdf.drawString(
                    self.page_config.left,
                    page_number_y,
                    page_text,
                )

            elif position == "right":
                pdf.drawRightString(
                    page_width
                    - self.page_config.right,
                    page_number_y,
                    page_text,
                )

            else:
                pdf.drawCentredString(
                    page_width / 2,
                    page_number_y,
                    page_text,
                )