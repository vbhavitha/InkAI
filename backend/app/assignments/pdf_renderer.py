"""
InkAI Assignment PDF Renderer
=============================

Consumes pages produced by the existing AssignmentPageLayout.

Responsibilities:
- Render headers.
- Render structured TipTap nodes in order.
- Use Phase 7 handwriting font configuration.
- Render images through the reusable PDF image helpers.
- Render tables through the reusable PDF table helpers.
- Render watermark as a page-level background element.
- Render footer.
- Render Page N / Page N of M.
- Respect left/center/right positioning.
- Preserve structured document nodes.
- Keep pagination outside the renderer.

IMPORTANT:
This renderer does NOT perform pagination.

Pagination is handled by AssignmentPageLayout.
Large tables are split into structured table chunks by the assignment
pagination layer before they reach this renderer.
"""

from __future__ import annotations

from io import BytesIO
from pathlib import Path
from typing import Any, Dict, List, Optional

from reportlab.lib.utils import ImageReader
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.pdfgen import canvas

from app.pdf.images import (
    calculate_image_size,
    load_image,
)
from app.pdf.tables import build_table
from app.pdf.watermark import WatermarkRenderer
from app.pdf.bookmarks import PDFBookmarkManager
from app.pdf.metadata import PDFMetadata

from app.pdf.fonts import font_manager
from app.pdf.layout import format_page_number
from app.pdf.bookmarks import PDFBookmarkManager
from app.pdf.metadata import (
    apply_metadata,
    build_metadata,
)
from app.pdf.watermark import WatermarkRenderer

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
        watermark: Optional[Dict[str, Any]] = None,
        metadata: Optional[Dict[str, Any]] = None,
        assignment_title: Optional[str] = None,
        bookmarks_enabled: bool = True,
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

        self.watermark = WatermarkRenderer(
            watermark
        )

        self.metadata = (
            metadata
            or {}
        )

        self.assignment_title = (
            str(
                assignment_title
                or ""
            ).strip()
        )

        self.bookmarks_enabled = bool(
            bookmarks_enabled
        )

        self.bookmark_manager = (
            PDFBookmarkManager(
                root_title=(
                    self.assignment_title
                    or self._bookmark_root_title()
                )
            )
        )

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

        Pagination is NOT performed here.

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

        # ------------------------------------------------------------
        # STEP 22 — PDF METADATA
        # ------------------------------------------------------------

        metadata = build_metadata(
            title=(
                self.metadata.get(
                    "title"
                )
                or self.assignment_title
                or self._bookmark_root_title()
            ),
            author=self.metadata.get(
                "author",
                "",
            ),
            subject=self.metadata.get(
                "subject",
                "",
            ),
            keywords=self.metadata.get(
                "keywords",
                "",
            ),
            creator=self.metadata.get(
                "creator",
                "InkAI",
            ),
        )

        apply_metadata(
            pdf,
            metadata,
        )

        total_pages = len(
            pages
        )

        for page in pages:

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

            # --------------------------------------------------------
            # STEP 21 — ROOT BOOKMARK
            # --------------------------------------------------------

            if (
                self.bookmarks_enabled
                and page_number == 1
            ):
                self.bookmark_manager.register_root(
                    pdf,
                    title=(
                        self.assignment_title
                        or self._bookmark_root_title()
                    ),
                )

            # --------------------------------------------------------
            # RENDER CURRENT PAGE
            # --------------------------------------------------------

            self.render_page(
                pdf,
                page,
                total_pages,
            )

            # --------------------------------------------------------
            # STEP 21 — HEADING BOOKMARKS
            # --------------------------------------------------------

            if self.bookmarks_enabled:
                self.bookmark_manager.add_page_entries(
                    pdf,
                    page,
                )

            # --------------------------------------------------------
            # MOVE TO NEXT PDF PAGE
            # --------------------------------------------------------

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
    # STEP 20 — PDF BOOKMARKS
    # ========================================================

    def _bookmark_root_title(self) -> str:
        """Return the assignment title used for the root bookmark."""
        title = str(
            getattr(
                self.page_config,
                "header_text",
                "",
            )
            or ""
        ).strip()

        return title or "Assignment"

    def _add_page_bookmarks(
        self,
        pdf,
        page: Dict[str, Any],
    ):
        """Create heading destinations for the currently active PDF page."""
        return self.bookmark_manager.add_page_entries(pdf, page)

    def _extract_bookmark_text(
        self,
        node: Dict[str, Any],
    ) -> str:
        """Backward-compatible heading text helper."""
        return self.bookmark_manager.heading_text(node)

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

        Rendering order:

            1. Watermark background
            2. Header
            3. Structured content
            4. Footer / page number

        The watermark is intentionally not a TipTap node.
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

        # ----------------------------------------------------
        # PAGE-LEVEL WATERMARK
        # ----------------------------------------------------
        #
        # Draw this before normal content so it behaves like a background.
        # WatermarkRenderer handles opacity, rotation and positioning.
        self._draw_watermark(pdf)

        # ----------------------------------------------------
        # HEADER
        # ----------------------------------------------------

        self.render_header(pdf)

        # ----------------------------------------------------
        # STRUCTURED DOCUMENT CONTENT
        # ----------------------------------------------------

        self.render_nodes(
            pdf,
            nodes,
        )

        # ----------------------------------------------------
        # FOOTER + PAGE NUMBER
        # ----------------------------------------------------

        self.render_footer(
            pdf,
            page_number,
            total_pages,
        )

    # ========================================================
    # WATERMARK
    # ========================================================

    def _draw_watermark(
        self,
        pdf,
    ):
        """
        Draw the configured watermark on the current PDF page.

        This is a page-level operation. It never modifies the TipTap
        document and never participates in pagination.
        """
        if not self.watermark.enabled():
            return

        page_width, page_height = (
            self.layout.get_page_size()
        )

        self.watermark.draw(
            pdf,
            page_width,
            page_height,
        )

    # ============================================================
    # WATERMARK
    # ============================================================

    def _draw_watermark(
        self,
        pdf,
    ):
        """
        Draw the configured watermark as a page-level background.

        Watermarks are never TipTap nodes and never participate
        in pagination.
        """

        if not self.watermark.enabled():
            return

        page_width, page_height = (
            self.layout.get_page_size()
        )

        self.watermark.draw(
            pdf,
            page_width,
            page_height,
        )


    # ============================================================
    # BOOKMARK ROOT TITLE
    # ============================================================

    def _bookmark_root_title(
        self,
    ) -> str:
        """
        Resolve a safe root bookmark title.
        """

        header_title = str(
            getattr(
                self.page_config,
                "header_text",
                "",
            )
            or ""
        ).strip()

        return (
            header_title
            or "Assignment"
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

        The nodes have already been assigned to this page by
        AssignmentPageLayout.
        """

        page_width, page_height = (
            self.layout.get_page_size()
        )

        x = self.page_config.left

        # STEP 19 — Body coordinates are strictly inside the reserved
        # header/footer bands. The renderer never expands into those bands.
        body_top = (
            page_height
            - self.page_config.top
            - self.page_config.header_height
        )

        body_bottom = (
            self.page_config.bottom
            + self.page_config.footer_height
        )

        y = body_top
        bottom_limit = body_bottom

        for node in nodes:
            if not isinstance(node, dict):
                continue

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

        # Manual page breaks have already been processed by pagination.
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
                bottom_limit,
            )

        if node_type == "image":
            return self._render_image(
                pdf,
                node,
                x,
                y,
                max_width,
                bottom_limit,
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

            if y <= bottom_limit:
                break

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
            font_name = "Helvetica"

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
                max(
                    max_width
                    - marker_width,
                    20,
                ),
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
        bottom_limit,
    ):
        """
        Render a structured TipTap table.

        Large tables are already split into page-sized structured table
        chunks by AssignmentPageLayout. This method therefore renders only
        the table chunk assigned to the current page.

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

        data: List[List[str]] = []

        for row in rows:
            if not isinstance(row, dict):
                continue

            cells = (
                row.get("content")
                or []
            )

            values: List[str] = []

            for cell in cells:
                values.append(
                    self.extract_text(
                        cell
                    )
                )

            if values:
                data.append(values)

        if not data:
            return y

        attrs = (
            node.get("attrs")
            or {}
        )

        # TipTap/front-end aliases supported by the page settings.
        column_widths = (
            attrs.get("columnWidths")
            or attrs.get("colWidths")
            or attrs.get("column_widths")
        )

        alignments = (
            attrs.get("alignments")
            or attrs.get("alignment")
            or attrs.get("columnAlignments")
        )

        if isinstance(alignments, str):
            alignments = [
                alignments
                for _ in data[0]
            ]

        if not isinstance(alignments, (list, tuple)):
            alignments = [
                "left"
                for _ in data[0]
            ]

        try:
            header_rows = int(
                attrs.get(
                    "headerRows",
                    1,
                )
            )
        except (TypeError, ValueError):
            header_rows = 1

        header_rows = max(
            0,
            min(
                header_rows,
                len(data),
            ),
        )

        # ----------------------------------------------------
        # Build table.
        # ----------------------------------------------------

        table = build_table(
            data,
            col_widths=column_widths,
            repeat_rows=header_rows,
            header_row=header_rows > 0,
            padding=attrs.get(
                "cellPadding",
                attrs.get(
                    "cell_padding",
                    6,
                ),
            ),
            alignments=alignments,
            font_size=float(
                attrs.get(
                    "fontSize",
                    9,
                )
                or 9
            ),
            header_font_size=float(
                attrs.get(
                    "headerFontSize",
                    attrs.get(
                        "fontSize",
                        9,
                    ),
                )
                or 9
            ),
            available_width=max_width,
        )

        # ----------------------------------------------------
        # Calculate actual table size.
        # ----------------------------------------------------

        available_height = max(
            1.0,
            y - bottom_limit,
        )

        table_width, table_height = (
            table.wrap(
                max_width,
                available_height,
            )
        )

        # ----------------------------------------------------
        # Safety check.
        # ----------------------------------------------------
        #
        # Normally AssignmentPageLayout has already moved/split the table.
        # Do not draw outside the current page's content bounds if a
        # malformed/custom table somehow remains too large.

        if table_height > available_height:
            return y

        # ----------------------------------------------------
        # ReportLab Table.drawOn() uses bottom-left coordinates.
        # ----------------------------------------------------

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
        bottom_limit,
    ):
        """
        Render a structured TipTap image node.

        Images:
        - support PNG/JPEG/WEBP through app.pdf.images
        - preserve aspect ratio
        - resize large images
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
            or attrs.get("image")
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

            if resource is None:
                return (
                    y
                    - self.page_config.line_height
                )

            page_width, page_height = (
                self.layout.get_page_size()
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

            try:
                requested_width = (
                    float(requested_width)
                    if requested_width
                    else None
                )
            except (TypeError, ValueError):
                requested_width = None

            try:
                requested_height = (
                    float(requested_height)
                    if requested_height
                    else None
                )
            except (TypeError, ValueError):
                requested_height = None

            size = calculate_image_size(
                resource,
                max_width=max_width,
                max_height=available_height,
                requested_width=requested_width,
                requested_height=requested_height,
            )

            # The helper may return either a size object or a tuple depending
            # on the reusable image helper implementation.
            image_width, image_height = self._normalize_image_size(
                size
            )

            if image_width <= 0 or image_height <= 0:
                return (
                    y
                    - self.page_config.line_height
                )

            image_y = (
                y - image_height
            )

            if image_y < bottom_limit:
                # The authoritative pagination layer should normally have
                # placed this node on the next page.
                return y

            image_source = getattr(
                resource,
                "image",
                resource,
            )

            pdf.drawImage(
                ImageReader(
                    image_source
                ),
                x,
                image_y,
                width=image_width,
                height=image_height,
                preserveAspectRatio=True,
                mask="auto",
            )

            return (
                image_y
                - 12
            )

        except Exception:
            # A bad image must not break assignment generation.
            return (
                y
                - self.page_config.line_height
            )

    @staticmethod
    def _normalize_image_size(
        size,
    ) -> tuple[float, float]:
        """
        Normalize calculate_image_size() output.

        Supports the reusable helper's Size-like object as well as a normal
        (width, height) tuple.
        """
        if hasattr(size, "width") and hasattr(
            size,
            "height",
        ):
            return (
                float(size.width),
                float(size.height),
            )

        if isinstance(size, (tuple, list)) and len(size) >= 2:
            return (
                float(size[0]),
                float(size[1]),
            )

        raise ValueError(
            "Unsupported image size result"
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

        parts: List[str] = []

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

        max_width = max(
            float(max_width),
            20.0,
        )

        result: List[str] = []

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
