from typing import List, Optional, Dict, Any

from pydantic import BaseModel, Field


# =========================================================
# OCR WORD
# =========================================================

class OCRWord(BaseModel):
    """
    Represents one OCR-detected text region.
    """

    text: str

    confidence: Optional[float] = Field(
        default=None,
        ge=0.0,
        le=1.0
    )

    bounding_box: List[List[float]]

    confidence_level: Optional[str] = None

    needs_review: bool = False

    original_text: Optional[str] = None

    suggested_alternatives: List[str] = Field(
        default_factory=list
    )


# =========================================================
# OCR PARAGRAPH
# =========================================================

class OCRParagraph(BaseModel):
    """
    Represents a paragraph or text region detected
    by the OCR system.
    """

    text: str

    confidence: Optional[float] = Field(
        default=None,
        ge=0.0,
        le=1.0
    )

    bounding_box: Optional[
        List[List[float]]
    ] = None


# =========================================================
# OCR HEADING
# =========================================================

class OCRHeading(BaseModel):
    """
    Represents a detected heading.
    """

    text: str

    heading_score: float = Field(
        ...,
        ge=0.0,
        le=1.0
    )

    heading_level: str

    bounding_box: List[List[float]]

    signals: Dict[str, float] = Field(
        default_factory=dict
    )


# =========================================================
# OCR LIST ITEM
# =========================================================

class OCRListItem(BaseModel):
    """
    Represents one item inside an ordered or unordered list.
    """

    text: str

    marker: str

    number: Optional[int] = None

    bounding_box: Optional[
        List[List[float]]
    ] = None


# =========================================================
# OCR LIST
# =========================================================

class OCRList(BaseModel):
    """
    Represents a complete ordered or unordered list.
    """

    list_type: str

    items: List[OCRListItem] = Field(
        default_factory=list
    )


# =========================================================
# OCR TABLE CELL
# =========================================================

class OCRTableCell(BaseModel):
    """
    Represents one cell inside a detected table.
    """

    row: int

    column: int

    text: str = ""

    bounding_box: Optional[
        List[List[float]]
    ] = None


# =========================================================
# OCR TABLE
# =========================================================

class OCRTable(BaseModel):
    """
    Represents a structured table.
    """

    rows: int

    columns: int

    bounding_box: List[List[float]]

    cells: List[OCRTableCell] = Field(
        default_factory=list
    )


# =========================================================
# OCR MATH EXPRESSION
# =========================================================

class OCRMathExpression(BaseModel):
    """
    Represents a possible mathematical expression.

    The latex field will be populated when an actual
    mathematical OCR model is integrated.
    """

    text: Optional[str] = None

    latex: Optional[str] = None

    confidence: Optional[float] = Field(
        default=None,
        ge=0.0,
        le=1.0
    )

    bounding_box: Optional[
        List[List[float]]
    ] = None


# =========================================================
# DOCUMENT BLOCK
# =========================================================

class OCRDocumentBlock(BaseModel):
    """
    Represents a structured document block.

    Possible block types:

        heading
        paragraph
        list
        table
        math
    """

    type: str

    text: Optional[str] = None

    heading_level: Optional[str] = None

    items: Optional[
        List[OCRListItem]
    ] = None

    table: Optional[OCRTable] = None

    math: Optional[
        OCRMathExpression
    ] = None

    confidence: Optional[float] = Field(
        default=None,
        ge=0.0,
        le=1.0
    )

    bounding_box: Optional[
        List[List[float]]
    ] = None


# =========================================================
# OCR DOCUMENT
# =========================================================

class OCRDocument(BaseModel):
    """
    Structured editable OCR document.
    """

    title: Optional[str] = None

    confidence: Optional[float] = Field(
        default=None,
        ge=0.0,
        le=1.0
    )

    language: Optional[str] = None

    blocks: List[OCRDocumentBlock] = Field(
        default_factory=list
    )


# =========================================================
# OCR RESULT
# =========================================================

class OCRResult(BaseModel):
    """
    Common OCR result format used throughout InkAI.
    """

    full_text: str

    overall_confidence: Optional[float] = Field(
        default=None,
        ge=0.0,
        le=1.0
    )

    confidence_label: Optional[str] = None

    words: List[OCRWord] = Field(
        default_factory=list
    )

    paragraphs: List[OCRParagraph] = Field(
        default_factory=list
    )

    headings: List[OCRHeading] = Field(
        default_factory=list
    )

    lists: List[OCRList] = Field(
        default_factory=list
    )

    tables: List[OCRTable] = Field(
        default_factory=list
    )

    math_expressions: List[
        OCRMathExpression
    ] = Field(
        default_factory=list
    )

    document: Optional[OCRDocument] = None

    detected_language: Optional[str] = None

    processing_time: float = Field(
        ...,
        ge=0.0
    )