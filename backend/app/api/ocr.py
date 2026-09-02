from fastapi import APIRouter, Query, Depends, HTTPException

from app.schemas.ocr_schema import OCRResult
from app.services.ocr_service import process_ocr
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.ocr_result import OCRResultModel
from app.schemas.ocr_result_schema import (
    OCRResultCreate,
    OCRResultResponse
)


router = APIRouter(
    prefix="/api/ocr",
    tags=["OCR"]
)


@router.post(
    "/process/{file_id}",
    response_model=OCRResult
)
def process_handwriting(
    file_id: str,
    language: str = Query(
        default="en",
        description="OCR language code"
    )
):
    """
    Run OCR on a processed InkAI image.

    Example:

        POST /api/ocr/process/{file_id}?language=en
    """

    return process_ocr(
        file_id=file_id,
        language=language
    )

@router.post(
    "/results",
    response_model=OCRResultResponse
)
def save_ocr_result(
    data: OCRResultCreate,
    db: Session = Depends(get_db)
):
    """
    Save an OCR result only when the user explicitly
    chooses to save it.
    """

    # TODO:
    # Replace this with the authenticated user's ID
    # once your authentication dependency is connected.
    user_id = 1

    result = OCRResultModel(
        user_id=user_id,
        file_id=data.file_id,
        full_text=data.full_text,
        overall_confidence=data.overall_confidence,
        language=data.language,
        engine_used=data.engine_used,
        processing_time=data.processing_time,
    )

    db.add(result)
    db.commit()
    db.refresh(result)

    return result