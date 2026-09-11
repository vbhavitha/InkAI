"""
InkAI PDF Font Manager
======================

Reusable ReportLab font registration and font resolution.

Font categories:

    fonts/
    ├── normal/
    ├── handwriting/
    └── special/

The font manager does NOT create handwriting styles.

Phase 7 owns handwriting configuration.

The PDF engine receives the selected handwriting font and
registers/resolves it here.
"""

from __future__ import annotations

from pathlib import Path
from typing import Any

from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont


# ============================================================
# FONT DIRECTORIES
# ============================================================

BACKEND_ROOT = Path(__file__).resolve().parents[2]

FONTS_ROOT = BACKEND_ROOT / "fonts"

NORMAL_FONTS_DIR = FONTS_ROOT / "normal"
HANDWRITING_FONTS_DIR = FONTS_ROOT / "handwriting"
SPECIAL_FONTS_DIR = FONTS_ROOT / "special"


# ============================================================
# DEFAULT FONTS
# ============================================================

DEFAULT_NORMAL_FONT = "Helvetica"
DEFAULT_BOLD_FONT = "Helvetica-Bold"
DEFAULT_ITALIC_FONT = "Helvetica-Oblique"
DEFAULT_BOLD_ITALIC_FONT = "Helvetica-BoldOblique"


# ============================================================
# FONT MANAGER
# ============================================================

class FontManager:
    """
    Central font registry for the InkAI PDF engine.

    Responsibilities:

        - Discover .ttf fonts
        - Register fonts with ReportLab
        - Resolve normal/bold/italic variants
        - Resolve Phase 7 handwriting fonts
        - Prevent duplicate ReportLab registration
    """

    def __init__(
        self,
        fonts_root: str | Path | None = None,
    ) -> None:

        self.fonts_root = Path(
            fonts_root
            if fonts_root is not None
            else FONTS_ROOT
        )

        self.normal_directory = (
            self.fonts_root / "normal"
        )

        self.handwriting_directory = (
            self.fonts_root / "handwriting"
        )

        self.special_directory = (
            self.fonts_root / "special"
        )

        self._registered_fonts: dict[
            str,
            str
        ] = {}

    # ========================================================
    # DIRECTORY SETUP
    # ========================================================

    def ensure_directories(self) -> None:
        """
        Create the expected font directory structure.
        """

        self.normal_directory.mkdir(
            parents=True,
            exist_ok=True,
        )

        self.handwriting_directory.mkdir(
            parents=True,
            exist_ok=True,
        )

        self.special_directory.mkdir(
            parents=True,
            exist_ok=True,
        )

    # ========================================================
    # FONT NAME
    # ========================================================

    @staticmethod
    def font_name_from_path(
        font_path: str | Path,
    ) -> str:
        """
        Create a stable ReportLab font name from a file.

        Example:

            handwriting_02.ttf

        becomes:

            handwriting_02
        """

        return Path(font_path).stem

    # ========================================================
    # REGISTER ONE FONT
    # ========================================================

    def register_font(
        self,
        font_path: str | Path,
        *,
        font_name: str | None = None,
    ) -> str:
        """
        Register a TrueType font with ReportLab.

        Returns the ReportLab font name.
        """

        path = Path(font_path)

        if not path.exists():
            raise FileNotFoundError(
                f"Font file not found: {path}"
            )

        if path.suffix.lower() != ".ttf":
            raise ValueError(
                f"Unsupported font format: {path}"
            )

        name = (
            font_name
            or self.font_name_from_path(path)
        )

        # Already registered by this manager.
        if name in self._registered_fonts:
            return name

        # Already registered globally by ReportLab.
        if name in pdfmetrics.getRegisteredFontNames():
            self._registered_fonts[name] = str(path)
            return name

        pdfmetrics.registerFont(
            TTFont(
                name,
                str(path),
            )
        )

        self._registered_fonts[name] = str(path)

        return name

    # ========================================================
    # REGISTER DIRECTORY
    # ========================================================

    def register_directory(
        self,
        directory: str | Path,
    ) -> dict[str, str]:
        """
        Register every .ttf file inside a directory.

        Returns:

            {
                "font_name": "/path/to/font.ttf"
            }
        """

        directory = Path(directory)

        if not directory.exists():
            return {}

        registered: dict[str, str] = {}

        for font_path in sorted(
            directory.glob("*.ttf")
        ):
            name = self.register_font(
                font_path
            )

            registered[name] = str(
                font_path
            )

        return registered

    # ========================================================
    # REGISTER ALL STANDARD FONTS
    # ========================================================

    def register_all(self) -> dict[str, dict[str, str]]:
        """
        Register fonts from all InkAI font categories.
        """

        self.ensure_directories()

        return {
            "normal": self.register_directory(
                self.normal_directory
            ),
            "handwriting": self.register_directory(
                self.handwriting_directory
            ),
            "special": self.register_directory(
                self.special_directory
            ),
        }

    # ========================================================
    # HANDWRITING FONT
    # ========================================================

    def register_handwriting_font(
        self,
        font: str | Path,
    ) -> str:
        """
        Register a Phase 7 handwriting font.

        `font` can be:

            handwriting_02.ttf

        or:

            /absolute/path/to/font.ttf
        """

        candidate = Path(font)

        if not candidate.is_absolute():
            candidate = (
                self.handwriting_directory
                / candidate
            )

        return self.register_font(
            candidate
        )

    # ========================================================
    # RESOLVE NORMAL FONT
    # ========================================================

    def resolve_normal_font(
        self,
        *,
        bold: bool = False,
        italic: bool = False,
    ) -> str:
        """
        Resolve normal ReportLab font variant.

        Returns built-in Helvetica variants unless
        a future custom normal font system is added.
        """

        if bold and italic:
            return DEFAULT_BOLD_ITALIC_FONT

        if bold:
            return DEFAULT_BOLD_FONT

        if italic:
            return DEFAULT_ITALIC_FONT

        return DEFAULT_NORMAL_FONT

    # ========================================================
    # RESOLVE HANDWRITING FONT
    # ========================================================

    def resolve_handwriting_font(
        self,
        handwriting_config: dict[str, Any] | None,
    ) -> str:
        """
        Resolve the handwriting font from Phase 7
        handwriting configuration.

        Expected configuration:

            {
                "style": "school_notebook",
                "font": "handwriting_02.ttf",
                "ink": "blue"
            }

        The style does NOT select the font.

        Phase 7 provides the actual selected font.
        """

        config = handwriting_config or {}

        font = config.get("font")

        if not font:
            raise ValueError(
                "Phase 7 handwriting configuration "
                "does not contain a font."
            )

        return self.register_handwriting_font(
            str(font)
        )

    # ========================================================
    # GENERIC RESOLUTION
    # ========================================================

    def resolve(
        self,
        *,
        handwriting_config: dict[str, Any] | None = None,
        bold: bool = False,
        italic: bool = False,
        handwriting: bool = False,
    ) -> str:
        """
        Resolve the font needed by the renderer.
        """

        if handwriting:
            return self.resolve_handwriting_font(
                handwriting_config
            )

        return self.resolve_normal_font(
            bold=bold,
            italic=italic,
        )

    # ========================================================
    # REGISTERED FONTS
    # ========================================================

    def registered_fonts(self) -> dict[str, str]:
        """
        Return fonts registered through this manager.
        """

        return dict(
            self._registered_fonts
        )


# ============================================================
# GLOBAL FONT MANAGER
# ============================================================

font_manager = FontManager()


# ============================================================
# CONVENIENCE FUNCTIONS
# ============================================================

def register_fonts() -> dict[str, dict[str, str]]:
    """
    Register all InkAI fonts.
    """

    return font_manager.register_all()


def resolve_font(
    *,
    handwriting_config: dict[str, Any] | None = None,
    bold: bool = False,
    italic: bool = False,
    handwriting: bool = False,
) -> str:
    """
    Resolve a font using the global FontManager.
    """

    return font_manager.resolve(
        handwriting_config=handwriting_config,
        bold=bold,
        italic=italic,
        handwriting=handwriting,
    )


__all__ = [
    "FontManager",
    "font_manager",
    "register_fonts",
    "resolve_font",
]