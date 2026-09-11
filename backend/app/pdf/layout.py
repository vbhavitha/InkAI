"""
InkAI PDF Layout
================

Reusable page-size, orientation, margin, header, footer, and page-number
configuration for the PDF engine.

This module is intentionally independent from assignment-specific
pagination/rendering logic.

Supported page sizes:
    - A4
    - Letter
    - Legal
    - Custom

UI/API custom dimensions and margins are supplied in millimetres.
Internally, ReportLab/PDF dimensions are represented in points.

Header:
    - Enabled / disabled
    - Text
    - Left / Center / Right
    - Font size
    - Bold
    - Spacing after

Footer:
    - Enabled / disabled
    - Text
    - Left / Center / Right
    - Font size
    - Bold
    - Spacing

Page numbers:
    - Page N
    - Page N of M
    - Bottom Left / Bottom Center / Bottom Right
    - Default: Bottom Center

This file provides reusable configuration only. Assignment-specific
pagination remains owned by the existing assignment pagination service.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any


# ============================================================
# UNIT CONVERSION
# ============================================================

POINTS_PER_INCH = 72.0
MM_PER_INCH = 25.4
POINTS_PER_MM = POINTS_PER_INCH / MM_PER_INCH


def mm_to_points(value: float) -> float:
    """Convert millimetres to PDF points."""
    return float(value) * POINTS_PER_MM


def inches_to_points(value: float) -> float:
    """Convert inches to PDF points."""
    return float(value) * POINTS_PER_INCH


def points_to_mm(value: float) -> float:
    """Convert PDF points to millimetres."""
    return float(value) / POINTS_PER_MM


# ============================================================
# PAGE SIZE DEFINITIONS
# ============================================================

PAGE_SIZES: dict[str, tuple[float, float]] = {
    # 210 × 297 mm
    "A4": (
        mm_to_points(210),
        mm_to_points(297),
    ),

    # 8.5 × 11 inches
    "Letter": (
        inches_to_points(8.5),
        inches_to_points(11),
    ),

    # 8.5 × 14 inches
    "Legal": (
        inches_to_points(8.5),
        inches_to_points(14),
    ),
}

DEFAULT_PAGE_SIZE = "A4"

SUPPORTED_PAGE_SIZES = (
    "A4",
    "Letter",
    "Legal",
    "Custom",
)

SUPPORTED_ORIENTATIONS = (
    "portrait",
    "landscape",
)


# ============================================================
# PAGE SIZE CONFIGURATION
# ============================================================

@dataclass(frozen=True)
class PageSize:
    """Normalized page size stored in PDF points."""

    name: str
    width: float
    height: float

    @property
    def width_mm(self) -> float:
        return points_to_mm(self.width)

    @property
    def height_mm(self) -> float:
        return points_to_mm(self.height)


@dataclass(frozen=True)
class CustomPageSize:
    """Custom page dimensions supplied in millimetres."""

    width_mm: float
    height_mm: float

    def to_page_size(self) -> PageSize:
        if self.width_mm <= 0:
            raise ValueError(
                "Custom page width must be greater than 0 mm."
            )

        if self.height_mm <= 0:
            raise ValueError(
                "Custom page height must be greater than 0 mm."
            )

        return PageSize(
            name="Custom",
            width=mm_to_points(self.width_mm),
            height=mm_to_points(self.height_mm),
        )


def get_page_size(
    page_size: str = DEFAULT_PAGE_SIZE,
    *,
    custom_width_mm: float | None = None,
    custom_height_mm: float | None = None,
) -> PageSize:
    """
    Resolve A4, Letter, Legal, or Custom.

    Missing/empty/unknown page-size values fall back to A4.
    Custom requires both width and height in millimetres.
    """
    normalized = str(
        page_size or DEFAULT_PAGE_SIZE
    ).strip()

    lookup = {
        key.lower(): key
        for key in PAGE_SIZES
    }

    canonical = lookup.get(
        normalized.lower(),
        DEFAULT_PAGE_SIZE,
    )

    if canonical == "Custom":
        if (
            custom_width_mm is None
            or custom_height_mm is None
        ):
            raise ValueError(
                "Custom page size requires both width and "
                "height in millimetres."
            )

        return CustomPageSize(
            width_mm=float(custom_width_mm),
            height_mm=float(custom_height_mm),
        ).to_page_size()

    width, height = PAGE_SIZES[canonical]

    return PageSize(
        name=canonical,
        width=width,
        height=height,
    )


# ============================================================
# ORIENTATION
# ============================================================

def normalize_orientation(
    orientation: str | None,
) -> str:
    """Normalize and validate portrait/landscape orientation."""
    normalized = str(
        orientation or "portrait"
    ).strip().lower()

    if normalized not in SUPPORTED_ORIENTATIONS:
        raise ValueError(
            "Orientation must be either "
            "'portrait' or 'landscape'."
        )

    return normalized


def apply_orientation(
    page_size: PageSize,
    orientation: str = "portrait",
) -> PageSize:
    """Return the supplied page size in the requested orientation."""
    normalized = normalize_orientation(
        orientation
    )

    if normalized == "portrait":
        width = min(
            page_size.width,
            page_size.height,
        )
        height = max(
            page_size.width,
            page_size.height,
        )
    else:
        width = max(
            page_size.width,
            page_size.height,
        )
        height = min(
            page_size.width,
            page_size.height,
        )

    return PageSize(
        name=page_size.name,
        width=width,
        height=height,
    )


# ============================================================
# MARGINS
# ============================================================

@dataclass(frozen=True)
class Margins:
    """Page margins stored internally in PDF points."""

    top: float
    right: float
    bottom: float
    left: float

    @property
    def horizontal(self) -> float:
        return self.left + self.right

    @property
    def vertical(self) -> float:
        return self.top + self.bottom

    @property
    def top_mm(self) -> float:
        return points_to_mm(self.top)

    @property
    def right_mm(self) -> float:
        return points_to_mm(self.right)

    @property
    def bottom_mm(self) -> float:
        return points_to_mm(self.bottom)

    @property
    def left_mm(self) -> float:
        return points_to_mm(self.left)


MARGIN_PRESETS: dict[str, Margins] = {
    # 20 mm on every side.
    "normal": Margins(
        top=mm_to_points(20),
        right=mm_to_points(20),
        bottom=mm_to_points(20),
        left=mm_to_points(20),
    ),

    # 12 mm on every side.
    "narrow": Margins(
        top=mm_to_points(12),
        right=mm_to_points(12),
        bottom=mm_to_points(12),
        left=mm_to_points(12),
    ),

    # 30 mm on every side.
    "wide": Margins(
        top=mm_to_points(30),
        right=mm_to_points(30),
        bottom=mm_to_points(30),
        left=mm_to_points(30),
    ),
}

DEFAULT_MARGIN_PRESET = "normal"

SUPPORTED_MARGIN_PRESETS = (
    "normal",
    "narrow",
    "wide",
    "custom",
)


def build_custom_margins(
    *,
    top_mm: float,
    bottom_mm: float,
    left_mm: float,
    right_mm: float,
) -> Margins:
    """Build margins from millimetre values."""
    values = {
        "top": top_mm,
        "bottom": bottom_mm,
        "left": left_mm,
        "right": right_mm,
    }

    for name, value in values.items():
        if float(value) < 0:
            raise ValueError(
                f"Custom {name} margin cannot be negative."
            )

    return Margins(
        top=mm_to_points(top_mm),
        bottom=mm_to_points(bottom_mm),
        left=mm_to_points(left_mm),
        right=mm_to_points(right_mm),
    )


def get_margins(
    margin_preset: str = DEFAULT_MARGIN_PRESET,
    *,
    custom_margins: dict[str, Any] | None = None,
) -> Margins:
    """
    Resolve normal, narrow, wide, or custom margins.

    Custom margin values are supplied in millimetres.
    """
    normalized = str(
        margin_preset or DEFAULT_MARGIN_PRESET
    ).strip().lower()

    if normalized in MARGIN_PRESETS:
        return MARGIN_PRESETS[normalized]

    if normalized == "custom":
        custom = custom_margins or {}

        return build_custom_margins(
            top_mm=float(
                custom.get("top", 20)
            ),
            bottom_mm=float(
                custom.get("bottom", 20)
            ),
            left_mm=float(
                custom.get("left", 20)
            ),
            right_mm=float(
                custom.get("right", 20)
            ),
        )

    raise ValueError(
        "Margin preset must be one of: "
        "normal, narrow, wide, custom."
    )


# ============================================================
# HEADER
# ============================================================

HEADER_POSITIONS = {
    "left",
    "center",
    "right",
}


@dataclass(frozen=True)
class HeaderConfig:
    """
    Reusable PDF header configuration.

    The header text is supplied by the caller. AssignmentPage can
    construct this text from metadata such as title, Name, Subject,
    Roll Number, Class, Section, Date, and Teacher.
    """

    enabled: bool = False
    text: str = ""
    position: str = "center"
    font_size: float = 11.0
    bold: bool = False
    spacing_after: float = 12.0


def build_header_config(
    *,
    enabled: bool = False,
    text: str = "",
    position: str = "center",
    font_size: float = 11.0,
    bold: bool = False,
    spacing_after: float = 12.0,
) -> HeaderConfig:
    """Build and validate reusable header configuration."""
    normalized_position = str(
        position or "center"
    ).strip().lower()

    if normalized_position not in HEADER_POSITIONS:
        raise ValueError(
            "Header position must be one of: "
            "left, center, right."
        )

    if float(font_size) <= 0:
        raise ValueError(
            "Header font size must be greater than 0."
        )

    if float(spacing_after) < 0:
        raise ValueError(
            "Header spacing cannot be negative."
        )

    return HeaderConfig(
        enabled=bool(enabled),
        text=str(text or ""),
        position=normalized_position,
        font_size=float(font_size),
        bold=bool(bold),
        spacing_after=float(spacing_after),
    )


# ============================================================
# FOOTER
# ============================================================

FOOTER_POSITIONS = {
    "left",
    "center",
    "right",
}


@dataclass(frozen=True)
class FooterConfig:
    """
    Reusable PDF footer configuration.

    Example footer text:
        InkAI — Assignment

    or:
        Bhavitha | Computer Networks
    """

    enabled: bool = False
    text: str = ""
    position: str = "center"
    font_size: float = 9.0
    bold: bool = False
    spacing_before: float = 8.0


def build_footer_config(
    *,
    enabled: bool = False,
    text: str = "",
    position: str = "center",
    font_size: float = 9.0,
    bold: bool = False,
    spacing_before: float = 8.0,
) -> FooterConfig:
    """Build and validate reusable footer configuration."""
    normalized_position = str(
        position or "center"
    ).strip().lower()

    if normalized_position not in FOOTER_POSITIONS:
        raise ValueError(
            "Footer position must be one of: "
            "left, center, right."
        )

    if float(font_size) <= 0:
        raise ValueError(
            "Footer font size must be greater than 0."
        )

    if float(spacing_before) < 0:
        raise ValueError(
            "Footer spacing cannot be negative."
        )

    return FooterConfig(
        enabled=bool(enabled),
        text=str(text or ""),
        position=normalized_position,
        font_size=float(font_size),
        bold=bool(bold),
        spacing_before=float(spacing_before),
    )


# ============================================================
# PAGE NUMBERS
# ============================================================

PAGE_NUMBER_POSITIONS = {
    "left",
    "center",
    "right",
}

DEFAULT_PAGE_NUMBER_POSITION = "center"


@dataclass(frozen=True)
class PageNumberConfig:
    """
    Reusable page-number configuration.

    Position values refer to the bottom of the page:
        left
        center
        right

    show_total controls whether the renderer displays:
        Page 1

    or:
        Page 1 of 5
    """

    enabled: bool = True
    position: str = DEFAULT_PAGE_NUMBER_POSITION
    show_total: bool = False
    prefix: str = "Page"
    font_size: float = 9.0
    bold: bool = False
    bottom_offset: float = 18.0


def build_page_number_config(
    *,
    enabled: bool = True,
    position: str = DEFAULT_PAGE_NUMBER_POSITION,
    show_total: bool = False,
    prefix: str = "Page",
    font_size: float = 9.0,
    bold: bool = False,
    bottom_offset: float = 18.0,
) -> PageNumberConfig:
    """Build and validate reusable page-number configuration."""
    normalized_position = str(
        position or DEFAULT_PAGE_NUMBER_POSITION
    ).strip().lower()

    if normalized_position not in PAGE_NUMBER_POSITIONS:
        raise ValueError(
            "Page number position must be one of: "
            "left, center, right."
        )

    if float(font_size) <= 0:
        raise ValueError(
            "Page number font size must be greater than 0."
        )

    if float(bottom_offset) < 0:
        raise ValueError(
            "Page number bottom offset cannot be negative."
        )

    normalized_prefix = str(
        prefix or "Page"
    ).strip()

    if not normalized_prefix:
        normalized_prefix = "Page"

    return PageNumberConfig(
        enabled=bool(enabled),
        position=normalized_position,
        show_total=bool(show_total),
        prefix=normalized_prefix,
        font_size=float(font_size),
        bold=bool(bold),
        bottom_offset=float(bottom_offset),
    )


def format_page_number(
    page_number: int,
    total_pages: int | None = None,
    *,
    show_total: bool = False,
    prefix: str = "Page",
) -> str:
    """
    Format the visible page-number label.

    Examples:
        Page 1
        Page 1 of 5
    """
    page = max(1, int(page_number))
    label = str(prefix or "Page").strip() or "Page"

    if show_total and total_pages is not None:
        total = max(page, int(total_pages))
        return f"{label} {page} of {total}"

    return f"{label} {page}"


# ============================================================
# COMPLETE LAYOUT CONFIGURATION
# ============================================================

@dataclass(frozen=True)
class LayoutConfig:
    """
    Complete reusable PDF layout configuration.

    Header, footer, and page-number configuration are independent
    so the renderer can enable/disable each feature separately.
    """

    page_size: PageSize
    margins: Margins
    orientation: str = "portrait"

    header: HeaderConfig | None = None
    footer: FooterConfig | None = None
    page_numbers: PageNumberConfig | None = None

    # --------------------------------------------------------
    # Content dimensions
    # --------------------------------------------------------

    @property
    def content_width(self) -> float:
        return max(
            0.0,
            self.page_size.width
            - self.margins.left
            - self.margins.right,
        )

    @property
    def content_height(self) -> float:
        return max(
            0.0,
            self.page_size.height
            - self.margins.top
            - self.margins.bottom,
        )

    # --------------------------------------------------------
    # Content coordinates
    # --------------------------------------------------------

    @property
    def content_top(self) -> float:
        """
        Top Y-coordinate available to document content.

        Header space is reserved when an enabled header contains text.
        """
        top = (
            self.page_size.height
            - self.margins.top
        )

        if (
            self.header
            and self.header.enabled
            and self.header.text.strip()
        ):
            top -= (
                self.header.font_size
                + self.header.spacing_after
            )

        return max(
            self.margins.bottom,
            top,
        )

    @property
    def content_bottom(self) -> float:
        """
        Bottom Y-coordinate available to document content.

        Footer/page-number space is reserved independently from the
        assignment pagination algorithm. This is a layout boundary
        used by downstream renderers.
        """
        bottom = self.margins.bottom

        footer_enabled = bool(
            self.footer
            and self.footer.enabled
            and self.footer.text.strip()
        )

        page_number_enabled = bool(
            self.page_numbers
            and self.page_numbers.enabled
        )

        if footer_enabled or page_number_enabled:
            footer_space = 0.0

            if footer_enabled:
                footer_space = max(
                    footer_space,
                    self.footer.font_size
                    + self.footer.spacing_before,
                )

            if page_number_enabled:
                footer_space = max(
                    footer_space,
                    self.page_numbers.font_size
                    + self.page_numbers.bottom_offset,
                )

            bottom += footer_space

        return min(
            self.page_size.height - self.margins.top,
            bottom,
        )

    @property
    def available_content_height(self) -> float:
        """Actual usable height between content_top and content_bottom."""
        return max(
            0.0,
            self.content_top
            - self.content_bottom,
        )

    @property
    def content_left(self) -> float:
        return self.margins.left

    @property
    def content_right(self) -> float:
        return (
            self.page_size.width
            - self.margins.right
        )


# ============================================================
# COMPLETE LAYOUT BUILDER
# ============================================================

def build_layout(
    *,
    page_size: str = DEFAULT_PAGE_SIZE,
    orientation: str = "portrait",
    margin_preset: str = DEFAULT_MARGIN_PRESET,
    custom_width_mm: float | None = None,
    custom_height_mm: float | None = None,
    custom_margins: dict[str, Any] | None = None,

    # Header
    header_enabled: bool = False,
    header_text: str = "",
    header_position: str = "center",
    header_font_size: float = 11.0,
    header_bold: bool = False,
    header_spacing_after: float = 12.0,

    # Footer
    footer_enabled: bool = False,
    footer_text: str = "",
    footer_position: str = "center",
    footer_font_size: float = 9.0,
    footer_bold: bool = False,
    footer_spacing_before: float = 8.0,

    # Page numbers
    page_numbers_enabled: bool = True,
    page_number_position: str = DEFAULT_PAGE_NUMBER_POSITION,
    page_number_show_total: bool = False,
    page_number_prefix: str = "Page",
    page_number_font_size: float = 9.0,
    page_number_bold: bool = False,
    page_number_bottom_offset: float = 18.0,
) -> LayoutConfig:
    """
    Build a complete reusable PDF layout.

    Page settings:
        page_size:
            A4, Letter, Legal, Custom

        orientation:
            portrait, landscape

        margin_preset:
            normal, narrow, wide, custom

        custom_width_mm/custom_height_mm:
            used only for Custom page size

        custom_margins:
            top/right/bottom/left values in mm

    Header:
        header_enabled
        header_text
        header_position = left | center | right

    Footer:
        footer_enabled
        footer_text
        footer_position = left | center | right

    Page numbers:
        page_numbers_enabled
        page_number_position = left | center | right
        page_number_show_total
            False -> "Page 1"
            True  -> "Page 1 of 5"

    No assignment-specific pagination is performed here.
    """
    normalized_orientation = normalize_orientation(
        orientation
    )

    resolved_page_size = get_page_size(
        page_size,
        custom_width_mm=custom_width_mm,
        custom_height_mm=custom_height_mm,
    )

    resolved_page_size = apply_orientation(
        resolved_page_size,
        normalized_orientation,
    )

    resolved_margins = get_margins(
        margin_preset,
        custom_margins=custom_margins,
    )

    # --------------------------------------------------------
    # Validate page dimensions against margins.
    # --------------------------------------------------------

    if (
        resolved_margins.horizontal
        >= resolved_page_size.width
    ):
        raise ValueError(
            "Left and right margins are too large "
            "for the selected page width."
        )

    if (
        resolved_margins.vertical
        >= resolved_page_size.height
    ):
        raise ValueError(
            "Top and bottom margins are too large "
            "for the selected page height."
        )

    # --------------------------------------------------------
    # Build reusable display configurations.
    # --------------------------------------------------------

    header = build_header_config(
        enabled=header_enabled,
        text=header_text,
        position=header_position,
        font_size=header_font_size,
        bold=header_bold,
        spacing_after=header_spacing_after,
    )

    footer = build_footer_config(
        enabled=footer_enabled,
        text=footer_text,
        position=footer_position,
        font_size=footer_font_size,
        bold=footer_bold,
        spacing_before=footer_spacing_before,
    )

    page_numbers = build_page_number_config(
        enabled=page_numbers_enabled,
        position=page_number_position,
        show_total=page_number_show_total,
        prefix=page_number_prefix,
        font_size=page_number_font_size,
        bold=page_number_bold,
        bottom_offset=page_number_bottom_offset,
    )

    return LayoutConfig(
        page_size=resolved_page_size,
        margins=resolved_margins,
        orientation=normalized_orientation,
        header=header,
        footer=footer,
        page_numbers=page_numbers,
    )


# ============================================================
# REPORTLAB HELPERS
# ============================================================

def get_reportlab_page_size(
    *,
    page_size: str = DEFAULT_PAGE_SIZE,
    orientation: str = "portrait",
    custom_width_mm: float | None = None,
    custom_height_mm: float | None = None,
) -> tuple[float, float]:
    """Return a ReportLab-compatible (width, height) tuple."""
    resolved = get_page_size(
        page_size,
        custom_width_mm=custom_width_mm,
        custom_height_mm=custom_height_mm,
    )

    resolved = apply_orientation(
        resolved,
        orientation,
    )

    return (
        resolved.width,
        resolved.height,
    )


def get_reportlab_margins(
    *,
    margin_preset: str = DEFAULT_MARGIN_PRESET,
    custom_margins: dict[str, Any] | None = None,
) -> tuple[float, float, float, float]:
    """
    Return ReportLab margins as:

        (top, right, bottom, left)
    """
    margins = get_margins(
        margin_preset,
        custom_margins=custom_margins,
    )

    return (
        margins.top,
        margins.right,
        margins.bottom,
        margins.left,
    )


# ============================================================
# PUBLIC EXPORTS
# ============================================================

__all__ = [
    # Units
    "POINTS_PER_INCH",
    "MM_PER_INCH",
    "POINTS_PER_MM",
    "mm_to_points",
    "inches_to_points",
    "points_to_mm",

    # Page sizes
    "PAGE_SIZES",
    "DEFAULT_PAGE_SIZE",
    "SUPPORTED_PAGE_SIZES",
    "PageSize",
    "CustomPageSize",
    "get_page_size",

    # Orientation
    "SUPPORTED_ORIENTATIONS",
    "normalize_orientation",
    "apply_orientation",

    # Margins
    "Margins",
    "MARGIN_PRESETS",
    "DEFAULT_MARGIN_PRESET",
    "SUPPORTED_MARGIN_PRESETS",
    "build_custom_margins",
    "get_margins",

    # Header
    "HeaderConfig",
    "HEADER_POSITIONS",
    "build_header_config",

    # Footer
    "FooterConfig",
    "FOOTER_POSITIONS",
    "build_footer_config",

    # Page numbers
    "PageNumberConfig",
    "PAGE_NUMBER_POSITIONS",
    "DEFAULT_PAGE_NUMBER_POSITION",
    "build_page_number_config",
    "format_page_number",

    # Complete layout
    "LayoutConfig",
    "build_layout",

    # ReportLab
    "get_reportlab_page_size",
    "get_reportlab_margins",
]
