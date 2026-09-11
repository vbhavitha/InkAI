"""
InkAI PDF Bookmarks
===================

Helpers for creating a hierarchical PDF bookmark/outline tree with ReportLab.

The module does not modify TipTap JSON and does not paginate documents.
It only maps structured document headings to the already-created PDF pages.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Sequence

from reportlab.pdfgen.canvas import Canvas


@dataclass
class BookmarkEntry:
    """A single PDF outline/bookmark entry."""

    title: str
    page_number: int
    level: int = 0


class PDFBookmarkManager:
    """
    Creates PDF bookmarks after assignment pagination is complete.

    ReportLab page numbers are zero-based internally for destinations, while
    InkAI Page objects are one-based. This manager accepts the latter.
    """

    def __init__(self, root_title: str = "Assignment"):
        self.root_title = root_title or "Assignment"

    @staticmethod
    def _heading_text(node: Dict[str, Any]) -> str:
        """Extract heading text without changing the original node."""
        parts: List[str] = []

        def walk(value: Any) -> None:
            if not isinstance(value, dict):
                return

            if value.get("type") == "text":
                parts.append(str(value.get("text") or ""))
                return

            if value.get("type") == "hardBreak":
                parts.append(" ")
                return

            for child in value.get("content") or []:
                walk(child)

        walk(node)

        return " ".join("".join(parts).split()).strip()

    @classmethod
    def collect_entries(
        cls,
        pages: Sequence[Any],
    ) -> List[BookmarkEntry]:
        """
        Collect heading nodes from already-paginated Page objects.

        Heading level is taken from TipTap's attrs.level. If unavailable,
        level 1 is used.
        """
        entries: List[BookmarkEntry] = []

        for page in pages:
            page_number = getattr(page, "number", None)

            if page_number is None and isinstance(page, dict):
                page_number = page.get("pageNumber", 1)

            try:
                page_number = max(1, int(page_number))
            except (TypeError, ValueError):
                page_number = 1

            nodes = getattr(page, "nodes", None)

            if nodes is None and isinstance(page, dict):
                nodes = page.get("nodes") or []

            for node in nodes or []:
                if not isinstance(node, dict):
                    continue

                if node.get("type") != "heading":
                    continue

                title = cls._heading_text(node)

                # Empty headings are not useful as PDF bookmarks.
                if not title:
                    continue

                attrs = node.get("attrs") or {}

                try:
                    level = int(attrs.get("level", 1))
                except (TypeError, ValueError):
                    level = 1

                level = max(1, min(level, 6))

                entries.append(
                    BookmarkEntry(
                        title=title,
                        page_number=page_number,
                        level=level,
                    )
                )

        return entries

    def add_bookmarks(
        self,
        pdf: Canvas,
        pages: Sequence[Any],
        *,
        assignment_title: Optional[str] = None,
    ) -> List[BookmarkEntry]:
        """
        Add the assignment root bookmark and all heading bookmarks.

        The current PDF page is expected to be the page being rendered when
        render_page() calls bookmark_page(). Therefore this method is intended
        to be called once per page from the PDF renderer, or after page
        destinations have been registered.
        """
        entries = self.collect_entries(pages)

        root_title = (
            assignment_title.strip()
            if isinstance(assignment_title, str)
            and assignment_title.strip()
            else self.root_title
        )

        if pages:
            # Page 1 is the assignment root destination.
            pdf.bookmarkPage("assignment_root", fit="Fit")
            pdf.addOutlineEntry(
                root_title,
                "assignment_root",
                level=0,
                closed=False,
            )

        parent_keys: Dict[int, str] = {0: "assignment_root"}

        for index, entry in enumerate(entries):
            key = f"assignment_bookmark_{index + 1}"

            # Registering the destination must happen while the corresponding
            # page is active. This method is therefore primarily useful when
            # called from the renderer's page loop.
            #
            # If the caller has already registered the destination, the
            # outline entry can reference it directly.
            parent_level = max(0, entry.level - 1)

            # ReportLab's outline level must not skip arbitrarily large levels.
            while parent_level not in parent_keys and parent_level > 0:
                parent_level -= 1

            parent_key = parent_keys.get(parent_level, "assignment_root")

            try:
                pdf.addOutlineEntry(
                    entry.title,
                    key,
                    level=entry.level,
                    closed=False,
                )
            except Exception:
                # Outline support must never prevent PDF generation.
                continue

            parent_keys[entry.level] = key

        return entries


def bookmark_page(
    pdf: Canvas,
    key: str,
    title: str,
    *,
    level: int = 0,
    closed: bool = False,
) -> None:
    """
    Register the current canvas page as a PDF bookmark destination and add
    it to the outline tree.
    """
    safe_key = str(key)
    safe_title = str(title or "Untitled").strip() or "Untitled"

    pdf.bookmarkPage(safe_key, fit="Fit")
    pdf.addOutlineEntry(
        safe_title,
        safe_key,
        level=max(0, int(level)),
        closed=closed,
    )


__all__ = [
    "BookmarkEntry",
    "PDFBookmarkManager",
    "bookmark_page",
]
