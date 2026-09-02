import re
from typing import List, Dict, Any, Optional

from app.schemas.ocr_schema import OCRWord


class OCRListDetector:
    """
    Regex-based list detector for OCR output.

    Detects:
        1. Item
        2. Item

        • Item
        • Item

        - Item
        - Item
    """

    # Ordered list:
    # 1. Introduction
    # 2. Methodology
    #
    # Also supports:
    # 1) Introduction
    ORDERED_PATTERN = re.compile(
        r"^\s*(\d+)\s*[\.\)]\s+(.+?)\s*$"
    )

    # Bullet list:
    # • Introduction
    # * Introduction
    # · Introduction
    BULLET_PATTERN = re.compile(
        r"^\s*([•*·])\s+(.+?)\s*$"
    )

    # Dash list:
    # - Introduction
    # – Introduction
    # — Introduction
    DASH_PATTERN = re.compile(
        r"^\s*([-–—])\s+(.+?)\s*$"
    )

    def __init__(self):
        pass

    # ---------------------------------------------------------
    # Pattern detection
    # ---------------------------------------------------------

    def _detect_list_item(
        self,
        text: str
    ) -> Optional[Dict[str, Any]]:
        """
        Determine whether a line is a list item.
        """

        if not text:
            return None

        text = text.strip()

        # Ordered list
        match = self.ORDERED_PATTERN.match(text)

        if match:
            return {
                "list_type": "ordered",
                "marker": match.group(1),
                "text": match.group(2).strip(),
                "number": int(match.group(1)),
            }

        # Bullet list
        match = self.BULLET_PATTERN.match(text)

        if match:
            return {
                "list_type": "unordered",
                "marker": match.group(1),
                "text": match.group(2).strip(),
                "number": None,
            }

        # Dash list
        match = self.DASH_PATTERN.match(text)

        if match:
            return {
                "list_type": "unordered",
                "marker": match.group(1),
                "text": match.group(2).strip(),
                "number": None,
            }

        return None

    # ---------------------------------------------------------
    # Bounding box helpers
    # ---------------------------------------------------------

    @staticmethod
    def _get_box_coordinates(
        bounding_box: Optional[List[List[float]]]
    ) -> Optional[Dict[str, float]]:
        """
        Convert OCR bounding box to coordinates.
        """

        if not bounding_box or len(bounding_box) < 4:
            return None

        try:
            xs = [
                float(point[0])
                for point in bounding_box
            ]

            ys = [
                float(point[1])
                for point in bounding_box
            ]

            return {
                "left": min(xs),
                "right": max(xs),
                "top": min(ys),
                "bottom": max(ys),
                "center_y": (
                    min(ys) + max(ys)
                ) / 2,
            }

        except (TypeError, ValueError, IndexError):
            return None

    # ---------------------------------------------------------
    # Word sorting
    # ---------------------------------------------------------

    def _sort_words(
        self,
        words: List[OCRWord]
    ) -> List[OCRWord]:
        """
        Sort words approximately in reading order.
        """

        valid_words = []

        for word in words:
            box = self._get_box_coordinates(
                word.bounding_box
            )

            if box:
                valid_words.append(word)

        return sorted(
            valid_words,
            key=lambda word: (
                self._get_box_coordinates(
                    word.bounding_box
                )["center_y"],
                self._get_box_coordinates(
                    word.bounding_box
                )["left"],
            ),
        )

    # ---------------------------------------------------------
    # Group words into lines
    # ---------------------------------------------------------

    def _group_words_into_lines(
        self,
        words: List[OCRWord]
    ) -> List[List[OCRWord]]:
        """
        Group OCR words into horizontal lines.
        """

        if not words:
            return []

        sorted_words = self._sort_words(words)

        lines: List[List[OCRWord]] = []
        current_line: List[OCRWord] = []

        for word in sorted_words:

            box = self._get_box_coordinates(
                word.bounding_box
            )

            if box is None:
                continue

            if not current_line:
                current_line = [word]
                continue

            previous_boxes = [
                self._get_box_coordinates(
                    existing.bounding_box
                )
                for existing in current_line
            ]

            previous_boxes = [
                b for b in previous_boxes
                if b is not None
            ]

            average_center_y = sum(
                b["center_y"]
                for b in previous_boxes
            ) / len(previous_boxes)

            average_height = sum(
                b["bottom"] - b["top"]
                for b in previous_boxes
            ) / len(previous_boxes)

            vertical_difference = abs(
                box["center_y"]
                - average_center_y
            )

            if vertical_difference <= average_height * 0.60:
                current_line.append(word)
            else:
                lines.append(current_line)
                current_line = [word]

        if current_line:
            lines.append(current_line)

        return lines

    # ---------------------------------------------------------
    # Line text
    # ---------------------------------------------------------

    @staticmethod
    def _line_text(
        line: List[OCRWord]
    ) -> str:
        """
        Convert OCR words into a single line.
        """

        words = [
            word.text.strip()
            for word in line
            if word.text and word.text.strip()
        ]

        return " ".join(words).strip()

    # ---------------------------------------------------------
    # Bounding box
    # ---------------------------------------------------------

    def _line_bounding_box(
        self,
        line: List[OCRWord]
    ) -> Optional[List[List[float]]]:
        """
        Calculate the bounding box surrounding an entire line.
        """

        boxes = [
            self._get_box_coordinates(
                word.bounding_box
            )
            for word in line
        ]

        boxes = [
            box for box in boxes
            if box is not None
        ]

        if not boxes:
            return None

        left = min(box["left"] for box in boxes)
        right = max(box["right"] for box in boxes)
        top = min(box["top"] for box in boxes)
        bottom = max(box["bottom"] for box in boxes)

        return [
            [left, top],
            [right, top],
            [right, bottom],
            [left, bottom],
        ]

    # ---------------------------------------------------------
    # Main detector
    # ---------------------------------------------------------

    def detect_lists(
        self,
        words: List[OCRWord]
    ) -> List[Dict[str, Any]]:
        """
        Detect consecutive ordered and unordered lists.

        Returns structured list data.
        """

        if not words:
            return []

        lines = self._group_words_into_lines(words)

        detected_items = []

        for line in lines:

            text = self._line_text(line)

            if not text:
                continue

            item = self._detect_list_item(text)

            if item is None:
                detected_items.append({
                    "is_list_item": False,
                    "line": line,
                })
                continue

            item["is_list_item"] = True
            item["line"] = line
            item["bounding_box"] = (
                self._line_bounding_box(line)
            )

            detected_items.append(item)

        # Group consecutive list items
        lists = []

        current_list = None

        for item in detected_items:

            if not item["is_list_item"]:

                if current_list:
                    lists.append(current_list)
                    current_list = None

                continue

            list_type = item["list_type"]

            # Start a new list
            if current_list is None:

                current_list = {
                    "list_type": list_type,
                    "items": [],
                }

            # Different list type → close previous list
            elif current_list["list_type"] != list_type:

                lists.append(current_list)

                current_list = {
                    "list_type": list_type,
                    "items": [],
                }

            current_list["items"].append({
                "text": item["text"],
                "marker": item["marker"],
                "number": item["number"],
                "bounding_box": item["bounding_box"],
            })

        # Add final list
        if current_list:
            lists.append(current_list)

        return lists