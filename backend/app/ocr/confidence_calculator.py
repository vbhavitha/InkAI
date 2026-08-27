from typing import List, Optional, Tuple

from app.schemas.ocr_schema import OCRWord


class OCRConfidenceCalculator:
    """
    Calculates the overall confidence of an OCR result.

    The overall confidence is calculated as the arithmetic
    average of all available word confidence scores.

    Confidence values are expected to be between 0 and 1.
    """

    @staticmethod
    def calculate_overall_confidence(
        words: List[OCRWord]
    ) -> Optional[float]:
        """
        Calculate the average confidence across OCR words.

        Returns:
            A confidence value between 0 and 1,
            or None if no confidence values are available.
        """

        confidence_values = [
            word.confidence
            for word in words
            if word.confidence is not None
        ]

        if not confidence_values:
            return None

        overall_confidence = (
            sum(confidence_values)
            / len(confidence_values)
        )

        return round(
            overall_confidence,
            4
        )

    @staticmethod
    def get_confidence_label(
        confidence: Optional[float]
    ) -> str:
        """
        Convert a confidence score into a user-friendly label.

        90–100% → Excellent
        75–89%  → Good
        60–74%  → Needs Review
        Below 60% → Low Confidence
        """

        if confidence is None:
            return "Unknown"

        percentage = confidence * 100

        if percentage >= 90:
            return "Excellent"

        if percentage >= 75:
            return "Good"

        if percentage >= 60:
            return "Needs Review"

        return "Low Confidence"

    @staticmethod
    def calculate(
        words: List[OCRWord]
    ) -> Tuple[Optional[float], str]:
        """
        Calculate both the overall confidence and its label.
        """

        confidence = (
            OCRConfidenceCalculator
            .calculate_overall_confidence(
                words
            )
        )

        label = (
            OCRConfidenceCalculator
            .get_confidence_label(
                confidence
            )
        )

        return confidence, label