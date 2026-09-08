"""
Phase 8 — Assignment PDF Renderer

Consumes the already-paginated assignment.

Automatic pagination and manual page breaks are handled
before this renderer is called.
"""

from io import BytesIO
from typing import Any, Dict

from reportlab.pdfgen import canvas

from .page_layout import (
    PageConfig,
    AssignmentPageLayout,
)


class AssignmentPDFRenderer:

    def __init__(
        self,
        page_config: PageConfig | None = None,
    ):
        self.page_config = (
            page_config
            or PageConfig()
        )

        self.layout = AssignmentPageLayout(
            self.page_config
        )

    # ========================================================
    # RENDER
    # ========================================================

    def render(
        self,
        pages,
        output_path: str | None = None,
    ):

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

        for page in pages:

            self.render_page(
                pdf,
                page,
            )

            pdf.showPage()

        pdf.save()

        pdf_bytes = buffer.getvalue()

        buffer.close()

        if output_path:
            with open(
                output_path,
                "wb",
            ) as file:
                file.write(pdf_bytes)

        return pdf_bytes

    # ========================================================
    # RENDER PAGE
    # ========================================================

    def render_page(
        self,
        pdf,
        page,
    ):

        page_number = page.get(
            "pageNumber",
            1,
        )

        nodes = page.get(
            "nodes",
            [],
        )

        # ----------------------------------------------------
        # Page number
        # ----------------------------------------------------

        self.render_page_number(
            pdf,
            page_number,
        )

        # ----------------------------------------------------
        # Structured nodes
        # ----------------------------------------------------

        y = (
            self.layout.get_page_size()[1]
            - self.page_config.top
        )

        for node in nodes:

            node_height = (
                self.layout
                .estimate_node_height(node)
            )

            # Temporary structured rendering.
            #
            # The existing Phase 7 handwriting renderer
            # should be called here for actual handwriting
            # rendering.

            y -= node_height

    # ========================================================
    # PAGE NUMBER
    # ========================================================

    def render_page_number(
        self,
        pdf,
        page_number: int,
    ):

        page_width, _ = (
            self.layout.get_page_size()
        )

        pdf.setFont(
            "Helvetica",
            9,
        )

        pdf.drawCentredString(
            page_width / 2,
            25,
            str(page_number),
        )