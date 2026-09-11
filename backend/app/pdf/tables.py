"""
InkAI PDF Tables
================

Reusable ReportLab table helpers.

Features:
- header row
- borders
- cell padding
- alignment
- column widths
- wrapped cell content
- repeated header rows
- measurement for pagination
- row-level table splitting for multi-page assignment tables

The table splitter returns independent table nodes. Each generated chunk
contains the original header row, so ReportLab renders the header again
on every page.
"""

from __future__ import annotations

from typing import Any, Dict, Iterable, List, Optional, Sequence

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import Paragraph, Table, TableStyle


DEFAULT_PADDING = 6
DEFAULT_FONT_SIZE = 9
DEFAULT_HEADER_FONT_SIZE = 9
DEFAULT_BORDER_WIDTH = 0.6


def _alignment(value: Any):
    value = str(value or "left").lower()

    if value in {"center", "centre"}:
        return TA_CENTER

    if value == "right":
        return TA_RIGHT

    return TA_LEFT


def _normalize_padding(
    padding: Any,
) -> tuple[float, float, float, float]:
    if padding is None:
        return (
            DEFAULT_PADDING,
            DEFAULT_PADDING,
            DEFAULT_PADDING,
            DEFAULT_PADDING,
        )

    if isinstance(padding, (int, float)):
        value = max(0.0, float(padding))
        return value, value, value, value

    if isinstance(padding, (list, tuple)):
        values = list(padding)

        if len(values) == 2:
            vertical = max(0.0, float(values[0]))
            horizontal = max(0.0, float(values[1]))
            return (
                horizontal,
                vertical,
                horizontal,
                vertical,
            )

        if len(values) == 4:
            return tuple(
                max(0.0, float(v))
                for v in values
            )

    return (
        DEFAULT_PADDING,
        DEFAULT_PADDING,
        DEFAULT_PADDING,
        DEFAULT_PADDING,
    )


def _cell_text(value: Any) -> str:
    if value is None:
        return ""

    if isinstance(value, dict):
        if "text" in value:
            return str(value.get("text") or "")

        if "label" in value:
            return str(value.get("label") or "")

        return str(value)

    return str(value)


def _paragraph(
    value: Any,
    *,
    header: bool = False,
    font_size: Optional[float] = None,
    alignment: Any = "left",
    padding: Any = None,
) -> Paragraph:
    text = _cell_text(value)

    size = (
        font_size
        if font_size is not None
        else (
            DEFAULT_HEADER_FONT_SIZE
            if header
            else DEFAULT_FONT_SIZE
        )
    )

    left, _, right, _ = _normalize_padding(padding)

    style = ParagraphStyle(
        name="InkAI_TableCell",
        fontName="Helvetica-Bold" if header else "Helvetica",
        fontSize=size,
        leading=max(size * 1.25, 10),
        alignment=_alignment(alignment),
        spaceAfter=0,
        spaceBefore=0,
        leftIndent=0,
        rightIndent=0,
    )

    return Paragraph(
        text.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace("\n", "<br/>"),
        style,
    )


def _normalize_rows(
    data: Sequence[Sequence[Any]],
) -> List[List[Any]]:
    rows: List[List[Any]] = []

    for row in data:
        if isinstance(row, (list, tuple)):
            rows.append(list(row))
        else:
            rows.append([row])

    if not rows:
        return []

    column_count = max(
        len(row)
        for row in rows
    )

    for row in rows:
        if len(row) < column_count:
            row.extend(
                [""] * (column_count - len(row))
            )

    return rows


def _resolve_column_widths(
    rows: List[List[Any]],
    col_widths: Optional[Sequence[Any]],
    available_width: Optional[float],
) -> Optional[List[float]]:
    if not rows:
        return None

    column_count = len(rows[0])

    if col_widths:
        resolved: List[float] = []

        for value in list(col_widths)[:column_count]:
            try:
                resolved.append(float(value))
            except (TypeError, ValueError):
                resolved.append(0.0)

        while len(resolved) < column_count:
            resolved.append(0.0)

        if available_width and available_width > 0:
            explicit_total = sum(
                value
                for value in resolved
                if value > 0
            )

            flexible_count = sum(
                1
                for value in resolved
                if value <= 0
            )

            if flexible_count:
                remaining = max(
                    0.0,
                    available_width - explicit_total,
                )
                flexible_width = (
                    remaining / flexible_count
                    if flexible_count
                    else 0
                )

                resolved = [
                    value
                    if value > 0
                    else flexible_width
                    for value in resolved
                ]

        return resolved

    if not available_width:
        return None

    return [
        available_width / column_count
        for _ in range(column_count)
    ]


def build_table(
    data: Sequence[Sequence[Any]],
    col_widths: Optional[Sequence[Any]] = None,
    repeat_rows: int = 1,
    *,
    header_row: bool = True,
    padding: Any = DEFAULT_PADDING,
    alignments: Optional[Sequence[Any]] = None,
    font_size: float = DEFAULT_FONT_SIZE,
    header_font_size: float = DEFAULT_HEADER_FONT_SIZE,
    available_width: Optional[float] = None,
    border_width: float = DEFAULT_BORDER_WIDTH,
    header_background=colors.whitesmoke,
    border_color=colors.black,
) -> Table:
    """
    Build a wrapped ReportLab Table.

    repeat_rows=1 means the first row is repeated on every page when
    ReportLab splits the Table itself.
    """
    rows = _normalize_rows(data)

    if not rows:
        return Table([[""]])

    column_count = len(rows[0])

    if alignments is None:
        alignments = ["left"] * column_count

    left, top, right, bottom = _normalize_padding(
        padding
    )

    converted: List[List[Any]] = []

    for row_index, row in enumerate(rows):
        converted_row: List[Any] = []

        for column_index, value in enumerate(row):
            alignment = (
                alignments[column_index]
                if column_index < len(alignments)
                else "left"
            )

            converted_row.append(
                _paragraph(
                    value,
                    header=(
                        header_row
                        and row_index < max(repeat_rows, 1)
                    ),
                    font_size=(
                        header_font_size
                        if header_row
                        and row_index < max(repeat_rows, 1)
                        else font_size
                    ),
                    alignment=alignment,
                    padding=padding,
                )
            )

        converted.append(converted_row)

    widths = _resolve_column_widths(
        converted,
        col_widths,
        available_width,
    )

    table = Table(
        converted,
        colWidths=widths,
        repeatRows=(
            max(0, int(repeat_rows))
            if header_row
            else 0
        ),
        hAlign="LEFT",
    )

    style_commands = [
        (
            "GRID",
            (0, 0),
            (-1, -1),
            border_width,
            border_color,
        ),
        (
            "VALIGN",
            (0, 0),
            (-1, -1),
            "MIDDLE",
        ),
        (
            "LEFTPADDING",
            (0, 0),
            (-1, -1),
            left,
        ),
        (
            "TOPPADDING",
            (0, 0),
            (-1, -1),
            top,
        ),
        (
            "RIGHTPADDING",
            (0, 0),
            (-1, -1),
            right,
        ),
        (
            "BOTTOMPADDING",
            (0, 0),
            (-1, -1),
            bottom,
        ),
    ]

    if header_row and rows:
        style_commands.append(
            (
                "BACKGROUND",
                (0, 0),
                (-1, max(repeat_rows, 1) - 1),
                header_background,
            )
        )

    for index, alignment in enumerate(alignments):
        if index >= column_count:
            break

        style_commands.append(
            (
                "ALIGN",
                (index, 0),
                (index, -1),
                (
                    "CENTER"
                    if _alignment(alignment) == TA_CENTER
                    else (
                        "RIGHT"
                        if _alignment(alignment) == TA_RIGHT
                        else "LEFT"
                    )
                ),
            )
        )

    table.setStyle(TableStyle(style_commands))

    return table


def table_dimensions(
    data: Sequence[Sequence[Any]],
    *,
    available_width: float,
    col_widths: Optional[Sequence[Any]] = None,
    repeat_rows: int = 1,
    **kwargs,
) -> tuple[float, float]:
    """
    Return the actual ReportLab wrapped width and height.
    """
    table = build_table(
        data,
        col_widths=col_widths,
        repeat_rows=repeat_rows,
        available_width=available_width,
        **kwargs,
    )

    return table.wrap(
        available_width,
        1000000,
    )


def split_table_rows(
    data: Sequence[Sequence[Any]],
    *,
    available_width: float,
    available_height: float,
    col_widths: Optional[Sequence[Any]] = None,
    header_rows: int = 1,
    padding: Any = DEFAULT_PADDING,
    **kwargs,
) -> List[List[List[Any]]]:
    """
    Split a large table into page-sized chunks.

    The first header_rows are copied into every chunk.

    Rows remain intact. Cell content is allowed to wrap vertically. If one
    individual row is taller than the page, it is kept as a single row so
    the caller never loses structured table data.
    """
    rows = _normalize_rows(data)

    if not rows:
        return []

    header_count = max(
        0,
        min(int(header_rows), len(rows)),
    )

    header = rows[:header_count]
    body = rows[header_count:]

    if not body:
        return [rows]

    chunks: List[List[List[Any]]] = []
    current: List[List[Any]] = list(header)
    current_height = 0.0

    if header:
        _, current_height = table_dimensions(
            current,
            available_width=available_width,
            col_widths=col_widths,
            repeat_rows=header_count,
            padding=padding,
            **kwargs,
        )

    for row in body:
        candidate = current + [row]

        _, candidate_height = table_dimensions(
            candidate,
            available_width=available_width,
            col_widths=col_widths,
            repeat_rows=header_count,
            padding=padding,
            **kwargs,
        )

        if (
            current
            and current_height > 0
            and candidate_height > available_height
            and len(current) > header_count
        ):
            chunks.append(current)

            current = list(header) + [row]

            _, current_height = table_dimensions(
                current,
                available_width=available_width,
                col_widths=col_widths,
                repeat_rows=header_count,
                padding=padding,
                **kwargs,
            )

            continue

        current.append(row)
        current_height = candidate_height

    if current:
        chunks.append(current)

    return chunks


def split_table_node(
    node: Dict[str, Any],
    *,
    available_width: float,
    available_height: float,
) -> List[Dict[str, Any]]:
    """
    Split a TipTap table node into page-sized table nodes.

    STEP 15 / STEP 17 compatibility:
    - Rows remain structured TipTap JSON.
    - Header rows are repeated on every generated table chunk.
    - Original row objects are preserved by index.
    - Duplicate rows are therefore handled safely.
    - No table content is flattened or reconstructed from text.
    """
    if not isinstance(node, dict):
        return [node]

    content = node.get("content") or []

    if len(content) <= 1:
        return [node]

    # Keep only actual TipTap table rows for the split operation.
    # Their original positions are preserved through row indices.
    valid_row_indices: List[int] = []
    data: List[List[str]] = []

    for index, row in enumerate(content):
        if not isinstance(row, dict):
            continue

        row_type = row.get("type")
        if row_type not in ("tableRow", "row"):
            continue

        cells = row.get("content") or []

        data.append(
            [
                _cell_text(cell)
                for cell in cells
            ]
        )
        valid_row_indices.append(index)

    if len(data) <= 1:
        return [node]

    attrs = dict(node.get("attrs") or {})

    column_widths = (
        attrs.get("columnWidths")
        or attrs.get("colWidths")
        or attrs.get("column_widths")
    )

    header_rows = attrs.get("headerRows", 1)

    try:
        header_rows = max(0, int(header_rows))
    except (TypeError, ValueError):
        header_rows = 1

    header_rows = min(header_rows, len(data))

    # ------------------------------------------------------------
    # Build page-sized chunks while retaining the ORIGINAL row
    # INDEX for every row.
    # ------------------------------------------------------------
    header_indices = valid_row_indices[:header_rows]
    body_indices = valid_row_indices[header_rows:]

    if not body_indices:
        return [node]

    chunks: List[List[int]] = []

    current_indices: List[int] = list(header_indices)
    current_data: List[List[str]] = list(data[:header_rows])
    current_height = 0.0

    if current_data:
        _, current_height = table_dimensions(
            current_data,
            available_width=available_width,
            col_widths=column_widths,
            repeat_rows=header_rows,
        )

    for body_position, original_index in enumerate(body_indices):
        data_index = header_rows + body_position
        row_data = data[data_index]

        candidate_data = current_data + [row_data]

        _, candidate_height = table_dimensions(
            candidate_data,
            available_width=available_width,
            col_widths=column_widths,
            repeat_rows=header_rows,
        )

        # STEP 17:
        # If adding the next row would exceed the available page height,
        # finish the current table chunk and start another one.
        #
        # A single oversized row is intentionally kept intact. The renderer
        # must never silently lose or reconstruct table content.
        if (
            current_indices
            and current_height > 0
            and candidate_height > available_height
            and len(current_indices) > header_rows
        ):
            chunks.append(current_indices)

            current_indices = list(header_indices) + [original_index]
            current_data = list(data[:header_rows]) + [row_data]

            _, current_height = table_dimensions(
                current_data,
                available_width=available_width,
                col_widths=column_widths,
                repeat_rows=header_rows,
            )

            continue

        current_indices.append(original_index)
        current_data = candidate_data
        current_height = candidate_height

    if current_indices:
        chunks.append(current_indices)

    if len(chunks) <= 1:
        return [node]

    # ------------------------------------------------------------
    # Rebuild each table chunk from the ORIGINAL TipTap row objects.
    # This is the critical difference from text matching:
    #
    #   original row object -> preserved exactly
    #
    # Therefore duplicate rows, marks, attributes, nested content, etc.
    # remain untouched.
    # ------------------------------------------------------------
    result: List[Dict[str, Any]] = []

    for chunk_indices in chunks:
        chunk_content: List[Dict[str, Any]] = [
            content[index]
            for index in chunk_indices
            if 0 <= index < len(content)
        ]

        split_node = dict(node)
        split_node["content"] = chunk_content

        result.append(split_node)

    return result


__all__ = [
    "build_table",
    "table_dimensions",
    "split_table_rows",
    "split_table_node",
]
