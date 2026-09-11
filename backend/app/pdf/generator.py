"""
InkAI PDF Generator
===================

Reusable PDF generation dispatcher.

This module understands structured document blocks:

    heading
    paragraph
    bulletList
    orderedList
    table
    image
    pageBreak

It deliberately does NOT implement a second assignment
pagination algorithm.

Pagination/layout decisions remain in the existing assignment
pipeline and reusable layout configuration.
"""

from __future__ import annotations

from pathlib import Path
from typing import Any, Callable

from reportlab.pdfgen import canvas

from app.pdf.fonts import FontManager
from app.pdf.layout import LayoutConfig


# ============================================================
# BLOCK HANDLERS
# ============================================================

BlockHandler = Callable[
    [
        canvas.Canvas,
        dict[str, Any],
    ],
    None,
]


class PDFGenerator:
    """
    Generic reusable PDF document generator.

    The generator is intentionally lightweight.

    It provides:

        - PDF document creation
        - page-size configuration
        - font resolution
        - block dispatch
        - page-break handling
        - metadata

    Assignment-specific rendering remains outside this class.
    """

    def __init__(
        self,
        *,
        layout: LayoutConfig,
        font_manager: FontManager | None = None,
    ) -> None:

        self.layout = layout

        self.font_manager = (
            font_manager
            or FontManager()
        )

        self.handlers: dict[
            str,
            BlockHandler,
        ] = {}

        self._register_default_handlers()

    # ========================================================
    # HANDLERS
    # ========================================================

    def register_handler(
        self,
        block_type: str,
        handler: BlockHandler,
    ) -> None:
        """
        Register a custom block handler.
        """

        self.handlers[
            block_type
        ] = handler

    def _register_default_handlers(
        self,
    ) -> None:

        self.register_handler(
            "heading",
            self._render_heading,
        )

        self.register_handler(
            "paragraph",
            self._render_paragraph,
        )

        self.register_handler(
            "bulletList",
            self._render_list,
        )

        self.register_handler(
            "orderedList",
            self._render_list,
        )

        self.register_handler(
            "table",
            self._render_table,
        )

        self.register_handler(
            "image",
            self._render_image,
        )

        self.register_handler(
            "pageBreak",
            self._render_page_break,
        )

    # ========================================================
    # GENERATE
    # ========================================================

    def generate(
        self,
        document: dict[str, Any],
        output_path: str | Path,
        *,
        metadata: dict[str, Any] | None = None,
    ) -> Path:

        output_path = Path(output_path)

        output_path.parent.mkdir(
            parents=True,
            exist_ok=True,
        )

        # Register available fonts before rendering.
        self.font_manager.register_all()

        pdf = canvas.Canvas(
            str(output_path),
            pagesize=(
                self.layout.page_size.width,
                self.layout.page_size.height,
            ),
        )

        self._apply_metadata(
            pdf,
            metadata or {},
        )

        blocks = self._extract_blocks(
            document
        )

        # A generic document always starts with one page.
        for index, block in enumerate(blocks):

            self.render_block(
                pdf,
                block,
            )

            # Generic page-level dispatcher.
            #
            # Assignment pagination remains outside this
            # reusable generator.
            if (
                index < len(blocks) - 1
                and block.get("type") == "pageBreak"
            ):
                continue

        pdf.save()

        return output_path

    # ========================================================
    # DOCUMENT EXTRACTION
    # ========================================================

    @staticmethod
    def _extract_blocks(
        document: dict[str, Any],
    ) -> list[dict[str, Any]]:

        if not isinstance(
            document,
            dict,
        ):
            raise ValueError(
                "PDF document must be a dictionary."
            )

        blocks = document.get(
            "blocks",
            [],
        )

        if not isinstance(
            blocks,
            list,
        ):
            raise ValueError(
                "Document blocks must be a list."
            )

        return [
            block
            for block in blocks
            if isinstance(
                block,
                dict,
            )
        ]

    # ========================================================
    # BLOCK DISPATCH
    # ========================================================

    def render_block(
        self,
        pdf: canvas.Canvas,
        block: dict[str, Any],
    ) -> None:

        block_type = str(
            block.get(
                "type",
                "paragraph",
            )
        )

        handler = self.handlers.get(
            block_type
        )

        if handler is None:
            raise ValueError(
                f"Unsupported PDF block type: "
                f"{block_type}"
            )

        handler(
            pdf,
            block,
        )

    # ========================================================
    # TEXT
    # ========================================================

    @staticmethod
    def _block_text(
        block: dict[str, Any],
    ) -> str:

        text = block.get(
            "text",
            "",
        )

        if text is None:
            return ""

        return str(text)

    # ========================================================
    # HEADING
    # ========================================================

    def _render_heading(
        self,
        pdf: canvas.Canvas,
        block: dict[str, Any],
    ) -> None:

        text = self._block_text(
            block
        )

        if not text:
            return

        font = self.font_manager.resolve(
            bold=True
        )

        pdf.setFont(
            font,
            float(
                block.get(
                    "fontSize",
                    16,
                )
            ),
        )

        pdf.drawString(
            self.layout.margins.left,
            self.layout.page_size.height
            - self.layout.margins.top,
            text,
        )

    # ========================================================
    # PARAGRAPH
    # ========================================================

    def _render_paragraph(
        self,
        pdf: canvas.Canvas,
        block: dict[str, Any],
    ) -> None:

        text = self._block_text(
            block
        )

        if not text:
            return

        handwriting_config = block.get(
            "handwriting"
        )

        use_handwriting = bool(
            handwriting_config
        )

        font = self.font_manager.resolve(
            handwriting_config=handwriting_config,
            handwriting=use_handwriting,
        )

        pdf.setFont(
            font,
            float(
                block.get(
                    "fontSize",
                    11,
                )
            ),
        )

        pdf.drawString(
            self.layout.margins.left,
            self.layout.page_size.height
            - self.layout.margins.top
            - 24,
            text,
        )

    # ========================================================
    # LIST
    # ========================================================

    def _render_list(
        self,
        pdf: canvas.Canvas,
        block: dict[str, Any],
    ) -> None:

        items = block.get(
            "items",
            [],
        )

        if not isinstance(
            items,
            list,
        ):
            return

        ordered = (
            block.get("type")
            == "orderedList"
        )

        x = self.layout.margins.left

        y = (
            self.layout.page_size.height
            - self.layout.margins.top
        )

        for index, item in enumerate(
            items,
            start=1,
        ):

            text = (
                item.get("text", "")
                if isinstance(
                    item,
                    dict,
                )
                else str(item)
            )

            prefix = (
                f"{index}. "
                if ordered
                else "• "
            )

            pdf.setFont(
                self.font_manager.resolve(),
                11,
            )

            pdf.drawString(
                x,
                y,
                prefix + str(text),
            )

            y -= 18

    # ========================================================
    # TABLE
    # ========================================================

    def _render_table(
        self,
        pdf: canvas.Canvas,
        block: dict[str, Any],
    ) -> None:
        """
        Table rendering is intentionally delegated to the
        future reusable table renderer.

        This dispatcher verifies the block and leaves
        advanced table layout to pdf/tables.py.
        """

        if not isinstance(
            block.get("rows", []),
            list,
        ):
            raise ValueError(
                "Table rows must be a list."
            )

    # ========================================================
    # IMAGE
    # ========================================================

    def _render_image(
        self,
        pdf: canvas.Canvas,
        block: dict[str, Any],
    ) -> None:
        """
        Image rendering is delegated to the reusable
        image layer.
        """

        image_path = block.get(
            "src"
        )

        if not image_path:
            return

        # Actual image sizing/placement belongs to
        # pdf/images.py.
        return

    # ========================================================
    # PAGE BREAK
    # ========================================================

    @staticmethod
    def _render_page_break(
        pdf: canvas.Canvas,
        block: dict[str, Any],
    ) -> None:

        pdf.showPage()

    # ========================================================
    # METADATA
    # ========================================================

    @staticmethod
    def _apply_metadata(
        pdf: canvas.Canvas,
        metadata: dict[str, Any],
    ) -> None:

        title = metadata.get(
            "title"
        )

        author = metadata.get(
            "author"
        )

        subject = metadata.get(
            "subject"
        )

        keywords = metadata.get(
            "keywords"
        )

        if title:
            pdf.setTitle(
                str(title)
            )

        if author:
            pdf.setAuthor(
                str(author)
            )

        if subject:
            pdf.setSubject(
                str(subject)
            )

        if keywords:
            pdf.setKeywords(
                str(keywords)
            )


__all__ = [
    "PDFGenerator",
]