import re
from typing import List, Dict, Any

from app.schemas.ocr_schema import OCRWord


class OCRMathDetector:
    """
    Heuristic detector for possible mathematical expressions.

    This does NOT perform mathematical OCR yet.

    It identifies OCR regions that may contain mathematics
    and prepares them for a future math recognition model.
    """

    MATH_SYMBOLS = {
        "+",
        "-",
        "=",
        "×",
        "÷",
        "±",
        "√",
        "∑",
        "∫",
        "∞",
        "<",
        ">",
        "≤",
        "≥",
        "^",
        "²",
        "³",
    }

    MATH_PATTERNS = [
        re.compile(r".*\d+\s*[+\-*/=]\s*\d+.*"),
        re.compile(r".*[a-zA-Z]\s*[\^²³]\s*\d+.*"),
        re.compile(r".*[a-zA-Z]\s*[+\-*/=]\s*[a-zA-Z0-9].*"),
        re.compile(r".*\d+\s*[xX×]\s*\d+.*"),
    ]

    def __init__(self):
        pass

    def _contains_math_symbol(
        self,
        text: str
    ) -> bool:
        return any(
            symbol in text
            for symbol in self.MATH_SYMBOLS
        )

    def _matches_math_pattern(
        self,
        text: str
    ) -> bool:
        return any(
            pattern.match(text)
            for pattern in self.MATH_PATTERNS
        )

    def _calculate_math_score(
        self,
        text: str
    ) -> float:
        """
        Calculate how likely the OCR text is mathematical.

        This is only a routing signal.
        """

        if not text:
            return 0.0

        score = 0.0

        if self._contains_math_symbol(text):
            score += 0.45

        if self._matches_math_pattern(text):
            score += 0.40

        digits = sum(
            character.isdigit()
            for character in text
        )

        if digits > 0:
            score += 0.10

        if any(
            character in text
            for character in ["²", "³", "^", "√"]
        ):
            score += 0.20

        return min(
            round(score, 3),
            1.0
        )

    def detect_math_regions(
        self,
        words: List[OCRWord]
    ) -> List[Dict[str, Any]]:
        """
        Identify possible mathematical OCR regions.

        At this stage the input is OCR text rather than image
        regions. A future implementation can perform visual
        equation detection before OCR.
        """

        if not words:
            return []

        regions = []

        for word in words:

            if not word.text:
                continue

            score = self._calculate_math_score(
                word.text
            )

            if score < 0.45:
                continue

            regions.append({
                "text": word.text,
                "math_score": score,
                "bounding_box": word.bounding_box,
            })

        return regions