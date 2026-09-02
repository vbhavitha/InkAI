from typing import List

import numpy as np

from app.schemas.ocr_schema import (
    OCRParagraph,
    OCRWord,
)


class OCRParagraphDetector:
    """
    Reconstruct paragraphs from OCR word bounding boxes.

    Strategy:

        OCR words
            ↓
        Sort vertically
            ↓
        Group words into lines
            ↓
        Measure gaps between lines
            ↓
        Large gap → new paragraph
    """

    # Maximum vertical distance between two lines for them
    # to be considered part of the same paragraph.
    PARAGRAPH_GAP_MULTIPLIER = 1.8

    # Maximum vertical distance for words to belong to
    # the same text line.
    LINE_ALIGNMENT_MULTIPLIER = 0.5

    # =====================================================
    # BOUNDING BOX HELPERS
    # =====================================================

    @staticmethod
    def _get_box_coordinates(
        word: OCRWord
    ):
        """
        Extract useful coordinates from an OCR bounding box.

        Returns:

            x_min
            y_min
            x_max
            y_max
            center_y
            height
        """

        points = np.array(
            word.bounding_box,
            dtype=np.float32
        )

        if points.shape != (4, 2):
            raise ValueError(
                "Invalid OCR bounding box."
            )

        x_min = float(
            np.min(points[:, 0])
        )

        y_min = float(
            np.min(points[:, 1])
        )

        x_max = float(
            np.max(points[:, 0])
        )

        y_max = float(
            np.max(points[:, 1])
        )

        height = y_max - y_min

        center_y = (
            y_min + y_max
        ) / 2

        return (
            x_min,
            y_min,
            x_max,
            y_max,
            center_y,
            height
        )

    # =====================================================
    # SORT WORDS
    # =====================================================

    def _sort_words(
        self,
        words: List[OCRWord]
    ) -> List[OCRWord]:
        """
        Sort OCR words approximately from top to bottom.

        Words on the same line are subsequently sorted
        from left to right.
        """

        return sorted(
            words,
            key=lambda word: (
                self._get_box_coordinates(word)[4],
                self._get_box_coordinates(word)[0]
            )
        )

    # =====================================================
    # GROUP WORDS INTO LINES
    # =====================================================

    def _group_into_lines(
        self,
        words: List[OCRWord]
    ) -> List[List[OCRWord]]:
        """
        Group words that appear on the same horizontal line.
        """

        lines = []

        for word in self._sort_words(words):

            (
                x_min,
                _,
                _,
                _,
                center_y,
                height
            ) = self._get_box_coordinates(
                word
            )

            placed = False

            for line in lines:

                line_centers = [
                    self._get_box_coordinates(
                        existing_word
                    )[4]
                    for existing_word in line
                ]

                average_center_y = (
                    sum(line_centers)
                    / len(line_centers)
                )

                line_heights = [
                    self._get_box_coordinates(
                        existing_word
                    )[5]
                    for existing_word in line
                ]

                average_height = (
                    sum(line_heights)
                    / len(line_heights)
                )

                alignment_limit = max(
                    5.0,
                    average_height
                    * self.LINE_ALIGNMENT_MULTIPLIER
                )

                if abs(
                    center_y - average_center_y
                ) <= alignment_limit:

                    line.append(word)

                    line.sort(
                        key=lambda item:
                        self._get_box_coordinates(
                            item
                        )[0]
                    )

                    placed = True

                    break

            if not placed:
                lines.append([word])

        # Sort complete lines vertically.
        lines.sort(
            key=lambda line:
            min(
                self._get_box_coordinates(word)[1]
                for word in line
            )
        )

        return lines

    # =====================================================
    # CALCULATE LINE INFORMATION
    # =====================================================

    def _get_line_information(
        self,
        line: List[OCRWord]
    ):
        """
        Calculate the vertical boundaries and average
        character height of a line.
        """

        top = min(
            self._get_box_coordinates(word)[1]
            for word in line
        )

        bottom = max(
            self._get_box_coordinates(word)[3]
            for word in line
        )

        heights = [
            self._get_box_coordinates(word)[5]
            for word in line
        ]

        average_height = (
            sum(heights)
            / len(heights)
        )

        return (
            top,
            bottom,
            average_height
        )

    # =====================================================
    # BUILD PARAGRAPHS
    # =====================================================

    def detect_paragraphs(
        self,
        words: List[OCRWord]
    ) -> List[OCRParagraph]:
        """
        Convert OCR words into paragraphs.
        """

        if not words:
            return []

        # ---------------------------------------------
        # Remove empty OCR words
        # ---------------------------------------------

        valid_words = [
            word
            for word in words
            if word.text
            and word.text.strip()
        ]

        if not valid_words:
            return []

        # ---------------------------------------------
        # Group words into lines
        # ---------------------------------------------

        lines = self._group_into_lines(
            valid_words
        )

        if not lines:
            return []

        # ---------------------------------------------
        # Group lines into paragraphs
        # ---------------------------------------------

        paragraphs = []

        current_paragraph = [
            lines[0]
        ]

        previous_top, previous_bottom, previous_height = (
            self._get_line_information(
                lines[0]
            )
        )

        for line in lines[1:]:

            (
                current_top,
                current_bottom,
                current_height
            ) = self._get_line_information(
                line
            )

            vertical_gap = (
                current_top - previous_bottom
            )

            reference_height = max(
                previous_height,
                current_height
            )

            paragraph_gap_limit = (
                reference_height
                * self.PARAGRAPH_GAP_MULTIPLIER
            )

            # -----------------------------------------
            # Same paragraph
            # -----------------------------------------

            if vertical_gap <= paragraph_gap_limit:

                current_paragraph.append(
                    line
                )

            # -----------------------------------------
            # New paragraph
            # -----------------------------------------

            else:

                paragraphs.append(
                    current_paragraph
                )

                current_paragraph = [
                    line
                ]

            previous_top = current_top
            previous_bottom = current_bottom
            previous_height = current_height

        # Add final paragraph.
        paragraphs.append(
            current_paragraph
        )

        # ---------------------------------------------
        # Convert groups to OCRParagraph objects
        # ---------------------------------------------

        result = []

        for paragraph_lines in paragraphs:

            paragraph_words = []

            for line in paragraph_lines:
                paragraph_words.extend(line)

            paragraph_words.sort(
                key=lambda word: (
                    self._get_box_coordinates(word)[1],
                    self._get_box_coordinates(word)[0]
                )
            )

            paragraph_text = " ".join(
                word.text.strip()
                for word in paragraph_words
                if word.text.strip()
            )

            if not paragraph_text:
                continue

            confidence_values = [
                word.confidence
                for word in paragraph_words
                if word.confidence is not None
            ]

            paragraph_confidence = None

            if confidence_values:

                paragraph_confidence = (
                    sum(confidence_values)
                    / len(confidence_values)
                )

            # -----------------------------------------
            # Paragraph bounding box
            # -----------------------------------------

            all_points = []

            for word in paragraph_words:
                all_points.extend(
                    word.bounding_box
                )

            points = np.array(
                all_points,
                dtype=np.float32
            )

            x_min = float(
                np.min(points[:, 0])
            )

            y_min = float(
                np.min(points[:, 1])
            )

            x_max = float(
                np.max(points[:, 0])
            )

            y_max = float(
                np.max(points[:, 1])
            )

            bounding_box = [
                [x_min, y_min],
                [x_max, y_min],
                [x_max, y_max],
                [x_min, y_max]
            ]

            result.append(
                OCRParagraph(
                    text=paragraph_text,
                    confidence=paragraph_confidence,
                    bounding_box=bounding_box
                )
            )

        return result