"""
InkAI Assignment PDF Renderer
=============================

Consumes pages produced by the existing AssignmentPageLayout.

Responsibilities:
- Render headers.
- Render structured TipTap nodes in order.
- Use Phase 7 handwriting font configuration when supplied.
- Render footer.
- Render Page N / Page N of M.
- Respect left/center/right positioning.
- Keep pagination outside the renderer.

This renderer does NOT create a second pagination algorithm.
"""

from __future__ import annotations

from io import BytesIO
from pathlib import Path
from typing import Any, Dict, List

from reportlab.lib.utils import ImageReader
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.pdfgen import canvas

from app.pdf.fonts import font_manager
from app.pdf.layout import format_page_number

from .page_layout import (
    AssignmentPageLayout,
    PageConfig,
)


INK_COLORS = {
    "blue": (0.08, 0.22, 0.65),
    "black": (0.05, 0.05, 0.05),
    "red": (0.70, 0.05, 0.05),
    "green": (0.05, 0.40, 0.16),
    "gray": (0.35, 0.35, 0.35),
    "grey": (0.35, 0.35, 0.35),
}


class AssignmentPDFRenderer:
    """
    Render already-paginated assignment pages into a PDF.
    """

    def __init__(
        self,
        page_config: PageConfig | None = None,
        handwriting: dict[str, Any] | None = None,
    ):
        self.page_config = (
            page_config
            or PageConfig()
        )

        self.layout = AssignmentPageLayout(
            self.page_config
        )

        self.handwriting = handwriting or {}

        font_manager.ensure_directories()

    # ========================================================
    # RENDER
    # ========================================================

    def render(
        self,
        pages: List[Dict[str, Any]] | None,
        output_path: str | None = None,
    ):
        pages = pages or [
            {
                "pageNumber": 1,
                "nodes": [],
            }
        ]

        buffer = BytesIO()

        page_width, page_height = (
            self.layout.get_page_size()
        )

        pdf = canvas.Canvas(
            buffer,
            pagesize=(
                page_width,
                page_height,
            ),
        )

        total_pages = len(pages)

        for page in pages:
            self.render_page(
                pdf,
                page,
                total_pages,
            )

            pdf.showPage()

        pdf.save()

        pdf_bytes = buffer.getvalue()
        buffer.close()

        if output_path:
            output_file = Path(output_path)
            output_file.parent.mkdir(
                parents=True,
                exist_ok=True,
            )

            output_file.write_bytes(
                pdf_bytes
            )

        return pdf_bytes

    # ========================================================
    # PAGE
    # ========================================================

    def render_page(
        self,
        pdf,
        page: Dict[str, Any],
        total_pages: int,
    ):
        page_number = int(
            page.get(
                "pageNumber",
                page.get("number", 1),
            )
            or 1
        )

        nodes = page.get(
            "nodes",
            [],
        )

        # Header is drawn before content.
        self.render_header(pdf)

        # Existing pagination already determined the nodes that belong
        # to this page. Renderer only draws them.
        self.render_nodes(
            pdf,
            nodes,
        )

        self.render_footer(
            pdf,
            page_number,
            total_pages,
        )

    # ========================================================
    # HEADER
    # ========================================================

    def render_header(self, pdf):
        if not self.page_config.header_enabled:
            return

        text = str(
            self.page_config.header_text
            or ""
        ).strip()

        if not text:
            return

        page_width, page_height = (
            self.layout.get_page_size()
        )

        font_name = font_manager.resolve(
            bold=self.page_config.header_bold
        )

        size = float(
            self.page_config.header_font_size
        )

        pdf.setFont(
            font_name,
            size,
        )

        x = self._aligned_x(
            position=self.page_config.header_position,
            text=text,
            font_name=font_name,
            font_size=size,
            page_width=page_width,
        )

        y = (
            page_height
            - self.page_config.top
            - size
        )

        pdf.drawString(
            x,
            y,
            text,
        )

    # ========================================================
    # STRUCTURED NODES
    # ========================================================

    def render_nodes(
        self,
        pdf,
        nodes: List[Dict[str, Any]],
    ):
        page_width, page_height = (
            self.layout.get_page_size()
        )

        x = self.page_config.left

        y = (
            page_height
            - self.page_config.top
            - self.page_config.header_height
        )

        bottom_limit = (
            self.page_config.bottom
            + self.page_config.footer_height
        )

        for node in nodes:
            y = self._render_node(
                pdf=pdf,
                node=node,
                x=x,
                y=y,
                max_width=self.layout.get_usable_width(),
                bottom_limit=bottom_limit,
            )

            if y <= bottom_limit:
                break

    def _render_node(
        self,
        *,
        pdf,
        node: Dict[str, Any],
        x: float,
        y: float,
        max_width: float,
        bottom_limit: float,
    ) -> float:
        node_type = (
            node.get("type")
            or "paragraph"
        )

        if node_type == "pageBreak":
            return y

        if node_type == "heading":
            return self._render_heading(
                pdf,
                node,
                x,
                y,
                max_width,
            )

        if node_type == "paragraph":
            return self._render_paragraph(
                pdf,
                node,
                x,
                y,
                max_width,
            )

        if node_type in (
            "bulletList",
            "orderedList",
        ):
            return self._render_list(
                pdf,
                node,
                x,
                y,
                max_width,
                ordered=(
                    node_type == "orderedList"
                ),
            )

        if node_type == "table":
            return self._render_table(
                pdf,
                node,
                x,
                y,
                max_width,
            )

        if node_type == "image":
            return self._render_image(
                pdf,
                node,
                x,
                y,
                max_width,
            )

        if node_type == "hardBreak":
            return (
                y
                - self.page_config.line_height
            )

        # Generic structured container.
        content = node.get("content") or []

        if content:
            for child in content:
                y = self._render_node(
                    pdf=pdf,
                    node=child,
                    x=x,
                    y=y,
                    max_width=max_width,
                    bottom_limit=bottom_limit,
                )

        return y

    # ========================================================
    # HEADING
    # ========================================================

    def _render_heading(
        self,
        pdf,
        node,
        x,
        y,
        max_width,
    ):
        attrs = node.get("attrs") or {}

        level = int(
            attrs.get("level", 2)
            or 2
        )

        size = {
            1: 18,
            2: 16,
            3: 14,
            4: 13,
            5: 12,
            6: 11,
        }.get(level, 16)

        text = self.extract_text(node)

        if not text:
            return y - self.page_config.line_height

        font_name = font_manager.resolve(
            bold=True,
            handwriting=self.handwriting,
        )

        pdf.setFont(
            font_name,
            size,
        )

        lines = self.wrap_text(
            text,
            max_width,
            font_name,
            size,
        )

        for line in lines:
            pdf.drawString(
                x,
                y - size,
                line,
            )

            y -= size + 5

        return y - 8

    # ========================================================
    # PARAGRAPH
    # ========================================================

    def _render_paragraph(
        self,
        pdf,
        node,
        x,
        y,
        max_width,
    ):
        text = self.extract_text(node)

        if not text:
            return y - self.page_config.line_height

        font_size = float(
            self.handwriting.get(
                "fontSize",
                11,
            )
        )

        # Phase 7 handwriting font is used when available.
        font_name = font_manager.resolve(
            handwriting=self.handwriting,
        )

        # Normal PDF body text should remain readable when no
        # handwriting configuration is supplied.
        if not self.handwriting:
            font_size = 11
            font_name = "Helvetica"

        ink = str(
            self.handwriting.get(
                "ink",
                "black",
            )
        ).lower()

        rgb = INK_COLORS.get(
            ink,
            INK_COLORS["black"],
        )

        pdf.setFillColorRGB(*rgb)

        pdf.setFont(
            font_name,
            font_size,
        )

        lines = self.wrap_text(
            text,
            max_width,
            font_name,
            font_size,
        )

        line_spacing = float(
            self.handwriting.get(
                "lineSpacing",
                1.35,
            )
        )

        line_height = max(
            self.page_config.line_height,
            font_size * line_spacing,
        )

        for line in lines:
            pdf.drawString(
                x,
                y - font_size,
                line,
            )

            y -= line_height

        return y - 6

    # ========================================================
    # LIST
    # ========================================================

    def _render_list(
        self,
        pdf,
        node,
        x,
        y,
        max_width,
        ordered=False,
    ):
        items = node.get("content") or []

        for index, item in enumerate(items, start=1):
            item_text = self.extract_text(
                item
            )

            if not item_text:
                continue

            marker = (
                f"{index}."
                if ordered
                else "•"
            )

            font_name = font_manager.resolve(
                handwriting=self.handwriting
            )

            font_size = float(
                self.handwriting.get(
                    "fontSize",
                    11,
                )
            )

            if not self.handwriting:
                font_name = "Helvetica"
                font_size = 11

            pdf.setFont(
                font_name,
                font_size,
            )

            marker_width = stringWidth(
                marker + " ",
                font_name,
                font_size,
            )

            lines = self.wrap_text(
                item_text,
                max_width - marker_width,
                font_name,
                font_size,
            )

            for line_index, line in enumerate(lines):
                prefix = (
                    marker + " "
                    if line_index == 0
                    else " " * 4
                )

                pdf.drawString(
                    x,
                    y - font_size,
                    prefix + line,
                )

                y -= max(
                    self.page_config.line_height,
                    font_size * 1.35,
                )

            y -= 4

        return y

    # ========================================================
    # TABLE
    # ========================================================

    def _render_table(
        self,
        pdf,
        node,
        x,
        y,
        max_width,
    ):
        rows = node.get("content") or []

        if not rows:
            return y

        font_name = font_manager.resolve(
            handwriting=self.handwriting
        )

        font_size = float(
            self.handwriting.get(
                "fontSize",
                10,
            )
        )

        if not self.handwriting:
            font_name = "Helvetica"
            font_size = 10

        pdf.setFont(
            font_name,
            font_size,
        )

        column_count = 1

        for row in rows:
            cells = row.get("content") or []
            column_count = max(
                column_count,
                len(cells),
            )

        cell_width = (
            max_width / column_count
        )

        row_height = max(
            24,
            font_size + 12,
        )

        for row in rows:
            cells = row.get("content") or []

            for column in range(
                column_count
            ):
                cell = (
                    cells[column]
                    if column < len(cells)
                    else {}
                )

                text = self.extract_text(
                    cell
                )

                cell_x = (
                    x
                    + column * cell_width
                )

                cell_y = (
                    y - row_height
                )

                pdf.rect(
                    cell_x,
                    cell_y,
                    cell_width,
                    row_height,
                )

                if text:
                    pdf.drawString(
                        cell_x + 5,
                        cell_y + 6,
                        text[:200],
                    )

            y -= row_height

        return y - 8

    # ========================================================
    # IMAGE
    # ========================================================

    def _render_image(
        self,
        pdf,
        node,
        x,
        y,
        max_width,
    ):
        attrs = node.get("attrs") or {}

        src = (
            attrs.get("src")
            or attrs.get("url")
            or attrs.get("path")
        )

        if not src:
            return y - self.page_config.line_height

        try:
            image = ImageReader(src)

            width = float(
                attrs.get(
                    "width",
                    max_width,
                )
            )

            height = float(
                attrs.get(
                    "height",
                    width * 0.6,
                )
            )

            if width > max_width:
                ratio = (
                    max_width / width
                )

                width *= ratio
                height *= ratio

            pdf.drawImage(
                image,
                x,
                y - height,
                width=width,
                height=height,
                preserveAspectRatio=True,
                mask="auto",
            )

            return y - height - 10

        except Exception:
            return y - self.page_config.line_height

    # ========================================================
    # TEXT
    # ========================================================

    def extract_text(
        self,
        node: Dict[str, Any],
    ) -> str:
        if not node:
            return ""

        node_type = node.get(
            "type"
        )

        if node_type == "text":
            return str(
                node.get(
                    "text",
                    "",
                )
            )

        if isinstance(
            node.get("text"),
            str,
        ):
            return node["text"]

        if isinstance(
            node.get("content"),
            str,
        ):
            return node["content"]

        parts = []

        for child in (
            node.get("content")
            or []
        ):
            child_text = self.extract_text(
                child
            )

            if child_text:
                parts.append(
                    child_text
                )

        separator = (
            "\n"
            if node_type in (
                "paragraph",
                "heading",
                "listItem",
                "tableRow",
            )
            else " "
        )

        return separator.join(parts).strip()

    # ========================================================
    # WRAPPING
    # ========================================================

    def wrap_text(
        self,
        text: str,
        max_width: float,
        font_name: str = "Helvetica",
        font_size: float = 11,
    ) -> List[str]:
        if not text:
            return []

        result = []

        for raw_line in str(
            text
        ).splitlines() or [""]:
            words = raw_line.split()

            if not words:
                result.append("")
                continue

            current = ""

            for word in words:
                candidate = (
                    word
                    if not current
                    else f"{current} {word}"
                )

                if (
                    stringWidth(
                        candidate,
                        font_name,
                        font_size,
                    )
                    <= max_width
                ):
                    current = candidate
                    continue

                if current:
                    result.append(
                        current
                    )

                # Break an individual oversized word.
                current = ""

                for character in word:
                    candidate_char = (
                        current
                        + character
                    )

                    if (
                        stringWidth(
                            candidate_char,
                            font_name,
                            font_size,
                        )
                        <= max_width
                    ):
                        current = candidate_char
                    else:
                        if current:
                            result.append(
                                current
                            )

                        current = character

            if current:
                result.append(
                    current
                )

        return result or [""]

    # ========================================================
    # FOOTER + PAGE NUMBER
    # ========================================================

    def render_footer(
        self,
        pdf,
        page_number: int,
        total_pages: int,
    ):
        page_width, _ = (
            self.layout.get_page_size()
        )

        # Footer.
        if self.page_config.show_footer:
            footer_text = str(
                self.page_config.footer_text
                or ""
            ).strip()

            if footer_text:
                font_name = font_manager.resolve(
                    bold=self.page_config.footer_bold
                )

                size = float(
                    self.page_config.footer_font_size
                )

                pdf.setFont(
                    font_name,
                    size,
                )

                x = self._aligned_x(
                    position=self.page_config.footer_position,
                    text=footer_text,
                    font_name=font_name,
                    font_size=size,
                    page_width=page_width,
                )

                y = (
                    self.page_config.bottom
                    - size
                )

                pdf.drawString(
                    x,
                    y,
                    footer_text,
                )

        # Page number.
        if self.page_config.show_page_number:
            page_text = format_page_number(
                page_number,
                total_pages,
                show_total=(
                    self.page_config
                    .page_number_show_total
                ),
                prefix=(
                    self.page_config
                    .page_number_prefix
                ),
            )

            font_name = font_manager.resolve(
                bold=self.page_config.page_number_bold
            )

            size = float(
                self.page_config.page_number_font_size
            )

            pdf.setFont(
                font_name,
                size,
            )

            y = max(
                8,
                self.page_config.bottom
                - size,
            )

            position = str(
                self.page_config
                .page_number_position
                or "center"
            ).lower()

            if position == "left":
                pdf.drawString(
                    self.page_config.left,
                    y,
                    page_text,
                )

            elif position == "right":
                pdf.drawRightString(
                    page_width
                    - self.page_config.right,
                    y,
                    page_text,
                )

            else:
                pdf.drawCentredString(
                    page_width / 2,
                    y,
                    page_text,
                )

    # ========================================================
    # ALIGNMENT
    # ========================================================

    def _aligned_x(
        self,
        *,
        position: str,
        text: str,
        font_name: str,
        font_size: float,
        page_width: float,
    ) -> float:
        normalized = str(
            position or "center"
        ).lower()

        if normalized == "left":
            return self.page_config.left

        if normalized == "right":
            return (
                page_width
                - self.page_config.right
                - stringWidth(
                    text,
                    font_name,
                    font_size,
                )
            )

        return (
            page_width
            - stringWidth(
                text,
                font_name,
                font_size,
            )
        ) / 2
