"""
Phase 8 — Assignment Page Layout

Handles:
- Paper size
- Orientation
- Margins
- Automatic pagination
- Manual page breaks from Phase 6
- Page numbering

Important:
This module works with structured TipTap JSON.
It does NOT flatten the document into plain text.
"""

from dataclasses import dataclass
from typing import Any, Dict, List, Optional


# ============================================================
# PAGE SIZES
# ============================================================

PAGE_SIZES = {
    "A4": (595.28, 841.89),
    "A5": (419.53, 595.28),
    "Letter": (612.0, 792.0),
}


# ============================================================
# MARGIN PRESETS
# ============================================================

MARGIN_PRESETS = {
    "normal": {
        "top": 56,
        "right": 50,
        "bottom": 56,
        "left": 50,
    },
    "narrow": {
        "top": 36,
        "right": 36,
        "bottom": 36,
        "left": 36,
    },
    "wide": {
        "top": 72,
        "right": 65,
        "bottom": 72,
        "left": 65,
    },
}


# ============================================================
# PAGE CONFIGURATION
# ============================================================

@dataclass
class PageConfig:
    paper_size: str = "A4"
    orientation: str = "portrait"

    margin_preset: str = "normal"

    top: float = 56
    right: float = 50
    bottom: float = 56
    left: float = 50

    line_height: float = 28

    header_height: float = 0

    # Reserve space for footer/page number.
    footer_height: float = 24

    # Footer settings.
    show_footer: bool = True
    footer_text: str = "InkAI"

    # Page number settings.
    show_page_number: bool = True
    page_number_position: str = "center"


# ============================================================
# PAGE INFORMATION
# ============================================================

@dataclass
class Page:
    number: int
    nodes: List[Dict[str, Any]]


# ============================================================
# PAGE LAYOUT ENGINE
# ============================================================

class AssignmentPageLayout:
    """
    Calculates page dimensions and automatically divides
    structured document nodes into pages.

    A page break node always forces a new page.

    Normal nodes are automatically moved to the next page
    when there is not enough vertical space.
    """

    def __init__(self, config: Optional[PageConfig] = None):
        self.config = config or PageConfig()

    # --------------------------------------------------------
    # PAGE SIZE
    # --------------------------------------------------------

    def get_page_size(self):
        size = PAGE_SIZES.get(
            self.config.paper_size,
            PAGE_SIZES["A4"],
        )

        width, height = size

        if self.config.orientation.lower() == "landscape":
            width, height = height, width

        return width, height

    # --------------------------------------------------------
    # USABLE PAGE HEIGHT
    # --------------------------------------------------------

    def get_usable_height(self):
        _, page_height = self.get_page_size()

        return (
            page_height
            - self.config.top
            - self.config.bottom
            - self.config.header_height
            - self.config.footer_height
        )

    # --------------------------------------------------------
    # USABLE PAGE WIDTH
    # --------------------------------------------------------

    def get_usable_width(self):
        page_width, _ = self.get_page_size()

        return (
            page_width
            - self.config.left
            - self.config.right
        )

    # --------------------------------------------------------
    # NODE HEIGHT
    # --------------------------------------------------------

    def estimate_node_height(
        self,
        node: Dict[str, Any],
    ) -> float:
        """
        Estimate how much vertical space a structured
        TipTap node requires.

        This is intentionally an estimate.

        The PDF renderer can perform more precise wrapping
        when rendering individual nodes.
        """

        node_type = node.get("type")

        # ----------------------------------------------------
        # Manual page break
        # ----------------------------------------------------

        if node_type == "pageBreak":
            return 0

        # ----------------------------------------------------
        # Hard break
        # ----------------------------------------------------

        if node_type == "hardBreak":
            return self.config.line_height

        # ----------------------------------------------------
        # Image
        # ----------------------------------------------------

        if node_type == "image":
            attrs = node.get("attrs") or {}

            height = attrs.get("height")

            if height:
                try:
                    return float(height)
                except (TypeError, ValueError):
                    pass

            return self.config.line_height * 6

        # ----------------------------------------------------
        # Table
        # ----------------------------------------------------

        if node_type == "table":
            rows = node.get("content") or []

            row_count = max(len(rows), 1)

            return row_count * (
                self.config.line_height * 1.4
            )

        # ----------------------------------------------------
        # Lists
        # ----------------------------------------------------

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

        # ----------------------------------------------------
        # List item
        # ----------------------------------------------------

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

        # ----------------------------------------------------
        # Heading
        # ----------------------------------------------------

        if node_type == "heading":
            return self.config.line_height * 1.6

        # ----------------------------------------------------
        # Paragraph
        # ----------------------------------------------------

        if node_type == "paragraph":
            return self._estimate_paragraph_height(node)

        # ----------------------------------------------------
        # Default
        # ----------------------------------------------------

        return self.config.line_height

    # --------------------------------------------------------
    # PARAGRAPH HEIGHT
    # --------------------------------------------------------

    def _estimate_paragraph_height(
        self,
        node: Dict[str, Any],
    ) -> float:
        """
        Estimate paragraph height based on text length and
        usable page width.

        This prevents very long paragraphs from being treated
        as a single line.
        """

        text = self._extract_text(node)

        if not text:
            return self.config.line_height

        # Approximate characters per line.
        #
        # This intentionally uses an estimate because actual
        # handwriting width depends on font and letter spacing.
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
            (len(text) + chars_per_line - 1)
            // chars_per_line,
        )

        return (
            line_count
            * self.config.line_height
        )

    # --------------------------------------------------------
    # EXTRACT TEXT
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
        """
        Divide structured document nodes into pages.

        Rules:

        1. Nodes are placed sequentially.
        2. When the current page runs out of space,
           a new page is created automatically.
        3. A pageBreak node always starts a new page.
        4. The pageBreak node itself is not rendered.
        """

        pages: List[Page] = []

        current_nodes: List[Dict[str, Any]] = []
        current_height = 0

        usable_height = self.get_usable_height()

        page_number = 1

        for node in nodes:

            node_type = node.get("type")

            # ==================================================
            # STEP 14 — MANUAL PAGE BREAK
            # ==================================================

            if node_type == "pageBreak":

                # Save current page.
                if current_nodes:
                    pages.append(
                        Page(
                            number=page_number,
                            nodes=current_nodes,
                        )
                    )

                # Start a new page.
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

            # --------------------------------------------------
            # If a single node is taller than the entire page
            # --------------------------------------------------

            if node_height > usable_height:

                # If page already contains content,
                # finish it first.
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

                # Add oversized node to its own page.
                current_nodes.append(node)
                current_height = node_height

                continue

            # --------------------------------------------------
            # Normal overflow
            # --------------------------------------------------

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

            # --------------------------------------------------
            # Add node to current page
            # --------------------------------------------------

            current_nodes.append(node)
            current_height += node_height

        # ======================================================
        # FINAL PAGE
        # ======================================================

        if current_nodes:
            pages.append(
                Page(
                    number=page_number,
                    nodes=current_nodes,
                )
            )

        # Empty document still gets one page.
        if not pages:
            pages.append(
                Page(
                    number=1,
                    nodes=[],
                )
            )

        return pages


# ============================================================
# HELPER FUNCTION
# ============================================================

def paginate_document(
    document: Dict[str, Any],
    config: Optional[PageConfig] = None,
) -> List[Page]:
    """
    Convenience function.

    Accepts either:

        {
            "type": "doc",
            "content": [...]
        }

    or directly a list of nodes.
    """

    if isinstance(document, dict):
        nodes = document.get("content") or []
    elif isinstance(document, list):
        nodes = document
    else:
        nodes = []

    engine = AssignmentPageLayout(config)

    return engine.paginate(nodes)