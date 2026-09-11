"""
InkAI Assignment Page Layout
============================

Authoritative assignment pagination engine.

Responsibilities:
- Resolve PDF page size/orientation.
- Resolve margins.
- Reserve header/footer/page-number space.
- Estimate structured TipTap node heights.
- Automatically paginate structured nodes.
- Preserve explicit pageBreak nodes.

This module does NOT flatten documents and does NOT implement a second
pagination algorithm. It is the existing assignment pagination layer,
now backed by the reusable PDF layout configuration.
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
    The reusable app.pdf.layout module only supplies page geometry and
    display-space configuration.
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
            # A5 compatibility path. Geometry is equivalent to the
            # existing assignment engine.
            from app.pdf.layout import PageSize, Margins, HeaderConfig, FooterConfig, PageNumberConfig

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

    def get_usable_height(self):
        _, page_height = self.get_page_size()

        return max(
            0,
            page_height
            - self.config.top
            - self.config.bottom
            - self.config.header_height
            - self.config.footer_height,
        )

    def get_usable_width(self):
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

    def estimate_node_height(
        self,
        node: Dict[str, Any],
    ) -> float:
        node_type = node.get("type")

        if node_type == "pageBreak":
            return 0

        if node_type == "hardBreak":
            return self.config.line_height

        if node_type == "image":
            attrs = node.get("attrs") or {}

            height = attrs.get("height")

            if height:
                try:
                    return float(height)
                except (TypeError, ValueError):
                    pass

            return self.config.line_height * 6

        if node_type == "table":
            rows = node.get("content") or []
            row_count = max(len(rows), 1)

            return row_count * (
                self.config.line_height * 1.4
            )

        if node_type in (
            "bulletList",
            "orderedList",
        ):
            items = node.get("content") or []

            total_height = 0

            for item in items:
                total_height += self.estimate_node_height(
                    item
                )

            return max(
                total_height,
                self.config.line_height,
            )

        if node_type == "listItem":
            children = node.get("content") or []

            total_height = 0

            for child in children:
                total_height += self.estimate_node_height(
                    child
                )

            return max(
                total_height,
                self.config.line_height,
            )

        if node_type == "heading":
            return self.config.line_height * 1.6

        if node_type == "paragraph":
            return self._estimate_paragraph_height(node)

        return self.config.line_height

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

        estimated_char_width = 7.5

        chars_per_line = max(
            int(
                usable_width
                / estimated_char_width
            ),
            10,
        )

        line_count = max(
            1,
            (
                len(text)
                + chars_per_line
                - 1
            )
            // chars_per_line,
        )

        return (
            line_count
            * self.config.line_height
        )

    # --------------------------------------------------------
    # TEXT EXTRACTION
    # --------------------------------------------------------

    def _extract_text(
        self,
        node: Dict[str, Any],
    ) -> str:
        result = []

        for child in node.get("content") or []:
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
        pages: List[Page] = []

        current_nodes: List[Dict[str, Any]] = []
        current_height = 0

        usable_height = max(
            self.get_usable_height(),
            self.config.line_height,
        )

        page_number = 1

        for node in nodes:
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
                current_height = 0

                continue

            # ==================================================
            # AUTOMATIC PAGINATION
            # ==================================================

            node_height = self.estimate_node_height(
                node
            )

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
                    current_height = 0

                current_nodes.append(node)
                current_height = node_height

                continue

            if (
                current_height + node_height
                > usable_height
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
                current_height = 0

            current_nodes.append(node)
            current_height += node_height

        if current_nodes:
            pages.append(
                Page(
                    number=page_number,
                    nodes=current_nodes,
                )
            )

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
    document: Dict[str, Any],
    config: Optional[PageConfig] = None,
) -> List[Page]:
    if isinstance(document, dict):
        nodes = document.get("content") or []
    elif isinstance(document, list):
        nodes = document
    else:
        nodes = []

    engine = AssignmentPageLayout(config)

    return engine.paginate(nodes)
