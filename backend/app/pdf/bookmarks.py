"""
InkAI PDF Bookmarks
===================

PDF bookmark / outline helpers for structured TipTap documents.

Important:
- Does NOT modify TipTap JSON.
- Does NOT paginate documents.
- Does NOT create a second pagination system.
- Bookmarks are registered while the corresponding PDF page is active.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, List, Optional

from reportlab.pdfgen.canvas import Canvas


@dataclass
class BookmarkEntry:
    """A single PDF bookmark entry."""

    key: str
    title: str
    page_number: int
    level: int = 1


class PDFBookmarkManager:
    """
    Creates a hierarchical PDF outline.

    Page numbers are one-based because InkAI Page objects are one-based.
    ReportLab destinations are registered on the currently active page.
    """

    def __init__(
        self,
        root_title: str = "Assignment",
    ):
        self.root_title = (
            str(root_title or "Assignment").strip()
            or "Assignment"
        )

        self._root_registered = False
        self._last_level = 0
        self._level_keys: Dict[int, str] = {
            0: "assignment_root",
        }

    # ============================================================
    # TEXT EXTRACTION
    # ============================================================

    @staticmethod
    def heading_text(
        node: Dict[str, Any],
    ) -> str:
        """
        Extract visible text from a TipTap heading.

        This is only used for the PDF bookmark label.
        The original TipTap node is never modified.
        """

        parts: List[str] = []

        def walk(value: Any) -> None:
            if not isinstance(value, dict):
                return

            if value.get("type") == "text":
                parts.append(
                    str(
                        value.get(
                            "text",
                            "",
                        )
                    )
                )
                return

            if value.get("type") == "hardBreak":
                parts.append(" ")
                return

            for child in value.get("content") or []:
                walk(child)

        walk(node)

        return " ".join(
            "".join(parts).split()
        ).strip()

    # ============================================================
    # HEADING LEVEL
    # ============================================================

    @staticmethod
    def heading_level(
        node: Dict[str, Any],
    ) -> int:
        """Return a safe TipTap heading level."""

        attrs = node.get("attrs") or {}

        try:
            level = int(
                attrs.get(
                    "level",
                    1,
                )
            )
        except (
            TypeError,
            ValueError,
        ):
            level = 1

        return max(
            1,
            min(level, 6),
        )

    # ============================================================
    # ROOT
    # ============================================================

    def register_root(
        self,
        pdf: Canvas,
        *,
        title: Optional[str] = None,
    ) -> None:
        """
        Register the assignment root bookmark.

        Must be called while page 1 is active.
        """

        if self._root_registered:
            return

        root_title = (
            str(title).strip()
            if isinstance(title, str)
            and title.strip()
            else self.root_title
        )

        pdf.bookmarkPage(
            "assignment_root",
            fit="Fit",
        )

        pdf.addOutlineEntry(
            root_title,
            "assignment_root",
            level=0,
            closed=False,
        )

        self._root_registered = True
        self._last_level = 0
        self._level_keys = {
            0: "assignment_root",
        }

    # ============================================================
    # LEVEL NORMALIZATION
    # ============================================================

    def _normalize_outline_level(
        self,
        level: int,
    ) -> int:
        """
        Prevent invalid outline level jumps.

        Example:

            H1
            H3

        becomes:

            H1
              H3

        but never creates an invalid level 3 without
        an available parent level.
        """

        level = max(
            1,
            min(int(level), 6),
        )

        if level > self._last_level + 1:
            level = self._last_level + 1

        return level

    # ============================================================
    # ADD CURRENT PAGE HEADING
    # ============================================================

    def add_heading(
        self,
        pdf: Canvas,
        *,
        title: str,
        page_number: int,
        node_index: int,
        level: int,
    ) -> BookmarkEntry:
        """
        Register one heading bookmark on the currently active PDF page.
        """

        safe_title = (
            str(title or "Untitled").strip()
            or "Untitled"
        )

        safe_page = max(
            1,
            int(page_number),
        )

        safe_level = self._normalize_outline_level(
            level
        )

        key = (
            f"assignment_page_"
            f"{safe_page}_heading_"
            f"{node_index}"
        )

        # Register the current PDF page as the destination.
        pdf.bookmarkPage(
            key,
            fit="Fit",
        )

        pdf.addOutlineEntry(
            safe_title,
            key,
            level=safe_level,
            closed=False,
        )

        self._level_keys[
            safe_level
        ] = key

        # Remove stale deeper levels.
        for old_level in list(
            self._level_keys.keys()
        ):
            if old_level > safe_level:
                del self._level_keys[
                    old_level
                ]

        self._last_level = safe_level

        return BookmarkEntry(
            key=key,
            title=safe_title,
            page_number=safe_page,
            level=safe_level,
        )

    # ============================================================
    # ADD PAGE HEADINGS
    # ============================================================

    def add_page_entries(
        self,
        pdf: Canvas,
        page: Any,
    ) -> List[BookmarkEntry]:
        """
        Find heading nodes on one already-paginated page.

        The current PDF page must be active when this method is called.
        """

        page_number = getattr(
            page,
            "number",
            None,
        )

        if page_number is None and isinstance(
            page,
            dict,
        ):
            page_number = page.get(
                "pageNumber",
                page.get(
                    "number",
                    1,
                ),
            )

        try:
            page_number = max(
                1,
                int(page_number),
            )
        except (
            TypeError,
            ValueError,
        ):
            page_number = 1

        nodes = getattr(
            page,
            "nodes",
            None,
        )

        if nodes is None and isinstance(
            page,
            dict,
        ):
            nodes = page.get(
                "nodes"
            ) or []

        entries: List[
            BookmarkEntry
        ] = []

        for index, node in enumerate(
            nodes or []
        ):
            if not isinstance(
                node,
                dict,
            ):
                continue

            if node.get("type") != "heading":
                continue

            title = self.heading_text(
                node
            )

            if not title:
                continue

            level = self.heading_level(
                node
            )

            entry = self.add_heading(
                pdf,
                title=title,
                page_number=page_number,
                node_index=index,
                level=level,
            )

            entries.append(entry)

        return entries

    # ============================================================
    # STATIC COLLECTION
    # ============================================================

    @classmethod
    def collect_entries(
        cls,
        pages: List[Any],
    ) -> List[BookmarkEntry]:
        """
        Collect heading information without touching the PDF.

        Useful for inspection/testing.
        """

        manager = cls()

        entries: List[
            BookmarkEntry
        ] = []

        for page in pages:
            page_number = getattr(
                page,
                "number",
                None,
            )

            if page_number is None and isinstance(
                page,
                dict,
            ):
                page_number = page.get(
                    "pageNumber",
                    1,
                )

            try:
                page_number = max(
                    1,
                    int(page_number),
                )
            except (
                TypeError,
                ValueError,
            ):
                page_number = 1

            nodes = getattr(
                page,
                "nodes",
                None,
            )

            if nodes is None and isinstance(
                page,
                dict,
            ):
                nodes = page.get(
                    "nodes"
                ) or []

            for index, node in enumerate(
                nodes or []
            ):
                if not isinstance(
                    node,
                    dict,
                ):
                    continue

                if node.get("type") != "heading":
                    continue

                title = cls.heading_text(
                    node
                )

                if not title:
                    continue

                entries.append(
                    BookmarkEntry(
                        key=(
                            f"assignment_page_"
                            f"{page_number}_heading_"
                            f"{index}"
                        ),
                        title=title,
                        page_number=page_number,
                        level=cls.heading_level(
                            node
                        ),
                    )
                )

        return entries


# ================================================================
# BACKWARD-COMPATIBLE HELPER
# ================================================================

def bookmark_page(
    pdf: Canvas,
    key: str,
    title: str,
    *,
    level: int = 0,
    closed: bool = False,
) -> None:
    """
    Backward-compatible low-level helper.

    Registers the current canvas page and adds an outline entry.
    """

    safe_key = str(
        key
    )

    safe_title = (
        str(title or "Untitled").strip()
        or "Untitled"
    )

    pdf.bookmarkPage(
        safe_key,
        fit="Fit",
    )

    pdf.addOutlineEntry(
        safe_title,
        safe_key,
        level=max(
            0,
            int(level),
        ),
        closed=closed,
    )


__all__ = [
    "BookmarkEntry",
    "PDFBookmarkManager",
    "bookmark_page",
]