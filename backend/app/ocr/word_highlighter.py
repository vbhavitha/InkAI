from typing import List

from app.schemas.ocr_schema import OCRWord


class OCRWordHighlighter:
    """
    Classifies OCR words according to their confidence.

    The frontend can use the returned information to
    highlight uncertain words and allow user correction.
    """

    HIGH_CONFIDENCE = 0.90
    MEDIUM_CONFIDENCE = 0.75

    @classmethod
    def get_confidence_level(
        cls,
        confidence: float | None
    ) -> str:
        """
        Convert a confidence score into a word-level label.

        >= 90% → high
        75–89% → medium
        < 75% → low
        """

        if confidence is None:
            return "unknown"

        if confidence >= cls.HIGH_CONFIDENCE:
            return "high"

        if confidence >= cls.MEDIUM_CONFIDENCE:
            return "medium"

        return "low"

    @classmethod
    def needs_review(
        cls,
        confidence: float | None
    ) -> bool:
        """
        Low-confidence OCR words should be reviewed by
        the user.
        """

        return (
            confidence is None
            or confidence < cls.MEDIUM_CONFIDENCE
        )

    @classmethod
    def add_highlighting_metadata(
        cls,
        words: List[OCRWord]
    ) -> List[OCRWord]:
        """
        Add confidence and review metadata to every OCR word.

        This does not modify bounding boxes or OCR text.
        """

        highlighted_words = []

        for word in words:

            confidence_level = (
                cls.get_confidence_level(
                    word.confidence
                )
            )

            word.needs_review = cls.needs_review(
                word.confidence
            )

            word.confidence_level = confidence_level

            highlighted_words.append(
                word
            )

        return highlighted_words