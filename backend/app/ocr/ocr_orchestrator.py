import cv2
import numpy as np

from app.ocr.easyocr_engine import EasyOCREngine
from app.ocr.trocr_engine import TrOCREngine
from app.schemas.ocr_schema import (
    OCRResult,
    OCRWord,
)


class OCROrchestrator:
    """
    Coordinates OCR engines for InkAI.

    Workflow:

        Image
          ↓
        EasyOCR detects text regions
          ↓
        Crop each region
          ↓
        TrOCR recognizes handwriting
          ↓
        Return a common OCRResult
    """

    def __init__(self):
        """
        Initialize OCR engines.
        """

        self.easyocr_engine = EasyOCREngine(
            languages=["en"],
            gpu=False
        )

        self.trocr_engine = TrOCREngine()

    # =====================================================
    # CROP TEXT REGION
    # =====================================================

    def _crop_region(
        self,
        image: np.ndarray,
        bounding_box: list
    ) -> np.ndarray:
        """
        Crop a rectangular region from an image using
        an OCR bounding box.

        EasyOCR bounding boxes contain four points.
        For the initial implementation, we use the minimum
        and maximum coordinates to create a rectangular crop.
        """

        points = np.array(
            bounding_box,
            dtype=np.float32
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
                "Invalid text region detected."
            )

        return image[
            y_min:y_max,
            x_min:x_max
        ]

    # =====================================================
    # PROCESS IMAGE
    # =====================================================

    def process_image(
        self,
        image_path: str
    ) -> OCRResult:
        """
        Run hybrid OCR on an image.

        EasyOCR provides text locations.

        TrOCR recognizes handwriting inside each
        detected region.
        """

        # ---------------------------------------------
        # Load image
        # ---------------------------------------------

        image = cv2.imread(
            image_path
        )

        if image is None:
            raise ValueError(
                "Unable to load the processed image for OCR."
            )

        # ---------------------------------------------
        # Detect text regions using EasyOCR
        # ---------------------------------------------

        easyocr_result = (
            self.easyocr_engine.read_image(
                image
            )
        )

        # If no regions are detected, return the EasyOCR
        # result rather than failing the entire request.
        if not easyocr_result.words:
            return easyocr_result

        trocr_words = []

        # ---------------------------------------------
        # Recognize each region using TrOCR
        # ---------------------------------------------

        for easyocr_word in easyocr_result.words:

            try:
                region = self._crop_region(
                    image=image,
                    bounding_box=easyocr_word.bounding_box
                )

                recognized_text = (
                    self.trocr_engine.recognize_region(
                        region
                    )
                )

                # Keep EasyOCR's confidence and bounding
                # box because TrOCR's basic generate()
                # workflow does not provide a directly
                # comparable confidence score.
                final_text = (
                    recognized_text
                    if recognized_text
                    else easyocr_word.text
                )

                trocr_words.append(
                    OCRWord(
                        text=final_text,
                        confidence=easyocr_word.confidence,
                        bounding_box=easyocr_word.bounding_box
                    )
                )

            except Exception:
                # If TrOCR fails on one small region,
                # preserve EasyOCR's result for that region.
                trocr_words.append(
                    easyocr_word
                )

        # ---------------------------------------------
        # Build final text
        # ---------------------------------------------

        full_text = " ".join(
            word.text
            for word in trocr_words
        )

        overall_confidence = None

        if trocr_words:
            overall_confidence = sum(
                word.confidence
                for word in trocr_words
            ) / len(trocr_words)

        return OCRResult(
            full_text=full_text,
            overall_confidence=overall_confidence,
            words=trocr_words,
            paragraphs=[],
            detected_language="en",
            processing_time=(
                easyocr_result.processing_time
            )
        )