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

from app.ocr.word_highlighter import OCRWordHighlighter

from app.ocr.paragraph_detector import (
    OCRParagraphDetector
)

from app.ocr.heading_detector import (
    OCRHeadingDetector
)

from app.ocr.list_detector import (
    OCRListDetector
)

from app.ocr.table_detector import (
    OCRTableDetector
)

from app.ocr.math_detector import (
    OCRMathDetector
)

from app.ocr.language_config import (
    get_language_config
)

from app.ocr.document_builder import (
    OCRDocumentBuilder
)

class OCROrchestrator:
    """
    Coordinates multiple OCR engines and document-structure
    detectors for InkAI.

    Pipeline:

        Processed Image
              ↓
        EasyOCR detects text regions
              ↓
        Check EasyOCR confidence
              ↓
        High confidence → Keep EasyOCR
        Low confidence  → Run TrOCR
              ↓
        Result Merger
              ↓
        Word Highlighting
              ↓
        Paragraph Detection
              ↓
        Heading Detection
              ↓
        List Detection
              ↓
        Table Detection
              ↓
        Math Region Detection
              ↓
        Final OCRResult
    """

    def __init__(self, language: str = "en"):
        
        """
        Initialize OCR engines and document structure
        detectors.
        """

        language_config = get_language_config(
            language
        )

        self.language = language

        self.easyocr_engine = EasyOCREngine(
            languages=language_config[
                "easyocr_languages"
            ],
            gpu=False
        )

        self.trocr_engine = TrOCREngine()

        self.result_merger = OCRResultMerger()

        # -------------------------------------------------
        # DOCUMENT STRUCTURE DETECTORS
        # -------------------------------------------------

        self.paragraph_detector = (
            OCRParagraphDetector()
        )

        self.heading_detector = (
            OCRHeadingDetector()
        )

        self.list_detector = (
            OCRListDetector()
        )

        self.table_detector = (
            OCRTableDetector()
        )

        self.math_detector = (
            OCRMathDetector()
        )

        self.document_builder = (
            OCRDocumentBuilder()
        )

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

        A rectangular crop is currently used.

        This can later be upgraded to perspective-aware
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
        # EASYOCR
        # -------------------------------------------------

        easyocr_result = (
            self.easyocr_engine.read_image(
                image
            )
        )

        # -------------------------------------------------
        # NO TEXT DETECTED
        # -------------------------------------------------

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

            easyocr_result.processing_time = round(
                time.time() - start_time,
                3
            )

            return easyocr_result

        # -------------------------------------------------
        # FINAL WORDS
        # -------------------------------------------------

        final_words: List[OCRWord] = []

        # -------------------------------------------------
        # PROCESS EACH OCR REGION
        # -------------------------------------------------

        for easyocr_word in easyocr_result.words:

            # ---------------------------------------------
            # HIGH CONFIDENCE
            # ---------------------------------------------

            if not self.result_merger.should_use_trocr(
                easyocr_word
            ):

                final_words.append(
                    easyocr_word
                )

                continue

            # ---------------------------------------------
            # LOW CONFIDENCE → TrOCR
            # ---------------------------------------------

            try:

                region = self._crop_region(
                    image=image,
                    bounding_box=(
                        easyocr_word.bounding_box
                    )
                )

                trocr_text = (
                    self.trocr_engine.recognize_region(
                        region
                    )
                )

                final_word = (
                    self.result_merger.merge_word(
                        easyocr_word=easyocr_word,
                        trocr_text=trocr_text
                    )
                )

                final_words.append(
                    final_word
                )

            except Exception:
                # Keep OCR resilient.
                #
                # If TrOCR fails for one region,
                # preserve the EasyOCR result.

                final_words.append(
                    easyocr_word
                )

        # -------------------------------------------------
        # WORD-LEVEL REVIEW METADATA
        # -------------------------------------------------

        final_words = (
            OCRWordHighlighter.add_highlighting_metadata(
                final_words
            )
        )

        # -------------------------------------------------
        # PARAGRAPH DETECTION
        # -------------------------------------------------

        paragraphs = (
            self.paragraph_detector.detect_paragraphs(
                final_words
            )
        )

        # -------------------------------------------------
        # HEADING DETECTION
        # -------------------------------------------------

        headings = (
            self.heading_detector.detect_headings(
                final_words
            )
        )

        # -------------------------------------------------
        # LIST DETECTION
        # -------------------------------------------------

        lists = (
            self.list_detector.detect_lists(
                final_words
            )
        )

        # -------------------------------------------------
        # TABLE DETECTION
        # -------------------------------------------------

        tables = []

        try:

            detected_tables = (
                self.table_detector.detect_tables(
                    image
                )
            )

            # Table detector currently returns geometry.
            #
            # Cell OCR will be connected in the next
            # table-processing iteration.

            tables = detected_tables

        except Exception:
            # Table detection should never cause the
            # complete OCR request to fail.

            tables = []

        # -------------------------------------------------
        # MATH REGION DETECTION
        # -------------------------------------------------

        math_expressions = []

        try:

            math_regions = (
                self.math_detector.detect_math_regions(
                    final_words
                )
            )

            # The current math detector identifies
            # possible mathematical regions.
            #
            # Actual Math OCR → LaTeX will be connected
            # after the normal handwriting OCR pipeline
            # is stable.

            math_expressions = [
                {
                    "text": region.get("text"),
                    "latex": None,
                    "confidence": region.get(
                        "math_score"
                    ),
                    "bounding_box": region.get(
                        "bounding_box"
                    ),
                }
                for region in math_regions
            ]

        except Exception:
            # Math detection is an optional advanced
            # feature and should not break OCR.

            math_expressions = []

        # -------------------------------------------------
        # BUILD FULL TEXT
        # -------------------------------------------------

        full_text = " ".join(
            word.text
            for word in final_words
            if word.text
        )

        # -------------------------------------------------
        # OVERALL CONFIDENCE
        # -------------------------------------------------

        overall_confidence, confidence_label = (
            OCRConfidenceCalculator.calculate(
                final_words
            )
        )

        document = self.document_builder.build_document(
            words=final_words,
            paragraphs=paragraphs,
            headings=headings,
            lists=lists,
            tables=tables,
            overall_confidence=overall_confidence,
            language=easyocr_result.detected_language,
        )

        # -------------------------------------------------
        # FINAL RESULT
        # -------------------------------------------------

        return OCRResult(
            full_text=full_text,

            overall_confidence=(
                overall_confidence
            ),

            confidence_label=(
                confidence_label
            ),

            words=final_words,

            paragraphs=paragraphs,

            headings=headings,

            lists=lists,

            tables=tables,

            math_expressions=math_expressions,

            document=document,

            detected_language=(
                easyocr_result.detected_language
            ),

            processing_time=round(
                time.time() - start_time,
                3
            )
            
        )