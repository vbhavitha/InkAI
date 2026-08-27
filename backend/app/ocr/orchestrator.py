import time
from typing import List

import cv2
import numpy as np

from app.ocr.easyocr_engine import EasyOCREngine
from app.ocr.trocr_engine import TrOCREngine
from app.ocr.result_merger import OCRResultMerger
from app.schemas.ocr_schema import (
    OCRResult,
    OCRWord,
)
from app.ocr.confidence_calculator import (
    OCRConfidenceCalculator
)


class OCROrchestrator:
    """
    Coordinates multiple OCR engines for InkAI.

    Strategy:

        Processed Image
              ↓
        EasyOCR detects text regions
              ↓
        Check EasyOCR confidence
              ↓
        High confidence → Keep EasyOCR result
        Low confidence  → Run TrOCR
              ↓
        Choose the best available result
              ↓
        Return a standard OCRResult
    """

    # EasyOCR results below this confidence are considered
    # uncertain and will be sent to TrOCR.
    CONFIDENCE_THRESHOLD = 0.70

    def __init__(self):
        """
        Initialize OCR engines.

        EasyOCR is always initialized because it provides
        text detection and bounding boxes.

        TrOCR is initialized for handwritten recognition.
        """

        self.easyocr_engine = EasyOCREngine(
            languages=["en"],
            gpu=False
        )

        self.trocr_engine = TrOCREngine()

        self.result_merger = OCRResultMerger()

    # =====================================================
    # CROP TEXT REGION
    # =====================================================

    def _crop_region(
        self,
        image: np.ndarray,
        bounding_box: list
    ) -> np.ndarray:
        """
        Crop a text region using an EasyOCR bounding box.

        EasyOCR returns four points:

            top-left
            top-right
            bottom-right
            bottom-left

        For now, we create a rectangular crop around the
        bounding box.

        Later, this can be upgraded to perspective-aware
        cropping for rotated handwriting.
        """

        points = np.array(
            bounding_box,
            dtype=np.float32
        )

        if points.shape != (4, 2):
            raise ValueError(
                "Invalid OCR bounding box."
            )

        x_coordinates = points[:, 0]
        y_coordinates = points[:, 1]

        x_min = max(
            0,
            int(np.floor(x_coordinates.min()))
        )

        y_min = max(
            0,
            int(np.floor(y_coordinates.min()))
        )

        x_max = min(
            image.shape[1],
            int(np.ceil(x_coordinates.max()))
        )

        y_max = min(
            image.shape[0],
            int(np.ceil(y_coordinates.max()))
        )

        if x_max <= x_min or y_max <= y_min:
            raise ValueError(
                "Invalid text region dimensions."
            )

        region = image[
            y_min:y_max,
            x_min:x_max
        ]

        if region is None or region.size == 0:
            raise ValueError(
                "Detected text region is empty."
            )

        return region


    # =====================================================
    # PROCESS IMAGE
    # =====================================================

    def process_image(
        self,
        image_path: str
    ) -> OCRResult:
        """
        Run the hybrid InkAI OCR pipeline.
        """

        start_time = time.time()

        # -------------------------------------------------
        # LOAD IMAGE
        # -------------------------------------------------

        image = cv2.imread(
            image_path
        )

        if image is None:
            raise ValueError(
                "Unable to load image for OCR."
            )

        # -------------------------------------------------
        # EASYOCR — DETECT AND RECOGNIZE TEXT
        # -------------------------------------------------

        easyocr_result = (
            self.easyocr_engine.read_image(
                image
            )
        )

        # If no text is detected, return the result safely.
        if not easyocr_result.words:

            overall_confidence, confidence_label = (
                OCRConfidenceCalculator.calculate(
                    []
                )
            )

            easyocr_result.overall_confidence = (
                overall_confidence
            )

            easyocr_result.confidence_label = (
                confidence_label
            )

            easyocr_result.processing_time = (
                round(
                    time.time() - start_time,
                    3
                )
            )
            
            return easyocr_result

        final_words: List[OCRWord] = []

        # -------------------------------------------------
        # PROCESS EACH OCR REGION
        # -------------------------------------------------

        for easyocr_word in easyocr_result.words:

            # ---------------------------------------------
            # HIGH-CONFIDENCE RESULT
            # ---------------------------------------------

            if not self.result_merger.should_use_trocr(
                easyocr_word
            ):

                final_words.append(
                    easyocr_word
                )

                continue

            # ---------------------------------------------
            # LOW-CONFIDENCE RESULT → TrOCR
            # ---------------------------------------------

            try:

                region = self._crop_region(
                    image=image,
                    bounding_box=easyocr_word.bounding_box
                )

                trocr_text = (
                    self.trocr_engine.recognize_region(
                        region
                    )
                )

                final_word = self.result_merger.merge_word(
                    easyocr_word=easyocr_word,
                    trocr_text=trocr_text
                )

                final_words.append(
                    final_word
                )

            except Exception:
                # OCR should remain resilient.
                # If TrOCR fails for one region, preserve
                # the EasyOCR result instead of failing the
                # complete page.
                final_words.append(
                    easyocr_word
                )

        # -------------------------------------------------
        # BUILD FINAL TEXT
        # -------------------------------------------------

        full_text = " ".join(
            word.text
            for word in final_words
            if word.text
        )

        # -------------------------------------------------
        # CALCULATE OVERALL CONFIDENCE
        # -------------------------------------------------

        overall_confidence, confidence_label = (
            OCRConfidenceCalculator.calculate(
                final_words
            )
        )

        # -------------------------------------------------
        # RETURN STANDARD RESULT
        # -------------------------------------------------

        return OCRResult(
            full_text=full_text,
            overall_confidence=overall_confidence,
            confidence_label=confidence_label,
            words=final_words,
            paragraphs=[],
            detected_language=(
                easyocr_result.detected_language
            ),
            processing_time=round(
                time.time() - start_time,
                3
            )
            
        )