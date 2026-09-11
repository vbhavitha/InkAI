"""
InkAI PDF Font Manager
======================

Centralized ReportLab font registration.

The PDF engine does not invent a separate handwriting system.
Handwriting configuration is passed in from the existing Phase 7
configuration:

    {
        "style": "school_notebook",
        "font": "handwriting_02.ttf",
        "ink": "blue"
    }

Normal ReportLab fonts are available as fallbacks. Handwriting fonts
are loaded only when a real font file is supplied.
"""

from __future__ import annotations

from pathlib import Path
from typing import Any

from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont


BASE_DIR = Path(__file__).resolve().parent
FONTS_DIR = BASE_DIR / "fonts"

NORMAL_DIR = FONTS_DIR / "normal"
HANDWRITING_DIR = FONTS_DIR / "handwriting"
SPECIAL_DIR = FONTS_DIR / "special"


NORMAL_FONTS = {
    "normal": "Helvetica",
    "bold": "Helvetica-Bold",
    "italic": "Helvetica-Oblique",
    "bold_italic": "Helvetica-BoldOblique",
}


class FontManager:
    """Register and resolve all PDF fonts."""

    def __init__(self):
        self._registered: dict[str, str] = {}

    # --------------------------------------------------------
    # DIRECTORY HELPERS
    # --------------------------------------------------------

    def ensure_directories(self) -> None:
        for directory in (
            NORMAL_DIR,
            HANDWRITING_DIR,
            SPECIAL_DIR,
        ):
            directory.mkdir(
                parents=True,
                exist_ok=True,
            )

    # --------------------------------------------------------
    # NORMAL FONTS
    # --------------------------------------------------------

    def register_normal_fonts(self) -> dict[str, str]:
        """
        ReportLab built-in fonts need no TTFont registration.
        This method provides a stable name -> font mapping.
        """
        return dict(NORMAL_FONTS)

    # --------------------------------------------------------
    # TTF REGISTRATION
    # --------------------------------------------------------

    def register_font(
        self,
        font_path: str | Path,
        font_name: str | None = None,
    ) -> str:
        path = Path(font_path).expanduser().resolve()

        if not path.exists():
            raise FileNotFoundError(
                f"Font file not found: {path}"
            )

        if not path.is_file():
            raise ValueError(
                f"Font path is not a file: {path}"
            )

        name = (
            font_name
            or path.stem
        )

        if name in self._registered:
            return name

        pdfmetrics.registerFont(
            TTFont(
                name,
                str(path),
            )
        )

        self._registered[name] = str(path)

        return name

    # --------------------------------------------------------
    # DIRECTORY DISCOVERY
    # --------------------------------------------------------

    def find_font(
        self,
        font_value: str | None,
        *,
        directory: Path,
    ) -> Path | None:
        if not font_value:
            return None

        raw = Path(str(font_value))

        candidates = [
            directory / raw,
            directory / raw.name,
        ]

        if raw.suffix.lower() != ".ttf":
            candidates.append(
                directory / f"{raw.name}.ttf"
            )

        for candidate in candidates:
            if candidate.exists() and candidate.is_file():
                return candidate

        # Case-insensitive fallback.
        target = raw.name.lower()

        if directory.exists():
            for candidate in directory.iterdir():
                if (
                    candidate.is_file()
                    and candidate.name.lower() == target
                ):
                    return candidate

        return None

    # --------------------------------------------------------
    # HANDWRITING FONT
    # --------------------------------------------------------

    def resolve_handwriting_font(
        self,
        handwriting: dict[str, Any] | None = None,
    ) -> str:
        """
        Resolve the Phase 7 handwriting font.

        If the selected TTF exists, register and return it.
        Otherwise return a safe built-in fallback.
        """
        config = handwriting or {}

        font_value = (
            config.get("font")
            or config.get("fontFile")
            or ""
        )

        path = self.find_font(
            str(font_value),
            directory=HANDWRITING_DIR,
        )

        if path is None:
            # Some Phase 7 presets use logical font names.
            logical_name = str(
                font_value
                or config.get("style")
                or ""
            ).strip()

            if logical_name:
                path = self.find_font(
                    logical_name,
                    directory=HANDWRITING_DIR,
                )

        if path is not None:
            return self.register_font(path)

        return NORMAL_FONTS["normal"]

    # --------------------------------------------------------
    # RESOLVE
    # --------------------------------------------------------

    def resolve(
        self,
        font: str | None = None,
        *,
        bold: bool = False,
        italic: bool = False,
        handwriting: dict[str, Any] | None = None,
    ) -> str:
        """
        Resolve a font for a structured text block.

        Handwriting configuration takes precedence when supplied.
        """
        if handwriting:
            selected = self.resolve_handwriting_font(
                handwriting
            )

            if selected != NORMAL_FONTS["normal"]:
                return selected

        if font:
            normalized = str(font).strip().lower()

            aliases = {
                "normal": NORMAL_FONTS["normal"],
                "regular": NORMAL_FONTS["normal"],
                "bold": NORMAL_FONTS["bold"],
                "italic": NORMAL_FONTS["italic"],
                "oblique": NORMAL_FONTS["italic"],
                "bold_italic": NORMAL_FONTS["bold_italic"],
                "bolditalic": NORMAL_FONTS["bold_italic"],
            }

            if normalized in aliases:
                return aliases[normalized]

        if bold and italic:
            return NORMAL_FONTS["bold_italic"]

        if bold:
            return NORMAL_FONTS["bold"]

        if italic:
            return NORMAL_FONTS["italic"]

        return NORMAL_FONTS["normal"]


font_manager = FontManager()

__all__ = [
    "FONTS_DIR",
    "NORMAL_DIR",
    "HANDWRITING_DIR",
    "SPECIAL_DIR",
    "NORMAL_FONTS",
    "FontManager",
    "font_manager",
]
