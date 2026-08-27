import time
from typing import List

import easyocr
import numpy as np

from app.schemas.ocr_schema import (
    OCRResult,
    OCRWord,
)


class EasyOCREngine:
    """
    EasyOCR engine adapter for InkAI.

    This class converts EasyOCR output into InkAI's
    common OCRResult format.
    """

    def __init__(
        self,
        languages: List[str] = None,
        gpu: bool = False
    ):
        """
        Initialize the EasyOCR reader.

        Parameters:
            languages:
                Languages supported by the OCR engine.
                English is used by default.

            gpu:
                Whether to use GPU acceleration.
                False is recommended initially because
                InkAI should work on normal laptops.
        """

        if languages is None:
            languages = ["en"]

        self.languages = languages

        self.reader = easyocr.Reader(
            self.languages,
            gpu=gpu
        )

    # =====================================================
    # READ IMAGE
    # =====================================================

    def read_image(
        self,
        image: np.ndarray
    ) -> OCRResult:
        """
        Extract text from an OpenCV image.

        EasyOCR returns results in the form:

            [
                (
                    bounding_box,
                    text,
                    confidence
                )
            ]

        This method converts those results into InkAI's
        common OCRResult format.
        """

        if image is None:
            raise ValueError(
                "Unable to process image. "
                "The image could not be loaded."
            )

        start_time = time.perf_counter()

        try:
            results = self.reader.readtext(
                image
            )

        except Exception as exc:
            raise RuntimeError(
                "EasyOCR failed to recognize text."
            ) from exc

        words = []

        for bounding_box, text, confidence in results:

            # Convert NumPy values into normal Python floats.
            formatted_box = [
                [
                    float(point[0]),
                    float(point[1])
                ]
                for point in bounding_box
            ]

            words.append(
                OCRWord(
                    text=text,
                    confidence=float(confidence),
                    bounding_box=formatted_box
                )
            )

        # Combine all detected text.
        full_text = " ".join(
            word.text
            for word in words
        )

        # Calculate average confidence.
        overall_confidence = None

        if words:
            overall_confidence = sum(
                word.confidence
                for word in words
            ) / len(words)

        processing_time = (
            time.perf_counter() - start_time
        )

        return OCRResult(
            full_text=full_text,
            overall_confidence=overall_confidence,
            words=words,
            paragraphs=[],
            detected_language=(
                ",".join(self.languages)
            ),
            processing_time=processing_time
        )

    # =====================================================
    # READ IMAGE FROM PATH
    # =====================================================

    def read_image_path(
        self,
        image_path: str
    ) -> OCRResult:
        """
        Extract text directly from an image file path.
        """

        start_time = time.perf_counter()

        try:
            results = self.reader.readtext(
                image_path
            )

        except Exception as exc:
            raise RuntimeError(
                "Unable to process this image with EasyOCR."
            ) from exc

        words = []

        for bounding_box, text, confidence in results:

            formatted_box = [
                [
                    float(point[0]),
                    float(point[1])
                ]
                for point in bounding_box
            ]

            words.append(
                OCRWord(
                    text=text,
                    confidence=float(confidence),
                    bounding_box=formatted_box
                )
            )

        full_text = " ".join(
            word.text
            for word in words
        )

        overall_confidence = None

        if words:
            overall_confidence = sum(
                word.confidence
                for word in words
            ) / len(words)

        processing_time = (
            time.perf_counter() - start_time
        )

        return OCRResult(
            full_text=full_text,
            overall_confidence=overall_confidence,
            words=words,
            paragraphs=[],
            detected_language=(
                ",".join(self.languages)
            ),
            processing_time=processing_time
        )