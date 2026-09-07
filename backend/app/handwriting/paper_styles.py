"""
InkAI Paper Style System

Shared paper configuration for:
    - Browser preview
    - Handwriting layout
    - Future PDF rendering
"""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class PaperStyle:
    """
    Defines the physical writing characteristics of a paper.
    """

    id: str
    name: str

    # Distance between writing baselines.
    line_height: float

    # Distance from the top of the page to the first
    # writing baseline.
    baseline_offset: float

    # Physical writing margins.
    top_margin: float
    right_margin: float
    bottom_margin: float
    left_margin: float

    # Paper features.
    show_horizontal_lines: bool = False
    show_vertical_margin: bool = False

    # Position of the vertical margin line.
    margin_position: float | None = None

    # Grid size for graph paper.
    grid_size: float | None = None


# ============================================================
# PAPER DEFINITIONS
# ============================================================

PLAIN_PAPER = PaperStyle(
    id="plain",
    name="Plain Paper",

    line_height=28.0,
    baseline_offset=22.0,

    top_margin=48.0,
    right_margin=50.0,
    bottom_margin=56.0,
    left_margin=50.0,

    show_horizontal_lines=False,
    show_vertical_margin=False,
)


RULED_NOTEBOOK = PaperStyle(
    id="ruled",
    name="Ruled Notebook",

    line_height=28.0,
    baseline_offset=22.0,

    top_margin=48.0,
    right_margin=50.0,
    bottom_margin=56.0,
    left_margin=50.0,

    show_horizontal_lines=True,
    show_vertical_margin=False,
)


COLLEGE_NOTEBOOK = PaperStyle(
    id="college",
    name="College Notebook",

    line_height=28.0,
    baseline_offset=22.0,

    top_margin=48.0,
    right_margin=50.0,
    bottom_margin=56.0,
    left_margin=70.0,

    show_horizontal_lines=True,
    show_vertical_margin=True,

    margin_position=62.0,
)


GRAPH_PAPER = PaperStyle(
    id="graph",
    name="Graph Paper",

    line_height=20.0,
    baseline_offset=16.0,

    top_margin=40.0,
    right_margin=50.0,
    bottom_margin=56.0,
    left_margin=50.0,

    show_horizontal_lines=True,
    show_vertical_margin=False,

    grid_size=20.0,
)


MARGIN_NOTEBOOK = PaperStyle(
    id="margin",
    name="Margin Notebook",

    line_height=28.0,
    baseline_offset=22.0,

    top_margin=48.0,
    right_margin=50.0,
    bottom_margin=56.0,
    left_margin=82.0,

    show_horizontal_lines=True,
    show_vertical_margin=True,

    margin_position=62.0,
)


PAPER_STYLES = {
    "plain": PLAIN_PAPER,
    "ruled": RULED_NOTEBOOK,
    "college": COLLEGE_NOTEBOOK,
    "graph": GRAPH_PAPER,
    "margin": MARGIN_NOTEBOOK,
}


def get_paper_style(
    paper_id: str = "ruled",
) -> PaperStyle:
    """
    Return the configured paper style.

    Unknown styles fall back to ruled notebook paper.
    """

    return PAPER_STYLES.get(
        paper_id,
        RULED_NOTEBOOK,
    )


def get_baseline_y(
    paper_id: str,
    line_index: int,
) -> float:
    """
    Calculate the baseline Y position for a writing line.
    """

    paper = get_paper_style(
        paper_id
    )

    return (
        paper.top_margin
        + paper.baseline_offset
        + (
            line_index
            * paper.line_height
        )
    )


def get_writing_x(
    paper_id: str,
) -> float:
    """
    Return the X coordinate where writing should begin.
    """

    paper = get_paper_style(
        paper_id
    )

    return paper.left_margin