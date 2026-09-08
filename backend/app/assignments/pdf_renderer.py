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
        total_pages,
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
            total_pages,
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

    def render_footer(
        self,
        pdf,
        page_number: int,
        total_pages: int,
    ):
        """
        Render footer text and page number.
        """

        if (
            not self.page_config.show_footer
            and not self.page_config.show_page_number
        ):
            return

        page_width, _ = (
            self.layout.get_page_size()
        )

        footer_y = 16
        page_number_y = 30

        pdf.setFont(
            "Helvetica",
            9,
        )

        # --------------------------------------------------------
        # Footer separator
        # --------------------------------------------------------

        if self.page_config.show_footer:

            pdf.setStrokeColorRGB(
                0.75,
                0.75,
                0.75,
            )

            pdf.line(
                self.page_config.left,
                42,
                page_width - self.page_config.right,
                42,
            )

        # --------------------------------------------------------
        # Footer text
        # --------------------------------------------------------

        if self.page_config.show_footer:

            footer_text = (
                self.page_config.footer_text
                or ""
            )

            if footer_text:

                pdf.drawCentredString(
                    page_width / 2,
                    footer_y,
                    footer_text,
                )

        # --------------------------------------------------------
        # Page number
        # --------------------------------------------------------

        if self.page_config.show_page_number:

            page_text = (
                f"Page {page_number} "
                f"of {total_pages}"
            )

            position = (
                self.page_config
                .page_number_position
            )

            if position == "left":

                pdf.drawString(
                    self.page_config.left,
                    page_number_y,
                    page_text,
                )

            elif position == "right":

                pdf.drawRightString(
                    page_width
                    - self.page_config.right,
                    page_number_y,
                    page_text,
                )

            else:

                pdf.drawCentredString(
                    page_width / 2,
                    page_number_y,
                    page_text,
                )