"""
InkAI Assignment PDF Renderer
=============================

Consumes pages produced by the existing AssignmentPageLayout.

Responsibilities:
- Render headers.
- Render structured TipTap nodes in order.
- Use Phase 7 handwriting font configuration.
- Render footer.
- Render Page N / Page N of M.
- Respect left/center/right positioning.
- Preserve structured document nodes.
- Keep pagination outside the renderer.

IMPORTANT:
This renderer does NOT perform pagination.

Pagination is handled by AssignmentPageLayout.
"""

from __future__ import annotations

from io import BytesIO
from pathlib import Path
from typing import Any, Dict, List, Optional

from app.pdf.images import (
    calculate_image_size,
    load_image,
)
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.pdfgen import canvas

from app.pdf.fonts import font_manager
from app.pdf.layout import format_page_number

from .page_layout import (
    AssignmentPageLayout,
    PageConfig,
)


# ============================================================
# INK COLORS
# ============================================================

INK_COLORS = {
    "blue": (0.08, 0.22, 0.65),
    "black": (0.05, 0.05, 0.05),
    "red": (0.70, 0.05, 0.05),
    "green": (0.05, 0.40, 0.16),
    "gray": (0.35, 0.35, 0.35),
    "grey": (0.35, 0.35, 0.35),
}


# ============================================================
# PDF RENDERER
# ============================================================

class AssignmentPDFRenderer:
    """
    Render already-paginated assignment pages into a PDF.

    Pagination is NOT performed here.

    The renderer receives the pages produced by
    AssignmentPageLayout and only draws them.
    """

    def __init__(
        self,
        page_config: Optional[PageConfig] = None,
        handwriting: Optional[Dict[str, Any]] = None,
    ):
        self.page_config = (
            page_config
            or PageConfig()
        )

        self.layout = AssignmentPageLayout(
            self.page_config
        )

        self.handwriting = (
            handwriting
            or {}
        )

        # Make sure font directories exist.
        font_manager.ensure_directories()

    # ========================================================
    # RENDER COMPLETE PDF
    # ========================================================

    def render(
        self,
        pages: Optional[
            List[Dict[str, Any]]
        ] = None,
        output_path: Optional[str] = None,
    ):
        """
        Render all already-paginated pages.

        Returns:
            bytes containing the generated PDF.
        """

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
            output_file = Path(
                output_path
            )

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
        """
        Render one already-paginated page.
        """

        page_number = int(
            page.get(
                "pageNumber",
                page.get(
                    "number",
                    1,
                ),
            )
            or 1
        )

        nodes = page.get(
            "nodes",
            [],
        )

        # Header.
        self.render_header(pdf)

        # Structured document content.
        self.render_nodes(
            pdf,
            nodes,
        )

        # Footer + page number.
        self.render_footer(
            pdf,
            page_number,
            total_pages,
        )

    # ========================================================
    # HEADER
    # ========================================================

    def render_header(
        self,
        pdf,
    ):
        """
        Render optional assignment header.
        """

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
            bold=(
                self.page_config.header_bold
            ),
            handwriting=self.handwriting,
        )

        size = float(
            self.page_config.header_font_size
        )

        pdf.setFont(
            font_name,
            size,
        )

        self._set_ink_color(pdf)

        x = self._aligned_x(
            position=(
                self.page_config
                .header_position
            ),
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
        """
        Render structured TipTap nodes.

        The nodes have already been assigned to this
        page by AssignmentPageLayout.
        """

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
                max_width=(
                    self.layout
                    .get_usable_width()
                ),
                bottom_limit=bottom_limit,
            )

            if y <= bottom_limit:
                break

    # ========================================================
    # NODE DISPATCH
    # ========================================================

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

        # Manual page breaks have already been
        # processed by pagination.
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
                    node_type
                    == "orderedList"
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
        content = (
            node.get("content")
            or []
        )

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
        attrs = (
            node.get("attrs")
            or {}
        )

        level = int(
            attrs.get(
                "level",
                2,
            )
            or 2
        )

        size = {
            1: 18,
            2: 16,
            3: 14,
            4: 13,
            5: 12,
            6: 11,
        }.get(
            level,
            16,
        )

        text = self.extract_text(
            node
        )

        if not text:
            return (
                y
                - self.page_config.line_height
            )

        # IMPORTANT:
        # Handwriting configuration is passed here.
        font_name = font_manager.resolve(
            bold=True,
            handwriting=self.handwriting,
        )

        pdf.setFont(
            font_name,
            size,
        )

        self._set_ink_color(pdf)

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

            y -= (
                size
                + 5
            )

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
        text = self.extract_text(
            node
        )

        if not text:
            return (
                y
                - self.page_config.line_height
            )

        # ----------------------------------------------------
        # Font
        # ----------------------------------------------------

        if self.handwriting:

            font_size = float(
                self.handwriting.get(
                    "fontSize",
                    11,
                )
            )

            font_name = (
                font_manager.resolve(
                    handwriting=(
                        self.handwriting
                    )
                )
            )

        else:

            font_size = 11

            font_name = (
                "Helvetica"
            )

        # ----------------------------------------------------
        # Ink
        # ----------------------------------------------------

        self._set_ink_color(pdf)

        pdf.setFont(
            font_name,
            font_size,
        )

        # ----------------------------------------------------
        # Wrapping
        # ----------------------------------------------------

        lines = self.wrap_text(
            text,
            max_width,
            font_name,
            font_size,
        )

        # ----------------------------------------------------
        # Line spacing
        # ----------------------------------------------------

        line_spacing = float(
            self.handwriting.get(
                "lineSpacing",
                1.35,
            )
        )

        line_height = max(
            self.page_config.line_height,
            font_size
            * line_spacing,
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
        items = (
            node.get("content")
            or []
        )

        if self.handwriting:

            font_size = float(
                self.handwriting.get(
                    "fontSize",
                    11,
                )
            )

            font_name = (
                font_manager.resolve(
                    handwriting=(
                        self.handwriting
                    )
                )
            )

        else:

            font_size = 11
            font_name = "Helvetica"

        pdf.setFont(
            font_name,
            font_size,
        )

        self._set_ink_color(pdf)

        for index, item in enumerate(
            items,
            start=1,
        ):

            item_text = (
                self.extract_text(
                    item
                )
            )

            if not item_text:
                continue

            marker = (
                f"{index}."
                if ordered
                else "•"
            )

            marker_width = stringWidth(
                marker + " ",
                font_name,
                font_size,
            )

            lines = self.wrap_text(
                item_text,
                max_width
                - marker_width,
                font_name,
                font_size,
            )

            for line_index, line in enumerate(
                lines
            ):

                prefix = (
                    marker + " "
                    if line_index == 0
                    else "    "
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
        """
        Render a structured TipTap table.

        Supports:
            - header row
            - borders
            - padding
            - wrapping
            - column sizing
            - alignment
        """

        rows = (
            node.get("content")
            or []
        )

        if not rows:
            return y

        data = []

        for row in rows:

            cells = (
                row.get("content")
                or []
            )

            values = []

            for cell in cells:

                value = self.extract_text(
                    cell
                )

                values.append(
                    value
                )

            data.append(
                values
            )

        if not data:
            return y

        # --------------------------------------------------------
        # Determine available height.
        # --------------------------------------------------------

        bottom_limit = (
            self.page_config.bottom
            + self.page_config.footer_height
        )

        available_height = max(
            1.0,
            y - bottom_limit,
        )

        # --------------------------------------------------------
        # Font configuration.
        # --------------------------------------------------------

        if self.handwriting:

            font_size = float(
                self.handwriting.get(
                    "fontSize",
                    10,
                )
            )

            font_name = (
                font_manager.resolve(
                    handwriting=(
                        self.handwriting
                    )
                )
            )

        else:

            font_size = 10
            font_name = "Helvetica"

        # --------------------------------------------------------
        # Build table.
        # --------------------------------------------------------

        table = build_table(
            data,
            available_width=(
                max_width
            ),
            header_row=True,
            repeat_header=True,
            font_name=font_name,
            font_size=font_size,
            header_font_size=(
                font_size
            ),
            alignment="left",
            vertical_alignment="middle",
            cell_padding=6,
        )

        # --------------------------------------------------------
        # Calculate actual table size.
        # --------------------------------------------------------

        table_width, table_height = (
            table.wrap(
                max_width,
                available_height,
            )
        )

        # --------------------------------------------------------
        # Safety check.
        # --------------------------------------------------------

        if table_height > available_height:

            # The pagination layer should normally move the table
            # when it cannot fit. Do not allow drawing outside the
            # content area.
            return y

        # --------------------------------------------------------
        # ReportLab Table.wrap() returns the required size.
        #
        # Table.drawOn() uses bottom-left coordinates.
        # --------------------------------------------------------

        table_y = (
            y - table_height
        )

        table.drawOn(
            pdf,
            x,
            table_y,
        )

        return (
            table_y
            - 12
        )

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
        """
        Render a structured TipTap image node.

        Images:
            - preserve aspect ratio
            - never exceed content width
            - never exceed remaining page height
            - respect page margins
        """

        attrs = (
            node.get("attrs")
            or {}
        )

        src = (
            attrs.get("src")
            or attrs.get("url")
            or attrs.get("path")
        )

        if not src:
            return (
                y
                - self.page_config.line_height
            )

        try:

            resource = load_image(
                src
            )

            page_width, page_height = (
                self.layout.get_page_size()
            )

            bottom_limit = (
                self.page_config.bottom
                + self.page_config.footer_height
            )

            available_height = max(
                1.0,
                y - bottom_limit,
            )

            requested_width = (
                attrs.get("width")
            )

            requested_height = (
                attrs.get("height")
            )

            requested_width = (
                float(requested_width)
                if requested_width
                else None
            )

            requested_height = (
                float(requested_height)
                if requested_height
                else None
            )

            size = calculate_image_size(
                resource,
                max_width=max_width,
                max_height=(
                    available_height
                ),
                requested_width=(
                    requested_width
                ),
                requested_height=(
                    requested_height
                ),
            )

            # ----------------------------------------------------
            # Image coordinate.
            #
            # ReportLab uses bottom-left coordinates.
            # ----------------------------------------------------

            image_y = (
                y - size.height
            )

            if image_y < bottom_limit:

                # The authoritative pagination layer should normally
                # have placed this node on the next page.
                #
                # As a safety guard, do not draw outside the content
                # area.
                return y

            from reportlab.lib.utils import (
                ImageReader,
            )

            pdf.drawImage(
                ImageReader(
                    resource.image
                ),
                x,
                image_y,
                width=size.width,
                height=size.height,
                preserveAspectRatio=True,
                mask="auto",
            )

            return (
                image_y
                - 12
            )

        except Exception:
            return (
                y
                - self.page_config.line_height
            )

    # ========================================================
    # TEXT EXTRACTION
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

            child_text = (
                self.extract_text(
                    child
                )
            )

            if child_text:
                parts.append(
                    child_text
                )

        if node_type in (
            "paragraph",
            "heading",
            "listItem",
            "tableRow",
        ):

            separator = "\n"

        else:

            separator = " "

        return separator.join(
            parts
        ).strip()

    # ========================================================
    # TEXT WRAPPING
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

                # ------------------------------------------------
                # Break oversized word.
                # ------------------------------------------------

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

                        current = (
                            candidate_char
                        )

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
    # FOOTER
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

        # ----------------------------------------------------
        # Footer
        # ----------------------------------------------------

        if self.page_config.show_footer:

            footer_text = str(
                self.page_config.footer_text
                or ""
            ).strip()

            if footer_text:

                font_name = (
                    font_manager.resolve(
                        bold=(
                            self.page_config
                            .footer_bold
                        ),
                        handwriting=(
                            self.handwriting
                        ),
                    )
                )

                size = float(
                    self.page_config
                    .footer_font_size
                )

                pdf.setFont(
                    font_name,
                    size,
                )

                self._set_ink_color(
                    pdf
                )

                x = self._aligned_x(
                    position=(
                        self.page_config
                        .footer_position
                    ),
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

        # ----------------------------------------------------
        # Page number
        # ----------------------------------------------------

        if self.page_config.show_page_number:

            page_text = (
                format_page_number(
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
            )

            font_name = (
                font_manager.resolve(
                    bold=(
                        self.page_config
                        .page_number_bold
                    ),
                    handwriting=(
                        self.handwriting
                    ),
                )
            )

            size = float(
                self.page_config
                .page_number_font_size
            )

            pdf.setFont(
                font_name,
                size,
            )

            self._set_ink_color(
                pdf
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
            position
            or "center"
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

    # ========================================================
    # INK COLOR
    # ========================================================

    def _set_ink_color(
        self,
        pdf,
    ):
        """
        Apply selected handwriting ink color.
        """

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

        pdf.setFillColorRGB(
            *rgb
        )


__all__ = [
    "AssignmentPDFRenderer",
]