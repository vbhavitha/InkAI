"""
InkAI PDF Table Utilities
=========================

Reusable ReportLab table utilities.

Supported:
    - Header row
    - Borders
    - Cell padding
    - Horizontal alignment
    - Vertical alignment
    - Column widths
    - Wrapped cell content
    - Repeating header rows
    - Automatic table height calculation

This module creates ReportLab Table objects.

Assignment-specific pagination remains outside this module.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Iterable, Sequence

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import Paragraph, Table, TableStyle


# ============================================================
# DEFAULTS
# ============================================================

DEFAULT_FONT_NAME = "Helvetica"
DEFAULT_FONT_SIZE = 10
DEFAULT_HEADER_FONT_SIZE = 10

DEFAULT_PADDING = 6

DEFAULT_BORDER_WIDTH = 0.5

DEFAULT_HEADER_BACKGROUND = (
    colors.HexColor("#EDEDED")
)

DEFAULT_BORDER_COLOR = (
    colors.HexColor("#777777")
)

DEFAULT_TEXT_COLOR = colors.black


# ============================================================
# CONFIGURATION
# ============================================================

@dataclass(frozen=True)
class TableConfig:
    """
    Reusable table rendering configuration.
    """

    header_row: bool = True

    border_width: float = (
        DEFAULT_BORDER_WIDTH
    )

    border_color: Any = (
        DEFAULT_BORDER_COLOR
    )

    cell_padding: float = (
        DEFAULT_PADDING
    )

    header_background: Any = (
        DEFAULT_HEADER_BACKGROUND
    )

    font_name: str = (
        DEFAULT_FONT_NAME
    )

    font_size: float = (
        DEFAULT_FONT_SIZE
    )

    header_font_size: float = (
        DEFAULT_HEADER_FONT_SIZE
    )

    text_color: Any = (
        DEFAULT_TEXT_COLOR
    )

    horizontal_alignment: str = (
        "left"
    )

    vertical_alignment: str = (
        "middle"
    )

    repeat_header: bool = True


# ============================================================
# ALIGNMENT
# ============================================================

def normalize_horizontal_alignment(
    alignment: str | None,
) -> str:
    normalized = str(
        alignment or "left"
    ).strip().lower()

    aliases = {
        "left": "left",
        "center": "center",
        "centre": "center",
        "right": "right",
    }

    if normalized not in aliases:
        raise ValueError(
            "Horizontal alignment must be "
            "left, center, or right."
        )

    return aliases[
        normalized
    ]


def normalize_vertical_alignment(
    alignment: str | None,
) -> str:
    normalized = str(
        alignment or "middle"
    ).strip().lower()

    aliases = {
        "top": "top",
        "middle": "middle",
        "center": "middle",
        "centre": "middle",
        "bottom": "bottom",
    }

    if normalized not in aliases:
        raise ValueError(
            "Vertical alignment must be "
            "top, middle, or bottom."
        )

    return aliases[
        normalized
    ]


def paragraph_alignment(
    alignment: str,
) -> int:
    alignment = (
        normalize_horizontal_alignment(
            alignment
        )
    )

    if alignment == "center":
        return TA_CENTER

    if alignment == "right":
        return TA_RIGHT

    return TA_LEFT


# ============================================================
# DATA NORMALIZATION
# ============================================================

def normalize_table_data(
    data: Sequence[Sequence[Any]],
) -> list[list[Any]]:
    """
    Convert arbitrary cell values into strings.

    Ensures every row has the same number
    of columns.
    """

    if not data:
        return []

    rows = [
        list(row)
        for row in data
    ]

    column_count = max(
        len(row)
        for row in rows
    )

    normalized = []

    for row in rows:

        values = list(row)

        if len(values) < column_count:

            values.extend(
                [""] *
                (
                    column_count
                    - len(values)
                )
            )

        normalized.append(
            [
                ""
                if value is None
                else str(value)
                for value in values
            ]
        )

    return normalized


# ============================================================
# COLUMN WIDTHS
# ============================================================

def calculate_column_widths(
    data: Sequence[Sequence[Any]],
    *,
    available_width: float,
    column_widths: Sequence[
        float | None
    ]
    | None = None,
) -> list[float]:
    """
    Calculate column widths.

    Explicit widths are preserved.

    Remaining width is distributed equally
    among columns without an explicit width.
    """

    normalized = normalize_table_data(
        data
    )

    if not normalized:
        return []

    column_count = len(
        normalized[0]
    )

    if (
        available_width
        <= 0
    ):
        raise ValueError(
            "Available table width must "
            "be greater than 0."
        )

    if column_widths is None:

        equal_width = (
            available_width
            / column_count
        )

        return [
            equal_width
            for _ in range(
                column_count
            )
        ]

    supplied = list(
        column_widths
    )

    if len(supplied) > column_count:

        raise ValueError(
            "More column widths were supplied "
            "than table columns."
        )

    widths = [
        None
        for _ in range(
            column_count
        )
    ]

    fixed_total = 0.0
    flexible_columns = []

    for index in range(
        column_count
    ):

        if (
            index
            < len(supplied)
            and supplied[index]
            is not None
        ):

            width = float(
                supplied[index]
            )

            if width <= 0:
                raise ValueError(
                    "Column widths must "
                    "be greater than 0."
                )

            widths[index] = width
            fixed_total += width

        else:

            flexible_columns.append(
                index
            )

    if fixed_total > available_width:

        # Scale fixed columns down so that
        # they never overflow the page.
        scale = (
            available_width
            / fixed_total
        )

        for index in range(
            column_count
        ):

            if widths[index] is not None:

                widths[index] *= scale

        fixed_total = (
            available_width
        )

    remaining = max(
        0.0,
        available_width
        - fixed_total,
    )

    if flexible_columns:

        flexible_width = (
            remaining
            / len(
                flexible_columns
            )
        )

        for index in flexible_columns:
            widths[index] = (
                flexible_width
            )

    return [
        float(width)
        for width in widths
    ]


# ============================================================
# PARAGRAPH CELL
# ============================================================

def _make_cell_paragraph(
    value: Any,
    *,
    font_name: str,
    font_size: float,
    alignment: str,
    text_color: Any,
    bold: bool = False,
):
    """
    Create a wrapped ReportLab Paragraph.

    Paragraph is important because ordinary strings
    do not provide reliable cell wrapping.
    """

    if value is None:
        value = ""

    text = str(value)

    if bold:
        text = (
            "<b>"
            + text.replace(
                "&",
                "&amp;",
            )
            + "</b>"
        )
    else:
        text = text.replace(
            "&",
            "&amp;",
        )

    text = text.replace(
        "\n",
        "<br/>",
    )

    style = ParagraphStyle(
        name="InkAITableCell",
        fontName=font_name,
        fontSize=font_size,
        leading=max(
            font_size * 1.25,
            11,
        ),
        alignment=paragraph_alignment(
            alignment
        ),
        textColor=text_color,
        spaceBefore=0,
        spaceAfter=0,
        allowWidows=0,
        allowOrphans=0,
    )

    return Paragraph(
        text,
        style,
    )


# ============================================================
# BUILD TABLE
# ============================================================

def build_table(
    data: Sequence[Sequence[Any]],
    *,
    available_width: float | None = None,
    col_widths: Sequence[
        float | None
    ]
    | None = None,
    header_row: bool = True,
    repeat_rows: int | None = None,
    border_width: float = (
        DEFAULT_BORDER_WIDTH
    ),
    border_color: Any = (
        DEFAULT_BORDER_COLOR
    ),
    cell_padding: float = (
        DEFAULT_PADDING
    ),
    header_background: Any = (
        DEFAULT_HEADER_BACKGROUND
    ),
    font_name: str = (
        DEFAULT_FONT_NAME
    ),
    font_size: float = (
        DEFAULT_FONT_SIZE
    ),
    header_font_size: float = (
        DEFAULT_HEADER_FONT_SIZE
    ),
    text_color: Any = (
        DEFAULT_TEXT_COLOR
    ),
    alignment: str = "left",
    vertical_alignment: str = "middle",
    repeat_header: bool = True,
) -> Table:
    """
    Build a fully styled ReportLab table.

    Example:

        data = [
            ["Name", "Marks"],
            ["Bhavitha", "95"],
            ["Anu", "89"],
        ]

        table = build_table(
            data,
            available_width=450,
        )

    Supports:
        - header row
        - borders
        - padding
        - alignment
        - column widths
        - wrapping
        - repeated header rows
    """

    rows = normalize_table_data(
        data
    )

    if not rows:
        raise ValueError(
            "Table data cannot be empty."
        )

    normalized_alignment = (
        normalize_horizontal_alignment(
            alignment
        )
    )

    normalized_vertical = (
        normalize_vertical_alignment(
            vertical_alignment
        )
    )

    column_count = len(
        rows[0]
    )

    if available_width is None:

        if col_widths:

            available_width = sum(
                float(width)
                for width in col_widths
                if width is not None
            )

        else:

            # Safe fallback.
            available_width = (
                170 * mm
            )

    widths = calculate_column_widths(
        rows,
        available_width=(
            float(
                available_width
            )
        ),
        column_widths=col_widths,
    )

    # --------------------------------------------------------
    # Convert cells into Paragraphs.
    # --------------------------------------------------------

    table_data = []

    for row_index, row in enumerate(
        rows
    ):

        is_header = (
            header_row
            and row_index == 0
        )

        current_font_size = (
            header_font_size
            if is_header
            else font_size
        )

        current_alignment = (
            "center"
            if is_header
            and normalized_alignment
            == "left"
            else normalized_alignment
        )

        converted_row = []

        for value in row:

            converted_row.append(
                _make_cell_paragraph(
                    value,
                    font_name=font_name,
                    font_size=(
                        current_font_size
                    ),
                    alignment=(
                        current_alignment
                    ),
                    text_color=(
                        text_color
                    ),
                    bold=is_header,
                )
            )

        table_data.append(
            converted_row
        )

    # --------------------------------------------------------
    # Repeat header.
    # --------------------------------------------------------

    if repeat_rows is not None:

        effective_repeat_rows = max(
            0,
            int(repeat_rows),
        )

    elif (
        header_row
        and repeat_header
    ):

        effective_repeat_rows = 1

    else:

        effective_repeat_rows = 0

    # --------------------------------------------------------
    # ReportLab table.
    # --------------------------------------------------------

    table = Table(
        table_data,
        colWidths=widths,
        repeatRows=(
            effective_repeat_rows
        ),
        hAlign="LEFT",
    )

    # --------------------------------------------------------
    # Base style.
    # --------------------------------------------------------

    style_commands = [
        (
            "VALIGN",
            (0, 0),
            (-1, -1),
            normalized_vertical,
        ),
        (
            "LEFTPADDING",
            (0, 0),
            (-1, -1),
            cell_padding,
        ),
        (
            "RIGHTPADDING",
            (0, 0),
            (-1, -1),
            cell_padding,
        ),
        (
            "TOPPADDING",
            (0, 0),
            (-1, -1),
            cell_padding,
        ),
        (
            "BOTTOMPADDING",
            (0, 0),
            (-1, -1),
            cell_padding,
        ),
        (
            "GRID",
            (0, 0),
            (-1, -1),
            border_width,
            border_color,
        ),
    ]

    # --------------------------------------------------------
    # Header styling.
    # --------------------------------------------------------

    if header_row:

        style_commands.extend(
            [
                (
                    "BACKGROUND",
                    (0, 0),
                    (-1, 0),
                    header_background,
                ),
                (
                    "LINEBELOW",
                    (0, 0),
                    (-1, 0),
                    border_width,
                    border_color,
                ),
            ]
        )

    table.setStyle(
        TableStyle(
            style_commands
        )
    )

    return table


# ============================================================
# TABLE SIZE
# ============================================================

def calculate_table_size(
    table: Table,
    *,
    available_width: float,
    available_height: float | None = None,
) -> tuple[float, float]:
    """
    Calculate the rendered table size.

    Returns:
        (width, height)
    """

    width, height = (
        table.wrap(
            available_width,
            available_height
            or 100000,
        )
    )

    return (
        float(width),
        float(height),
    )


def table_fits(
    table: Table,
    *,
    available_width: float,
    available_height: float,
) -> bool:
    """
    Check whether a table fits within
    the current content area.
    """

    _, height = (
        calculate_table_size(
            table,
            available_width=(
                available_width
            ),
            available_height=(
                available_height
            ),
        )
    )

    return (
        height
        <= max(
            0.0,
            available_height,
        )
    )


__all__ = [
    "TableConfig",
    "normalize_table_data",
    "calculate_column_widths",
    "build_table",
    "calculate_table_size",
    "table_fits",
]