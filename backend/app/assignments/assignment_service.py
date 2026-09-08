"""
Phase 8 — Assignment Service

Coordinates:

Phase 6 structured document
        ↓
Assignment configuration
        ↓
Automatic pagination
        ↓
PDF renderer / handwriting renderer
"""

from typing import Any, Dict, List, Optional

from .page_layout import (
    AssignmentPageLayout,
    PageConfig,
)


class AssignmentService:

    def __init__(
        self,
        page_config: Optional[PageConfig] = None,
    ):
        self.page_layout = AssignmentPageLayout(
            page_config
        )

    # ========================================================
    # NORMALIZE DOCUMENT
    # ========================================================

    def normalize_document(
        self,
        document: Any,
    ) -> Dict[str, Any]:

        if not document:
            return {
                "type": "doc",
                "content": [],
            }

        if isinstance(document, dict):

            if document.get("type") == "doc":
                return document

            content = document.get("content")

            if isinstance(content, list):
                return {
                    "type": "doc",
                    "content": content,
                }

        if isinstance(document, list):
            return {
                "type": "doc",
                "content": document,
            }

        raise ValueError(
            "Invalid Phase 6 structured document."
        )

    # ========================================================
    # PAGINATE
    # ========================================================

    def paginate_document(
        self,
        document: Any,
    ) -> List[Dict[str, Any]]:

        normalized = self.normalize_document(
            document
        )

        pages = self.page_layout.paginate(
            normalized
        )

        return [
            {
                "pageNumber": page.number,
                "nodes": page.nodes,
            }
            for page in pages
        ]

    # ========================================================
    # BUILD ASSIGNMENT
    # ========================================================

    def build_assignment(
        self,
        document: Any,
        assignment: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:

        assignment = assignment or {}

        pages = self.paginate_document(
            document
        )

        return {
            "assignment": assignment,
            "document": self.normalize_document(
                document
            ),
            "pages": pages,
            "pageCount": len(pages),
        }


# ============================================================
# HELPER
# ============================================================

def create_assignment_service(
    page_config: Optional[PageConfig] = None,
):
    return AssignmentService(
        page_config=page_config
    )