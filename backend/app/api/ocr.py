from fastapi import APIRouter

from app.schemas.ocr_schema import OCRResult
from app.services.ocr_service import process_ocr


router = APIRouter(
    prefix="/api/ocr",
    tags=["OCR"]
)


@router.post(
    "/process/{file_id}",
    response_model=OCRResult
)
def process_handwriting(
    file_id: str
):
    """
    Run OCR on a processed InkAI image.
    """

    return process_ocr(
        file_id=file_id
    )