from typing import List, Optional

import easyocr

from app.schemas.ocr_schema import (
    OCRResult,
    OCRWord,
)


class EasyOCREngine:
    """
    EasyOCR wrapper for InkAI.

    The OCR language configuration is supplied when the
    engine is initialized.
    """

    def __init__(
        self,
        languages: Optional[List[str]] = None,
        gpu: bool = False,
    ):
        self.languages = languages or ["en"]
        self.gpu = gpu

        self.reader = easyocr.Reader(
            self.languages,
            gpu=self.gpu,
        )

    def read_image(
        self,
        image
    ) -> OCRResult:
        """
        Run EasyOCR on an image.
        """

        results = self.reader.readtext(
            image
        )

        words = []

        for bounding_box, text, confidence in results:

            words.append(
                OCRWord(
                    text=text,
                    confidence=float(
                        confidence
                    ),
                    bounding_box=[
                        [
                            float(point[0]),
                            float(point[1])
                        ]
                        for point in bounding_box
                    ],
                )
            )

        overall_confidence = None

        if words:
            valid_confidences = [
                word.confidence
                for word in words
                if word.confidence is not None
            ]

            if valid_confidences:
                overall_confidence = sum(
                    valid_confidences
                ) / len(valid_confidences)

        return OCRResult(
            full_text=" ".join(
                word.text
                for word in words
            ),
            overall_confidence=(
                overall_confidence
            ),
            confidence_label=None,
            words=words,
            paragraphs=[],
            headings=[],
            lists=[],
            tables=[],
            math_expressions=[],
            detected_language=(
                self.languages[0]
                if self.languages
                else None
            ),
            processing_time=0.0,
        )