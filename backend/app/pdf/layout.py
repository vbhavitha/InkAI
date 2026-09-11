"""
InkAI PDF Layout
================

Reusable page-size and margin configuration for the PDF engine.

This module is intentionally independent from assignment-specific
pagination/rendering logic.

Supported page sizes:
    - A4
    - Letter
    - Legal
    - Custom

All dimensions are internally represented in PDF points.

1 inch = 72 points
1 mm   = 72 / 25.4 points
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
    """
    Convert millimetres to PDF points.
    """
    return float(value) * POINTS_PER_MM


def inches_to_points(value: float) -> float:
    """
    Convert inches to PDF points.
    """
    return float(value) * POINTS_PER_INCH


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


# ============================================================
# DEFAULT PAGE SIZE
# ============================================================

DEFAULT_PAGE_SIZE = "A4"


# ============================================================
# PAGE SIZE CONFIGURATION
# ============================================================

@dataclass(frozen=True)
class PageSize:
    """
    Normalized PDF page size.

    width and height are stored in PDF points.
    """

    name: str
    width: float
    height: float

    @property
    def width_mm(self) -> float:
        return self.width / POINTS_PER_MM

    @property
    def height_mm(self) -> float:
        return self.height / POINTS_PER_MM


# ============================================================
# CUSTOM PAGE SIZE
# ============================================================

@dataclass(frozen=True)
class CustomPageSize:
    """
    Custom page dimensions supplied in millimetres.

    Example:

        CustomPageSize(
            width_mm=210,
            height_mm=297,
        )
    """

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


# ============================================================
# PAGE SIZE RESOLUTION
# ============================================================

def get_page_size(
    page_size: str = DEFAULT_PAGE_SIZE,
    *,
    custom_width_mm: float | None = None,
    custom_height_mm: float | None = None,
) -> PageSize:
    """
    Resolve a page size.

    Supported values:

        A4
        Letter
        Legal
        Custom

    A4 is used whenever the supplied page size is missing or empty.
    """

    normalized = str(
        page_size or DEFAULT_PAGE_SIZE
    ).strip()

    # Case-insensitive matching.
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
                "Custom page size requires both "
                "width and height in millimetres."
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

def apply_orientation(
    page_size: PageSize,
    orientation: str = "portrait",
) -> PageSize:
    """
    Apply portrait or landscape orientation.
    """

    normalized = str(
        orientation or "portrait"
    ).strip().lower()

    if normalized not in {
        "portrait",
        "landscape",
    }:
        raise ValueError(
            "Orientation must be either "
            "'portrait' or 'landscape'."
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
    """
    Page margins stored in PDF points.
    """

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


# ============================================================
# MARGIN PRESETS
# ============================================================

MARGIN_PRESETS: dict[str, Margins] = {
    # Approximately 20 mm.
    "normal": Margins(
        top=mm_to_points(20),
        right=mm_to_points(20),
        bottom=mm_to_points(20),
        left=mm_to_points(20),
    ),

    # Approximately 12 mm.
    "narrow": Margins(
        top=mm_to_points(12),
        right=mm_to_points(12),
        bottom=mm_to_points(12),
        left=mm_to_points(12),
    ),

    # Approximately 30 mm.
    "wide": Margins(
        top=mm_to_points(30),
        right=mm_to_points(30),
        bottom=mm_to_points(30),
        left=mm_to_points(30),
    ),
}


DEFAULT_MARGIN_PRESET = "normal"


# ============================================================
# CUSTOM MARGINS
# ============================================================

def build_custom_margins(
    *,
    top_mm: float,
    bottom_mm: float,
    left_mm: float,
    right_mm: float,
) -> Margins:
    """
    Build margins from millimetre values.
    """

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


# ============================================================
# MARGIN RESOLUTION
# ============================================================

def get_margins(
    margin_preset: str = DEFAULT_MARGIN_PRESET,
    *,
    custom_margins: dict[str, Any] | None = None,
) -> Margins:
    """
    Resolve a margin preset.

    Supported:

        normal
        narrow
        wide
        custom

    Custom margins are supplied in millimetres.
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
# COMPLETE LAYOUT CONFIGURATION
# ============================================================

@dataclass(frozen=True)
class LayoutConfig:
    """
    Complete reusable PDF layout configuration.
    """

    page_size: PageSize
    margins: Margins
    orientation: str = "portrait"

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
) -> LayoutConfig:
    """
    Build a complete PDF layout configuration.
    """

    resolved_page_size = get_page_size(
        page_size,
        custom_width_mm=custom_width_mm,
        custom_height_mm=custom_height_mm,
    )

    resolved_page_size = apply_orientation(
        resolved_page_size,
        orientation,
    )

    resolved_margins = get_margins(
        margin_preset,
        custom_margins=custom_margins,
    )

    # Prevent impossible layouts.
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

    return LayoutConfig(
        page_size=resolved_page_size,
        margins=resolved_margins,
        orientation=orientation,
    )


# ============================================================
# REPORTLAB HELPER
# ============================================================

def get_reportlab_page_size(
    *,
    page_size: str = DEFAULT_PAGE_SIZE,
    orientation: str = "portrait",
    custom_width_mm: float | None = None,
    custom_height_mm: float | None = None,
) -> tuple[float, float]:
    """
    Return a ReportLab-compatible (width, height) tuple.
    """

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


# ============================================================
# PUBLIC EXPORTS
# ============================================================

__all__ = [
    "POINTS_PER_INCH",
    "MM_PER_INCH",
    "POINTS_PER_MM",
    "PAGE_SIZES",
    "DEFAULT_PAGE_SIZE",
    "PageSize",
    "CustomPageSize",
    "Margins",
    "MARGIN_PRESETS",
    "DEFAULT_MARGIN_PRESET",
    "LayoutConfig",
    "mm_to_points",
    "inches_to_points",
    "get_page_size",
    "apply_orientation",
    "build_custom_margins",
    "get_margins",
    "build_layout",
    "get_reportlab_page_size",
]