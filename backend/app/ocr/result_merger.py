from typing import Optional

from app.schemas.ocr_schema import OCRWord


class OCRResultMerger:
    """
    Selects the best OCR result from multiple OCR engines.

    Initial strategy:

        EasyOCR confidence >= threshold
                ↓
            Use EasyOCR

        EasyOCR confidence < threshold
                ↓
            Compare with TrOCR

    TrOCR does not currently provide a directly comparable
    confidence score, so for uncertain EasyOCR results we
    prefer meaningful TrOCR text.

    This class can later be extended with weighted scoring,
    dictionary matching, language checks, and context scoring.
    """

    CONFIDENCE_THRESHOLD = 0.85

    # =====================================================
    # CHECK WHETHER TrOCR IS NEEDED
    # =====================================================

    def should_use_trocr(
        self,
        easyocr_word: OCRWord
    ) -> bool:
        """
        Decide whether an EasyOCR result is uncertain enough
        to require TrOCR.

        EasyOCR confidence is expected to be between 0 and 1.

        Example:

            0.96 → Keep EasyOCR
            0.54 → Try TrOCR
        """

        confidence = easyocr_word.confidence

        if confidence is None:
            return True

        return confidence < self.CONFIDENCE_THRESHOLD

    # =====================================================
    # MERGE RESULTS
    # =====================================================

    def merge_word(
        self,
        easyocr_word: OCRWord,
        trocr_text: Optional[str] = None
    ) -> OCRWord:
        """
        Choose the best result for a text region.

        Strategy:

        1. If EasyOCR confidence is high, keep EasyOCR.
        2. If EasyOCR is uncertain and TrOCR returns
           meaningful text, use TrOCR.
        3. Otherwise, fall back to EasyOCR.

        EasyOCR's bounding box is always preserved because
        TrOCR does not perform text detection.

        EasyOCR's confidence is also retained for now because
        TrOCR's generated output does not provide a directly
        comparable confidence value in this implementation.
        """

        # High-confidence EasyOCR result
        if not self.should_use_trocr(
            easyocr_word
        ):
            return easyocr_word

        # Clean TrOCR output safely
        cleaned_trocr_text = (
            trocr_text.strip()
            if trocr_text
            else ""
        )

        # Uncertain EasyOCR + meaningful TrOCR result
        if cleaned_trocr_text:
            return OCRWord(
                text=cleaned_trocr_text,
                confidence=easyocr_word.confidence,
                bounding_box=easyocr_word.bounding_box
            )

        # Fallback to EasyOCR
        return easyocr_word