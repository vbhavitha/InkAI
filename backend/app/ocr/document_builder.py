from typing import List, Optional

from app.schemas.ocr_schema import (
    OCRWord,
    OCRParagraph,
    OCRHeading,
    OCRList,
    OCRTable,
    OCRDocument,
    OCRDocumentBlock,
)


class OCRDocumentBuilder:
    """
    Converts OCR structural results into a single
    editable document representation.
    """

    # =====================================================
    # TITLE
    # =====================================================

    def _detect_title(
        self,
        headings: List[OCRHeading]
    ) -> Optional[str]:
        """
        Use the first strong heading as the document title.
        """

        if not headings:
            return None

        # Prefer H1
        for heading in headings:

            if heading.heading_level == "h1":
                return heading.text

        # Otherwise use the first detected heading
        return headings[0].text

    # =====================================================
    # HEADING BLOCKS
    # =====================================================

    def _create_heading_blocks(
        self,
        headings: List[OCRHeading]
    ) -> List[OCRDocumentBlock]:

        blocks: List[OCRDocumentBlock] = []

        for heading in headings:

            blocks.append(
                OCRDocumentBlock(
                    type="heading",

                    text=heading.text,

                    heading_level=(
                        heading.heading_level
                    ),

                    confidence=(
                        heading.heading_score
                    ),

                    bounding_box=(
                        heading.bounding_box
                    ),
                )
            )

        return blocks

    # =====================================================
    # PARAGRAPH BLOCKS
    # =====================================================

    def _create_paragraph_blocks(
        self,
        paragraphs: List[OCRParagraph]
    ) -> List[OCRDocumentBlock]:

        blocks: List[OCRDocumentBlock] = []

        for paragraph in paragraphs:

            blocks.append(
                OCRDocumentBlock(
                    type="paragraph",

                    text=paragraph.text,

                    confidence=(
                        paragraph.confidence
                    ),

                    bounding_box=(
                        paragraph.bounding_box
                    ),
                )
            )

        return blocks

    # =====================================================
    # LIST BLOCKS
    # =====================================================

    def _create_list_blocks(
        self,
        lists: List[OCRList]
    ) -> List[OCRDocumentBlock]:

        blocks: List[OCRDocumentBlock] = []

        for detected_list in lists:

            # Calculate a bounding box for the entire list
            # from its individual items.

            bounding_box = (
                self._calculate_list_bounding_box(
                    detected_list
                )
            )

            blocks.append(
                OCRDocumentBlock(
                    type="list",

                    items=(
                        detected_list.items
                    ),

                    bounding_box=bounding_box,
                )
            )

        return blocks

    # =====================================================
    # TABLE BLOCKS
    # =====================================================

    def _create_table_blocks(
        self,
        tables: List[OCRTable]
    ) -> List[OCRDocumentBlock]:

        blocks: List[OCRDocumentBlock] = []

        for table in tables:

            blocks.append(
                OCRDocumentBlock(
                    type="table",

                    table=table,

                    bounding_box=(
                        table.bounding_box
                    ),
                )
            )

        return blocks

    # =====================================================
    # LIST BOUNDING BOX
    # =====================================================

    def _calculate_list_bounding_box(
        self,
        detected_list: OCRList
    ) -> Optional[List[List[float]]]:
        """
        Calculate a bounding box surrounding all list items.
        """

        boxes = []

        for item in detected_list.items:

            if not item.bounding_box:
                continue

            try:

                xs = [
                    point[0]
                    for point in item.bounding_box
                ]

                ys = [
                    point[1]
                    for point in item.bounding_box
                ]

                boxes.append({
                    "left": min(xs),
                    "right": max(xs),
                    "top": min(ys),
                    "bottom": max(ys),
                })

            except (
                IndexError,
                TypeError,
                ValueError
            ):
                continue

        if not boxes:
            return None

        left = min(
            box["left"]
            for box in boxes
        )

        right = max(
            box["right"]
            for box in boxes
        )

        top = min(
            box["top"]
            for box in boxes
        )

        bottom = max(
            box["bottom"]
            for box in boxes
        )

        return [
            [left, top],
            [right, top],
            [right, bottom],
            [left, bottom],
        ]

    # =====================================================
    # SORT BLOCKS
    # =====================================================

    def _sort_blocks(
        self,
        blocks: List[OCRDocumentBlock]
    ) -> List[OCRDocumentBlock]:
        """
        Sort document blocks according to their vertical
        position on the page.
        """

        def get_top(
            block: OCRDocumentBlock
        ) -> float:

            if not block.bounding_box:
                return float("inf")

            try:

                return min(
                    point[1]
                    for point in block.bounding_box
                )

            except (
                IndexError,
                TypeError,
                ValueError
            ):
                return float("inf")

        return sorted(
            blocks,
            key=get_top
        )

    # =====================================================
    # BUILD DOCUMENT
    # =====================================================

    def build_document(
        self,
        words: List[OCRWord],
        paragraphs: List[OCRParagraph],
        headings: List[OCRHeading],
        lists: List[OCRList],
        tables: List[OCRTable],
        overall_confidence: Optional[float],
        language: Optional[str],
    ) -> OCRDocument:
        """
        Build the structured editable OCR document.
        """

        title = self._detect_title(
            headings
        )

        blocks: List[OCRDocumentBlock] = []

        # -------------------------------------------------
        # Headings
        # -------------------------------------------------

        blocks.extend(
            self._create_heading_blocks(
                headings
            )
        )

        # -------------------------------------------------
        # Paragraphs
        # -------------------------------------------------

        blocks.extend(
            self._create_paragraph_blocks(
                paragraphs
            )
        )

        # -------------------------------------------------
        # Lists
        # -------------------------------------------------

        blocks.extend(
            self._create_list_blocks(
                lists
            )
        )

        # -------------------------------------------------
        # Tables
        # -------------------------------------------------

        blocks.extend(
            self._create_table_blocks(
                tables
            )
        )

        # -------------------------------------------------
        # Preserve page order
        # -------------------------------------------------

        blocks = self._sort_blocks(
            blocks
        )

        # -------------------------------------------------
        # Build document
        # -------------------------------------------------

        return OCRDocument(
            title=title,

            confidence=(
                overall_confidence
            ),

            language=language,

            blocks=blocks,
        )