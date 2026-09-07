"""
InkAI Handwriting Page Layout Engine

Step 21:
    Page layout abstraction

Step 22:
    Actual TTF glyph-width measurement

Step 23:
    Automatic page breaking

This module is responsible for deciding WHERE text goes.

It does not draw the handwriting itself.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from functools import lru_cache
from pathlib import Path
from typing import Callable, List, Optional

from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont


# ============================================================
# PAGE CONFIGURATION
# ============================================================


@dataclass(frozen=True)
class PageSize:
    width: float = 595.28
    height: float = 841.89


@dataclass(frozen=True)
class PageMargins:
    top: float = 56.0
    right: float = 50.0
    bottom: float = 56.0
    left: float = 50.0


@dataclass(frozen=True)
class HeaderConfig:
    enabled: bool = False
    text: str = ""


@dataclass(frozen=True)
class FooterConfig:
    enabled: bool = False
    text: str = ""
    show_page_number: bool = True


@dataclass(frozen=True)
class LayoutParagraph:
    text: str
    font_name: str
    font_size: float
    letter_spacing: float = 0.0
    word_spacing: float = 0.0
    paragraph_spacing: float = 0.0


@dataclass(frozen=True)
class LayoutLine:
    text: str
    paragraph_index: int
    line_index: int


@dataclass
class LayoutPage:
    page_number: int
    lines: List[LayoutLine] = field(default_factory=list)


# ============================================================
# FONT REGISTRY
# ============================================================


class FontRegistry:
    """
    Registers TTF files with ReportLab and caches the mapping.
    """

    def __init__(self):
        self._registered = {}

    def register(
        self,
        font_path: str | Path,
        font_name: Optional[str] = None,
    ) -> str:

        path = Path(font_path).resolve()

        if not path.exists():
            raise FileNotFoundError(
                f"Handwriting font not found: {path}"
            )

        if font_name is None:
            font_name = path.stem

        if font_name not in self._registered:
            pdfmetrics.registerFont(
                TTFont(
                    font_name,
                    str(path),
                )
            )

            self._registered[font_name] = str(path)

        return font_name


# ============================================================
# ACTUAL GLYPH WIDTH
# ============================================================


@lru_cache(maxsize=10000)
def _glyph_width(
    character: str,
    font_name: str,
    font_size: float,
) -> float:
    """
    Return the actual rendered width of one glyph using
    the registered TTF font.

    ReportLab calculates this from the font's real glyph
    metrics instead of estimating width from character count.
    """

    return pdfmetrics.stringWidth(
        character,
        font_name,
        font_size,
    )


def measure_text_width(
    text: str,
    font_name: str,
    font_size: float,
    letter_spacing: float = 0.0,
    word_spacing: float = 0.0,
) -> float:
    """
    Measure text using actual TTF glyph metrics.
    """

    if not text:
        return 0.0

    width = 0.0

    for character in text:
        width += _glyph_width(
            character,
            font_name,
            font_size,
        )

        if character == " ":
            width += word_spacing
        else:
            width += letter_spacing

    return width


# ============================================================
# PAGE LAYOUT ENGINE
# ============================================================


class PageLayoutEngine:
    """
    Responsible for text wrapping and page breaking.
    """

    def __init__(
        self,
        page_size: PageSize | None = None,
        margins: PageMargins | None = None,
        header: HeaderConfig | None = None,
        footer: FooterConfig | None = None,
        line_spacing: float = 1.5,
        measure_width: Callable[..., float] = measure_text_width,
    ):
        self.page_size = (
            page_size or PageSize()
        )

        self.margins = (
            margins or PageMargins()
        )

        self.header = (
            header or HeaderConfig()
        )

        self.footer = (
            footer or FooterConfig()
        )

        self.line_spacing = line_spacing
        self.measure_width = measure_width

    # ========================================================
    # AVAILABLE AREA
    # ========================================================

    @property
    def available_width(self) -> float:
        return (
            self.page_size.width
            - self.margins.left
            - self.margins.right
        )

    @property
    def available_height(self) -> float:
        return (
            self.page_size.height
            - self.margins.top
            - self.margins.bottom
        )

    # ========================================================
    # TEXT MEASUREMENT
    # ========================================================

    def text_width(
        self,
        text: str,
        font_name: str,
        font_size: float,
        letter_spacing: float = 0.0,
        word_spacing: float = 0.0,
    ) -> float:

        return self.measure_width(
            text,
            font_name,
            font_size,
            letter_spacing,
            word_spacing,
        )

    # ========================================================
    # WRAP ONE WORD
    # ========================================================

    def _break_long_word(
        self,
        word: str,
        font_name: str,
        font_size: float,
        letter_spacing: float,
    ) -> List[str]:

        chunks = []
        current = ""

        for character in word:
            candidate = current + character

            width = self.text_width(
                candidate,
                font_name,
                font_size,
                letter_spacing,
                0.0,
            )

            if (
                width <= self.available_width
                or not current
            ):
                current = candidate
            else:
                chunks.append(current)
                current = character

        if current:
            chunks.append(current)

        return chunks

    # ========================================================
    # WRAP TEXT
    # ========================================================

    def wrap_text(
        self,
        text: str,
        font_name: str,
        font_size: float,
        letter_spacing: float = 0.0,
        word_spacing: float = 0.0,
    ) -> List[str]:

        if not text:
            return [""]

        words = text.split()

        if not words:
            return [""]

        lines: List[str] = []
        current_line = ""

        for word in words:
            candidate = (
                f"{current_line} {word}"
                if current_line
                else word
            )

            candidate_width = self.text_width(
                candidate,
                font_name,
                font_size,
                letter_spacing,
                word_spacing,
            )

            if (
                candidate_width
                <= self.available_width
            ):
                current_line = candidate
                continue

            if current_line:
                lines.append(current_line)
                current_line = ""

            word_width = self.text_width(
                word,
                font_name,
                font_size,
                letter_spacing,
                0.0,
            )

            if (
                word_width
                <= self.available_width
            ):
                current_line = word
                continue

            /*
             * Long word.
             */

            chunks = self._break_long_word(
                word,
                font_name,
                font_size,
                letter_spacing,
            )

            if chunks:
                lines.extend(chunks[:-1])
                current_line = chunks[-1]

        if current_line:
            lines.append(current_line)

        return lines or [""]

    # ========================================================
    # DOCUMENT LAYOUT
    # ========================================================

    def layout_document(
        self,
        paragraphs: List[LayoutParagraph],
    ) -> List[LayoutPage]:

        pages: List[LayoutPage] = []

        current_page = LayoutPage(
            page_number=1
        )

        current_y = self.margins.top

        for paragraph_index, paragraph in enumerate(
            paragraphs
        ):

            lines = self.wrap_text(
                paragraph.text,
                paragraph.font_name,
                paragraph.font_size,
                paragraph.letter_spacing,
                paragraph.word_spacing,
            )

            line_height = (
                paragraph.font_size
                * self.line_spacing
            )

            for line_index, line in enumerate(lines):

                /*
                 * =================================================
                 * STEP 23 — AUTOMATIC PAGE BREAK
                 * =================================================
                 */

                if (
                    current_y + line_height
                    > self.page_size.height
                    - self.margins.bottom
                ):

                    pages.append(current_page)

                    current_page = LayoutPage(
                        page_number=(
                            len(pages) + 1
                        )
                    )

                    current_y = (
                        self.margins.top
                    )

                current_page.lines.append(
                    LayoutLine(
                        text=line,
                        paragraph_index=paragraph_index,
                        line_index=line_index,
                    )
                )

                current_y += line_height

            /*
             * Paragraph spacing.
             */

            current_y += (
                paragraph.paragraph_spacing
            )

        /*
         * Always retain the final page.
         */

        if (
            current_page.lines
            or not pages
        ):
            pages.append(current_page)

        return pages


# ============================================================
# CONVENIENCE FUNCTION
# ============================================================


def create_page_layout(
    paragraphs: List[LayoutParagraph],
    font_registry: FontRegistry,
    page_size: PageSize | None = None,
    margins: PageMargins | None = None,
    line_spacing: float = 1.5,
) -> List[LayoutPage]:

    engine = PageLayoutEngine(
        page_size=page_size,
        margins=margins,
        line_spacing=line_spacing,
    )

    return engine.layout_document(
        paragraphs
    )