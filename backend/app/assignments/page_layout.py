"""
InkAI Assignment Page Layout
============================

Authoritative assignment pagination engine.

Responsibilities:
- Resolve PDF page size/orientation.
- Resolve margins.
- Reserve header/footer/page-number space.
- Estimate structured TipTap node heights.
- Estimate image/table heights using the reusable PDF helpers.
- Automatically paginate structured nodes.
- Preserve explicit pageBreak nodes.

This module does NOT flatten documents and does NOT implement a second
pagination algorithm. The existing assignment pagination algorithm remains
authoritative; image and table helpers are used only to calculate realistic
node heights before pagination.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, List, Optional

from app.pdf.layout import (
    DEFAULT_MARGIN_PRESET,
    DEFAULT_PAGE_SIZE,
    build_layout,
    get_page_size,
    mm_to_points,
)
from app.pdf.images import calculate_image_size, load_image
from app.pdf.tables import build_table


# ============================================================
# PAGE SIZES
# ============================================================

# Keep A5 for backwards compatibility with the existing Phase 8 UI.
PAGE_SIZES = {
    "A4": (595.28, 841.89),
    "A5": (419.53, 595.28),
    "Letter": (612.0, 792.0),
    "Legal": (612.0, 1008.0),
}


# ============================================================
# MARGIN PRESETS
# ============================================================

MARGIN_PRESETS = {
    "normal": {
        "top": mm_to_points(20),
        "right": mm_to_points(20),
        "bottom": mm_to_points(20),
        "left": mm_to_points(20),
    },
    "narrow": {
        "top": mm_to_points(12),
        "right": mm_to_points(12),
        "bottom": mm_to_points(12),
        "left": mm_to_points(12),
    },
    "wide": {
        "top": mm_to_points(30),
        "right": mm_to_points(30),
        "bottom": mm_to_points(30),
        "left": mm_to_points(30),
    },
}


# ============================================================
# PAGE CONFIGURATION
# ============================================================

@dataclass
class PageConfig:
    paper_size: str = DEFAULT_PAGE_SIZE
    orientation: str = "portrait"

    margin_preset: str = DEFAULT_MARGIN_PRESET

    top: float = MARGIN_PRESETS["normal"]["top"]
    right: float = MARGIN_PRESETS["normal"]["right"]
    bottom: float = MARGIN_PRESETS["normal"]["bottom"]
    left: float = MARGIN_PRESETS["normal"]["left"]

    # Default body line height used by the existing assignment paginator.
    line_height: float = 28

    # Space reserved for display elements.
    header_height: float = 0
    footer_height: float = 0

    # Header.
    header_enabled: bool = False
    header_text: str = ""
    header_position: str = "center"
    header_font_size: float = 11.0
    header_bold: bool = False

    # Footer.
    show_footer: bool = True
    footer_text: str = "InkAI"
    footer_position: str = "center"
    footer_font_size: float = 9.0
    footer_bold: bool = False

    # Page numbers.
    show_page_number: bool = True
    page_number_position: str = "center"
    page_number_show_total: bool = False
    page_number_prefix: str = "Page"
    page_number_font_size: float = 9.0
    page_number_bold: bool = False

    # Custom page size, in millimetres.
    custom_width_mm: float | None = None
    custom_height_mm: float | None = None


# ============================================================
# PAGE INFORMATION
# ============================================================

@dataclass
class Page:
    number: int
    nodes: List[Dict[str, Any]]

    def to_dict(self) -> Dict[str, Any]:
        return {
            "pageNumber": self.number,
            "nodes": self.nodes,
        }


# ============================================================
# PAGE LAYOUT ENGINE
# ============================================================

class AssignmentPageLayout:
    """
    Calculates page dimensions and automatically divides structured
    document nodes into pages.

    The pagination algorithm remains the existing assignment algorithm.
    The reusable app.pdf.layout module supplies page geometry and display
    configuration.

    Images and tables are still treated as structured nodes. Their estimated
    heights are calculated before the existing pagination loop decides whether
    the node fits on the current page.
    """

    def __init__(self, config: Optional[PageConfig] = None):
        self.config = config or PageConfig()
        self._layout = self._build_reusable_layout()

    # --------------------------------------------------------
    # REUSABLE PDF LAYOUT
    # --------------------------------------------------------

    def _build_reusable_layout(self):
        """
        Build the reusable PDF layout from the assignment PageConfig.

        A5 remains handled locally for backwards compatibility because
        the existing assignment UI historically exposed it.
        """
        if self.config.paper_size == "A5":
            from app.pdf.layout import (
                PageSize,
                Margins,
                HeaderConfig,
                FooterConfig,
                PageNumberConfig,
            )

            width, height = PAGE_SIZES["A5"]

            if self.config.orientation.lower() == "landscape":
                width, height = height, width

            return type(
                "AssignmentReusableLayout",
                (),
                {
                    "page_size": PageSize(
                        name="A5",
                        width=width,
                        height=height,
                    ),
                    "margins": Margins(
                        top=self.config.top,
                        right=self.config.right,
                        bottom=self.config.bottom,
                        left=self.config.left,
                    ),
                    "header": HeaderConfig(
                        enabled=self.config.header_enabled,
                        text=self.config.header_text,
                        position=self.config.header_position,
                        font_size=self.config.header_font_size,
                        bold=self.config.header_bold,
                    ),
                    "footer": FooterConfig(
                        enabled=self.config.show_footer,
                        text=self.config.footer_text,
                        position=self.config.footer_position,
                        font_size=self.config.footer_font_size,
                        bold=self.config.footer_bold,
                    ),
                    "page_numbers": PageNumberConfig(
                        enabled=self.config.show_page_number,
                        position=self.config.page_number_position,
                        show_total=self.config.page_number_show_total,
                        prefix=self.config.page_number_prefix,
                        font_size=self.config.page_number_font_size,
                        bold=self.config.page_number_bold,
                    ),
                },
            )()

        return build_layout(
            page_size=self.config.paper_size,
            orientation=self.config.orientation,
            margin_preset=self.config.margin_preset,
            custom_width_mm=self.config.custom_width_mm,
            custom_height_mm=self.config.custom_height_mm,
            custom_margins={
                "top": self.config.top / (72 / 25.4),
                "right": self.config.right / (72 / 25.4),
                "bottom": self.config.bottom / (72 / 25.4),
                "left": self.config.left / (72 / 25.4),
            },
            header_enabled=self.config.header_enabled,
            header_text=self.config.header_text,
            header_position=self.config.header_position,
            header_font_size=self.config.header_font_size,
            header_bold=self.config.header_bold,
            footer_enabled=self.config.show_footer,
            footer_text=self.config.footer_text,
            footer_position=self.config.footer_position,
            footer_font_size=self.config.footer_font_size,
            footer_bold=self.config.footer_bold,
            page_numbers_enabled=self.config.show_page_number,
            page_number_position=self.config.page_number_position,
            page_number_show_total=self.config.page_number_show_total,
            page_number_prefix=self.config.page_number_prefix,
            page_number_font_size=self.config.page_number_font_size,
            page_number_bold=self.config.page_number_bold,
        )

    # --------------------------------------------------------
    # PAGE SIZE
    # --------------------------------------------------------

    def get_page_size(self):
        if self.config.paper_size == "A5":
            width, height = PAGE_SIZES["A5"]

            if self.config.orientation.lower() == "landscape":
                width, height = height, width

            return width, height

        resolved = get_page_size(
            self.config.paper_size,
            custom_width_mm=self.config.custom_width_mm,
            custom_height_mm=self.config.custom_height_mm,
        )

        if self.config.orientation.lower() == "landscape":
            return resolved.height, resolved.width

        return resolved.width, resolved.height

    # --------------------------------------------------------
    # CONTENT BOUNDS
    # --------------------------------------------------------

    def get_usable_height(self) -> float:
        _, page_height = self.get_page_size()

        return max(
            0,
            page_height
            - self.config.top
            - self.config.bottom
            - self.config.header_height
            - self.config.footer_height,
        )

    def get_usable_width(self) -> float:
        page_width, _ = self.get_page_size()

        return max(
            0,
            page_width
            - self.config.left
            - self.config.right,
        )

    # --------------------------------------------------------
    # NODE HEIGHT
    # --------------------------------------------------------

    def estimate_node_height(self, node: Dict[str, Any]) -> float:
        """
        Estimate the height required by one structured TipTap node.

        The returned value is used only by the existing assignment
        pagination algorithm. It does not render or flatten the node.
        """
        if not isinstance(node, dict):
            return self.config.line_height

        node_type = node.get("type")

        if node_type == "pageBreak":
            return 0

        if node_type == "hardBreak":
            return self.config.line_height

        # ----------------------------------------------------
        # IMAGE
        # ----------------------------------------------------
        if node_type == "image":
            return self._estimate_image_height(node)

        # ----------------------------------------------------
        # TABLE
        # ----------------------------------------------------
        if node_type == "table":
            return self._estimate_table_height(node)

        # ----------------------------------------------------
        # LISTS
        # ----------------------------------------------------
        if node_type in ("bulletList", "orderedList"):
            items = node.get("content") or []
            total_height = 0.0

            for item in items:
                total_height += self.estimate_node_height(item)

            return max(
                total_height,
                self.config.line_height,
            )

        if node_type == "listItem":
            children = node.get("content") or []
            total_height = 0.0

            for child in children:
                total_height += self.estimate_node_height(child)

            return max(
                total_height,
                self.config.line_height,
            )

        # ----------------------------------------------------
        # HEADING
        # ----------------------------------------------------
        if node_type == "heading":
            return self.config.line_height * 1.6

        # ----------------------------------------------------
        # PARAGRAPH
        # ----------------------------------------------------
        if node_type == "paragraph":
            return self._estimate_paragraph_height(node)

        return self.config.line_height

    # --------------------------------------------------------
    # IMAGE HEIGHT
    # --------------------------------------------------------

    def _estimate_image_height(self, node: Dict[str, Any]) -> float:
        """
        Estimate an image's rendered height while respecting the usable
        page width and usable page height.

        The image helper is responsible for loading supported formats and
        maintaining aspect ratio. If the source cannot be loaded, fall back
        to the historical assignment estimate rather than breaking
        pagination.
        """
        attrs = node.get("attrs") or {}

        source = (
            attrs.get("src")
            or attrs.get("url")
            or attrs.get("path")
            or attrs.get("image")
        )

        usable_width = max(self.get_usable_width(), 100)
        usable_height = max(
            self.get_usable_height(),
            self.config.line_height,
        )

        requested_width = self._safe_positive_float(
            attrs.get("width")
        )
        requested_height = self._safe_positive_float(
            attrs.get("height")
        )

        try:
            image = load_image(source)

            if image is None:
                if requested_height:
                    return min(requested_height, usable_height)

                return self.config.line_height * 6

            width, height = calculate_image_size(
                image,
                max_width=usable_width,
                max_height=usable_height,
                requested_width=requested_width,
                requested_height=requested_height,
            )

            if height and height > 0:
                return float(height)

        except Exception:
            # Pagination should remain resilient if an image is unavailable
            # or an image helper receives malformed input.
            pass

        if requested_height:
            return min(requested_height, usable_height)

        return self.config.line_height * 6

    # --------------------------------------------------------
    # TABLE HEIGHT
    # --------------------------------------------------------

    def _estimate_table_height(self, node: Dict[str, Any]) -> float:
        """
        Estimate a table's actual ReportLab height.

        The table helper performs cell wrapping and column-width resolution.
        Calling wrap() here ensures the authoritative assignment pagination
        loop sees a height close to the final rendered table height.
        """
        rows = node.get("content") or []

        if not rows:
            return self.config.line_height

        data: List[List[Any]] = []

        for row in rows:
            if not isinstance(row, dict):
                continue

            row_type = row.get("type")
            if row_type not in ("tableRow", "row"):
                continue

            cells = row.get("content") or []
            rendered_row: List[Any] = []

            for cell in cells:
                rendered_row.append(
                    self._table_cell_content(cell)
                )

            if rendered_row:
                data.append(rendered_row)

        if not data:
            return self.config.line_height

        attrs = node.get("attrs") or {}

        column_widths = (
            attrs.get("columnWidths")
            or attrs.get("colWidths")
            or attrs.get("column_widths")
        )

        usable_width = max(self.get_usable_width(), 100)

        try:
            table = build_table(
                data,
                col_widths=column_widths,
                repeat_rows=1,
            )

            _, height = table.wrap(
                usable_width,
                max(self.get_usable_height(), self.config.line_height),
            )

            if height and height > 0:
                return float(height)

        except Exception:
            # Keep the existing pagination engine resilient. If a malformed
            # table cannot be measured, use a conservative row estimate.
            pass

        # Fallback estimate. This is intentionally only a fallback; normal
        # tables use the real ReportLab table height above.
        return max(
            len(data) * self.config.line_height * 1.4,
            self.config.line_height,
        )

    def _table_cell_content(self, cell: Dict[str, Any]) -> str:
        """
        Convert one structured TipTap table cell to text for height
        measurement. This does not modify the original document.
        """
        if not isinstance(cell, dict):
            return ""

        return self._extract_text(cell).strip()

    # --------------------------------------------------------
    # PARAGRAPH HEIGHT
    # --------------------------------------------------------

    def _estimate_paragraph_height(
        self,
        node: Dict[str, Any],
    ) -> float:
        text = self._extract_text(node)

        if not text:
            return self.config.line_height

        usable_width = max(
            self.get_usable_width(),
            100,
        )

        # Conservative average character width used by the existing
        # assignment pagination engine.
        estimated_char_width = 7.5

        chars_per_line = max(
            int(usable_width / estimated_char_width),
            10,
        )

        # Account for explicit hard breaks inside a paragraph.
        logical_lines = text.split("\n")

        line_count = 0

        for line in logical_lines:
            if not line:
                line_count += 1
                continue

            line_count += max(
                1,
                (
                    len(line)
                    + chars_per_line
                    - 1
                )
                // chars_per_line,
            )

        return max(
            line_count * self.config.line_height,
            self.config.line_height,
        )

    # --------------------------------------------------------
    # SAFE VALUE HELPERS
    # --------------------------------------------------------

    @staticmethod
    def _safe_positive_float(value: Any) -> Optional[float]:
        try:
            if value is None:
                return None

            result = float(value)

            if result <= 0:
                return None

            return result
        except (TypeError, ValueError):
            return None

    # --------------------------------------------------------
    # TEXT EXTRACTION
    # --------------------------------------------------------

    def _extract_text(
        self,
        node: Dict[str, Any],
    ) -> str:
        """
        Extract text recursively only for measurement.

        The original TipTap JSON is never replaced by this text.
        """
        if not isinstance(node, dict):
            return ""

        result: List[str] = []

        for child in node.get("content") or []:
            if not isinstance(child, dict):
                continue

            child_type = child.get("type")

            if child_type == "text":
                result.append(
                    child.get("text", "")
                )

            elif child_type == "hardBreak":
                result.append("\n")

            else:
                result.append(
                    self._extract_text(child)
                )

        return "".join(result)

    # --------------------------------------------------------
    # AUTOMATIC PAGINATION
    # --------------------------------------------------------

    def paginate(
        self,
        nodes: List[Dict[str, Any]],
    ) -> List[Page]:
        """
        Paginate structured TipTap nodes.

        This is the existing assignment pagination algorithm:
        - manual pageBreak nodes always start a new page;
        - normal nodes are kept together;
        - nodes that do not fit are moved to the next page;
        - oversized nodes are preserved as a whole node rather than
          introducing a second pagination implementation.
        """
        pages: List[Page] = []

        current_nodes: List[Dict[str, Any]] = []
        current_height = 0.0

        usable_height = max(
            self.get_usable_height(),
            self.config.line_height,
        )

        page_number = 1

        for node in nodes:
            if not isinstance(node, dict):
                continue

            node_type = node.get("type")

            # ==================================================
            # MANUAL PAGE BREAK
            # ==================================================

            if node_type == "pageBreak":
                if current_nodes:
                    pages.append(
                        Page(
                            number=page_number,
                            nodes=current_nodes,
                        )
                    )

                page_number += 1
                current_nodes = []
                current_height = 0.0

                continue

            # ==================================================
            # AUTOMATIC PAGINATION
            # ==================================================

            node_height = self.estimate_node_height(node)

            # A node larger than one page is kept intact, preserving
            # the existing assignment behavior. The renderer itself
            # remains responsible for the final drawing behavior.
            if node_height > usable_height:
                if current_nodes:
                    pages.append(
                        Page(
                            number=page_number,
                            nodes=current_nodes,
                        )
                    )

                    page_number += 1
                    current_nodes = []
                    current_height = 0.0

                current_nodes.append(node)
                current_height = node_height

                continue

            # Move the node to the next page when it does not fit.
            if (
                current_height + node_height > usable_height
                and current_nodes
            ):
                pages.append(
                    Page(
                        number=page_number,
                        nodes=current_nodes,
                    )
                )

                page_number += 1
                current_nodes = []
                current_height = 0.0

            current_nodes.append(node)
            current_height += node_height

        # Flush final page.
        if current_nodes:
            pages.append(
                Page(
                    number=page_number,
                    nodes=current_nodes,
                )
            )

        # Always return at least one page.
        if not pages:
            pages.append(
                Page(
                    number=1,
                    nodes=[],
                )
            )

        return pages


# ============================================================
# HELPER
# ============================================================

def paginate_document(
    document: Dict[str, Any] | List[Dict[str, Any]],
    config: Optional[PageConfig] = None,
) -> List[Page]:
    """
    Paginate either a structured TipTap document or a direct node list.
    """
    if isinstance(document, dict):
        nodes = document.get("content") or []
    elif isinstance(document, list):
        nodes = document
    else:
        nodes = []

    engine = AssignmentPageLayout(config)

    return engine.paginate(nodes)
