"""
InkAI Handwriting Renderer

This module defines the common rendering boundary for InkAI.

Architecture:

    Structured Document
            |
            v
      Page Layout Engine
            |
            v
    Handwriting Renderer
            |
       +----+----+
       |         |
       v         v
    Browser     PDF
    Preview    Renderer

The browser canvas renderer remains responsible for the
current interactive preview.

The PDF renderer will be implemented separately.

This module should therefore remain lightweight until the
backend rendering stage is implemented.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, List

from app.handwriting.paper_styles import (
    get_paper_style,
)

from app.handwriting.page_renderer import (
    LayoutPage,
    LayoutParagraph,
    PageLayoutEngine,
    PageMargins,
    PageSize,
)


# ============================================================
# RENDER SETTINGS
# ============================================================


@dataclass(frozen=True)
class HandwritingRenderSettings:
    """
    Common settings shared by handwriting rendering targets.

    naturalness is represented internally as 0.0 - 1.0.
    """

    style: str = "neat_student"

    ink: str = "blue"

    paper: str = "ruled"

    font_size: float = 22.0

    naturalness: float = 0.5

    seed: int = 12345

    line_spacing: float = 1.5

    letter_spacing: float = 0.0

    word_spacing: float = 0.0

    paper_line_height: float | None = None
    paper_baseline_offset: float | None = None


# ============================================================
# RENDER RESULT
# ============================================================


@dataclass
class HandwritingRenderResult:
    """
    Result of the common layout stage.

    This does not contain PNG or PDF output yet.
    """

    pages: List[LayoutPage]

    settings: HandwritingRenderSettings


# ============================================================
# HANDWRITING RENDERER
# ============================================================


class HandwritingRenderer:
    """
    Common handwriting rendering boundary.

    At the current stage this class performs only the shared
    page-layout preparation.

    Actual visual rendering remains outside this class.

    Future targets:

        renderer -> browser canvas
        renderer -> PDF renderer
    """

    def __init__(
        self,
        page_size: PageSize | None = None,
        margins: PageMargins | None = None,
    ):
        self.page_size = page_size or PageSize()
        self.margins = margins or PageMargins()

    # ========================================================
    # PAGE LAYOUT
    # ========================================================

    def create_layout(
        self,
        paragraphs: List[LayoutParagraph],
        settings: HandwritingRenderSettings,
    ) -> List[LayoutPage]:
        """
        Create the page/line layout for handwriting rendering.

        No pixels or PDF files are generated here.
        """

        engine = PageLayoutEngine(
            page_size=self.page_size,
            margins=self.margins,
            line_spacing=settings.line_spacing,
        )

        return engine.layout_document(
            paragraphs
        )

    # ========================================================
    # PREPARE RENDER
    # ========================================================

    def prepare(
        self,
        paragraphs: List[LayoutParagraph],
        settings: HandwritingRenderSettings,
    ) -> HandwritingRenderResult:
        """
        Prepare a handwriting render.

        This currently performs only layout preparation.

        The returned pages can later be consumed by:

            - Browser Canvas Preview
            - PDF Renderer
        """

        pages = self.create_layout(
            paragraphs=paragraphs,
            settings=settings,
        )

        return HandwritingRenderResult(
            pages=pages,
            settings=settings,
        )

    # ========================================================
    # BROWSER PREVIEW
    # ========================================================

    def render_preview(
        self,
        paragraphs: List[LayoutParagraph],
        settings: HandwritingRenderSettings,
    ) -> HandwritingRenderResult:
        """
        Prepare data for browser preview rendering.

        The actual browser Canvas implementation remains
        on the frontend for now.
        """

        return self.prepare(
            paragraphs=paragraphs,
            settings=settings,
        )

    # ========================================================
    # PDF RENDERER
    # ========================================================

    def render_pdf(
        self,
        paragraphs: List[LayoutParagraph],
        settings: HandwritingRenderSettings,
    ) -> HandwritingRenderResult:
        """
        Prepare data for the future PDF renderer.

        Actual PDF generation is intentionally not implemented
        at this stage.
        """

        return self.prepare(
            paragraphs=paragraphs,
            settings=settings,
        )


# ============================================================
# CONVENIENCE FUNCTION
# ============================================================


def prepare_handwriting_render(
    paragraphs: List[LayoutParagraph],
    settings: HandwritingRenderSettings | None = None,
) -> HandwritingRenderResult:
    """
    Convenience function for preparing a handwriting render.
    """

    render_settings = (
        settings
        or HandwritingRenderSettings()
    )

    renderer = HandwritingRenderer()

    return renderer.prepare(
        paragraphs=paragraphs,
        settings=render_settings,
    )

def create_layout(
    self,
    paragraphs: List[LayoutParagraph],
    settings: HandwritingRenderSettings,
) -> List[LayoutPage]:

    paper = get_paper_style(
        settings.paper
    )

    line_spacing = (
        paper.line_height
        / settings.font_size
        if settings.paper_line_height is None
        else (
            settings.paper_line_height
            / settings.font_size
        )
    )

    engine = PageLayoutEngine(
        page_size=self.page_size,

        margins=PageMargins(
            top=paper.top_margin,
            right=paper.right_margin,
            bottom=paper.bottom_margin,
            left=paper.left_margin,
        ),

        line_spacing=line_spacing,
    )

    return engine.layout_document(
        paragraphs
    )