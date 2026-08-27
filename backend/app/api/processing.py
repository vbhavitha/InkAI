from typing import Optional

from fastapi import APIRouter

from app.schemas.processing_schema import (
    ProcessingOptions,
    ProcessingResponse
)

from app.services.image_processing_service import (
    process_uploaded_file
)


# =========================================================
# ROUTER
# =========================================================

router = APIRouter(
    prefix="/api",
    tags=["Processing"]
)


# =========================================================
# PROCESS IMAGE
# =========================================================

@router.post(
    "/process/{file_id}",
    response_model=ProcessingResponse
)
def process_file(
    file_id: str,
    options: ProcessingOptions,
    preset: Optional[str] = None
):
    """
    Process an uploaded image.

    Example:

        POST /api/process/<file_id>?preset=auto

    The request body contains individual processing options.
    """

    return process_uploaded_file(
        file_id=file_id,
        options=options,
        preset=preset
    )