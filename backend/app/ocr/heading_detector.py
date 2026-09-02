from typing import List, Dict, Any, Optional

from app.schemas.ocr_schema import OCRWord, OCRParagraph


class OCRHeadingDetector:
    """
    Heuristic heading detector for OCR output.

    A line is considered a possible heading when several signals
    indicate that it behaves like a heading:
        - short line
        - near the top of the page
        - larger text
        - uppercase text
        - extra spacing around the line
    """

    # Maximum number of words normally expected in a heading
    MAX_HEADING_WORDS = 10

    # Maximum character length for a short heading
    MAX_HEADING_CHARACTERS = 80

    # A line must score at least this much to be considered a heading
    HEADING_SCORE_THRESHOLD = 0.60

    # Relative thresholds
    LARGE_TEXT_MULTIPLIER = 1.20
    TOP_PAGE_RATIO = 0.25
    LARGE_GAP_MULTIPLIER = 1.50

    def __init__(self):
        pass

    # ---------------------------------------------------------
    # Bounding box helpers
    # ---------------------------------------------------------

    @staticmethod
    def _get_box_coordinates(
        bounding_box: Optional[List[List[float]]]
    ) -> Optional[Dict[str, float]]:
        """
        Convert a 4-point bounding box into useful coordinates.

        Expected format:

        [
            [x1, y1],
            [x2, y2],
            [x3, y3],
            [x4, y4]
        ]
        """

        if not bounding_box or len(bounding_box) < 4:
            return None

        try:
            xs = [float(point[0]) for point in bounding_box]
            ys = [float(point[1]) for point in bounding_box]

            left = min(xs)
            right = max(xs)
            top = min(ys)
            bottom = max(ys)

            return {
                "left": left,
                "right": right,
                "top": top,
                "bottom": bottom,
                "width": right - left,
                "height": bottom - top,
                "center_x": (left + right) / 2,
                "center_y": (top + bottom) / 2,
            }

        except (TypeError, ValueError, IndexError):
            return None

    # ---------------------------------------------------------
    # Word sorting
    # ---------------------------------------------------------

    def _sort_words(self, words: List[OCRWord]) -> List[OCRWord]:
        """
        Sort OCR words approximately in reading order.
        """

        valid_words = [
            word
            for word in words
            if self._get_box_coordinates(word.bounding_box)
        ]

        return sorted(
            valid_words,
            key=lambda word: (
                self._get_box_coordinates(word.bounding_box)["center_y"],
                self._get_box_coordinates(word.bounding_box)["left"],
            ),
        )

    # ---------------------------------------------------------
    # Line detection
    # ---------------------------------------------------------

    def _group_words_into_lines(
        self,
        words: List[OCRWord]
    ) -> List[List[OCRWord]]:
        """
        Group OCR words into horizontal text lines.
        """

        if not words:
            return []

        sorted_words = self._sort_words(words)

        lines: List[List[OCRWord]] = []

        current_line: List[OCRWord] = []

        for word in sorted_words:
            box = self._get_box_coordinates(word.bounding_box)

            if box is None:
                continue

            if not current_line:
                current_line = [word]
                continue

            previous_boxes = [
                self._get_box_coordinates(w.bounding_box)
                for w in current_line
            ]

            previous_boxes = [
                b for b in previous_boxes if b is not None
            ]

            if not previous_boxes:
                current_line = [word]
                continue

            average_center_y = sum(
                b["center_y"] for b in previous_boxes
            ) / len(previous_boxes)

            average_height = sum(
                b["height"] for b in previous_boxes
            ) / len(previous_boxes)

            vertical_difference = abs(
                box["center_y"] - average_center_y
            )

            # Words belong to the same line when their vertical
            # centers are reasonably close.
            if vertical_difference <= average_height * 0.60:
                current_line.append(word)
            else:
                lines.append(current_line)
                current_line = [word]

        if current_line:
            lines.append(current_line)

        return lines

    # ---------------------------------------------------------
    # Line information
    # ---------------------------------------------------------

    def _get_line_information(
        self,
        line: List[OCRWord]
    ) -> Optional[Dict[str, Any]]:
        """
        Extract useful geometric and textual information from
        an OCR line.
        """

        if not line:
            return None

        boxes = [
            self._get_box_coordinates(word.bounding_box)
            for word in line
        ]

        boxes = [box for box in boxes if box is not None]

        if not boxes:
            return None

        text = " ".join(
            word.text.strip()
            for word in line
            if word.text and word.text.strip()
        ).strip()

        if not text:
            return None

        left = min(box["left"] for box in boxes)
        right = max(box["right"] for box in boxes)
        top = min(box["top"] for box in boxes)
        bottom = max(box["bottom"] for box in boxes)

        height = bottom - top

        center_x = (left + right) / 2

        return {
            "words": line,
            "text": text,
            "word_count": len(line),
            "character_count": len(text),
            "left": left,
            "right": right,
            "top": top,
            "bottom": bottom,
            "width": right - left,
            "height": height,
            "center_x": center_x,
        }

    # ---------------------------------------------------------
    # Heading signals
    # ---------------------------------------------------------

    def _short_line_score(
        self,
        line_info: Dict[str, Any]
    ) -> float:
        """
        Score whether the line is short enough to resemble a heading.
        """

        word_count = line_info["word_count"]
        character_count = line_info["character_count"]

        if word_count <= 4 and character_count <= 40:
            return 1.0

        if word_count <= 7 and character_count <= 60:
            return 0.8

        if word_count <= self.MAX_HEADING_WORDS:
            return 0.5

        if character_count <= self.MAX_HEADING_CHARACTERS:
            return 0.3

        return 0.0

    def _top_position_score(
        self,
        line_info: Dict[str, Any],
        page_height: float
    ) -> float:
        """
        Score whether the line is near the top of the page.
        """

        if page_height <= 0:
            return 0.0

        relative_top = line_info["top"] / page_height

        if relative_top <= 0.10:
            return 1.0

        if relative_top <= self.TOP_PAGE_RATIO:
            return 0.8

        if relative_top <= 0.40:
            return 0.4

        return 0.0

    def _large_text_score(
        self,
        line_info: Dict[str, Any],
        average_line_height: float
    ) -> float:
        """
        Score whether the line appears larger than normal text.
        """

        if average_line_height <= 0:
            return 0.0

        ratio = line_info["height"] / average_line_height

        if ratio >= 1.50:
            return 1.0

        if ratio >= self.LARGE_TEXT_MULTIPLIER:
            return 0.8

        if ratio >= 1.05:
            return 0.3

        return 0.0

    def _uppercase_score(
        self,
        line_info: Dict[str, Any]
    ) -> float:
        """
        Score uppercase text.

        Handwritten OCR may not preserve capitalization reliably,
        so uppercase is only one signal rather than a requirement.
        """

        text = line_info["text"]

        letters = [
            char for char in text
            if char.isalpha()
        ]

        if not letters:
            return 0.0

        uppercase_count = sum(
            1 for char in letters
            if char.isupper()
        )

        uppercase_ratio = uppercase_count / len(letters)

        if uppercase_ratio >= 0.90:
            return 1.0

        if uppercase_ratio >= 0.70:
            return 0.8

        if uppercase_ratio >= 0.50:
            return 0.4

        return 0.0

    def _spacing_score(
        self,
        line_index: int,
        line_infos: List[Dict[str, Any]]
    ) -> float:
        """
        Detect extra vertical spacing around a line.
        """

        if len(line_infos) <= 1:
            return 0.0

        current = line_infos[line_index]

        gaps = []

        # Gap before current line
        if line_index > 0:
            previous = line_infos[line_index - 1]

            gap_before = current["top"] - previous["bottom"]

            if gap_before >= 0:
                gaps.append(gap_before)

        # Gap after current line
        if line_index < len(line_infos) - 1:
            next_line = line_infos[line_index + 1]

            gap_after = next_line["top"] - current["bottom"]

            if gap_after >= 0:
                gaps.append(gap_after)

        if not gaps:
            return 0.0

        average_gap = sum(gaps) / len(gaps)

        normal_gaps = []

        for i in range(len(line_infos) - 1):
            gap = (
                line_infos[i + 1]["top"]
                - line_infos[i]["bottom"]
            )

            if gap >= 0:
                normal_gaps.append(gap)

        if not normal_gaps:
            return 0.0

        median_gap = sorted(normal_gaps)[
            len(normal_gaps) // 2
        ]

        if median_gap <= 0:
            return 0.0

        ratio = average_gap / median_gap

        if ratio >= 2.5:
            return 1.0

        if ratio >= self.LARGE_GAP_MULTIPLIER:
            return 0.8

        if ratio >= 1.2:
            return 0.4

        return 0.0

    # ---------------------------------------------------------
    # Heading score
    # ---------------------------------------------------------

    def _calculate_heading_score(
        self,
        line_info: Dict[str, Any],
        line_index: int,
        line_infos: List[Dict[str, Any]],
        page_height: float,
        average_line_height: float,
    ) -> Dict[str, Any]:
        """
        Calculate the overall heading probability using
        multiple heuristic signals.
        """

        short_score = self._short_line_score(line_info)

        top_score = self._top_position_score(
            line_info,
            page_height
        )

        large_text_score = self._large_text_score(
            line_info,
            average_line_height
        )

        uppercase_score = self._uppercase_score(
            line_info
        )

        spacing_score = self._spacing_score(
            line_index,
            line_infos
        )

        # Weighted heuristic.
        #
        # Text size and short-line characteristics receive
        # slightly higher importance than capitalization.
        score = (
            short_score * 0.25
            + top_score * 0.20
            + large_text_score * 0.25
            + uppercase_score * 0.10
            + spacing_score * 0.20
        )

        return {
            "score": round(score, 3),
            "signals": {
                "short_line": round(short_score, 3),
                "near_top": round(top_score, 3),
                "large_text": round(large_text_score, 3),
                "uppercase": round(uppercase_score, 3),
                "extra_spacing": round(spacing_score, 3),
            },
        }

    # ---------------------------------------------------------
    # Public API
    # ---------------------------------------------------------

    def detect_headings(
        self,
        words: List[OCRWord],
        page_height: Optional[float] = None,
    ) -> List[Dict[str, Any]]:
        """
        Detect possible headings from OCR words.

        Returns a list of detected heading candidates.
        """

        if not words:
            return []

        lines = self._group_words_into_lines(words)

        line_infos = []

        for line in lines:
            info = self._get_line_information(line)

            if info:
                line_infos.append(info)

        if not line_infos:
            return []

        # If page height is not provided, estimate it from OCR boxes.
        if page_height is None:
            page_height = max(
                line["bottom"]
                for line in line_infos
            )

        if page_height <= 0:
            return []

        average_line_height = sum(
            line["height"]
            for line in line_infos
        ) / len(line_infos)

        headings = []

        for index, line_info in enumerate(line_infos):

            result = self._calculate_heading_score(
                line_info=line_info,
                line_index=index,
                line_infos=line_infos,
                page_height=page_height,
                average_line_height=average_line_height,
            )

            score = result["score"]

            if score < self.HEADING_SCORE_THRESHOLD:
                continue

            headings.append({
                "text": line_info["text"],
                "heading_score": score,
                "heading_level": self._determine_heading_level(
                    score
                ),
                "bounding_box": [
                    [line_info["left"], line_info["top"]],
                    [line_info["right"], line_info["top"]],
                    [line_info["right"], line_info["bottom"]],
                    [line_info["left"], line_info["bottom"]],
                ],
                "signals": result["signals"],
            })

        return headings

    @staticmethod
    def _determine_heading_level(score: float) -> str:
        """
        Convert heading score into a simple heading level.
        """

        if score >= 0.85:
            return "h1"

        if score >= 0.72:
            return "h2"

        return "h3"