import os

from fastapi import HTTPException

from app.ocr.orchestrator import OCROrchestrator
from app.schemas.ocr_schema import OCRResult


# =========================================================
# DIRECTORIES
# =========================================================

BASE_DIR = os.path.dirname(
    os.path.dirname(
        os.path.dirname(__file__)
    )
)


PROCESSED_FOLDER = os.path.join(
    BASE_DIR,
    "uploads",
    "processed"
)


# =========================================================
# FIND PROCESSED FILE
# =========================================================

def find_processed_file(
    file_id: str
) -> str:
    """
    Find the processed image associated with a file ID.

    The original uploaded file begins with:

        {file_id}_...

    The processed file is generated from that original
    filename and is stored in uploads/processed/.
    """

    if not os.path.exists(
        PROCESSED_FOLDER
    ):
        raise HTTPException(
            status_code=404,
            detail="Processed image folder not found."
        )

    for filename in os.listdir(
        PROCESSED_FOLDER
    ):

        if filename.startswith(
            f"{file_id}_"
        ):

            file_path = os.path.join(
                PROCESSED_FOLDER,
                filename
            )

            if os.path.isfile(
                file_path
            ):
                return file_path

    raise HTTPException(
        status_code=404,
        detail=(
            "Processed image not found. "
            "Please process the image before running OCR."
        )
    )


# =========================================================
# OCR SERVICE
# =========================================================

def process_ocr(
    file_id: str
) -> OCRResult:
    """
    Coordinate the InkAI OCR workflow.

    Flow:

        file_id
           ↓
        Locate processed image
           ↓
        OCR Orchestrator
           ↓
        OCR Engine
           ↓
        Standard OCRResult
    """

    # -----------------------------------------------------
    # Locate processed image
    # -----------------------------------------------------

    processed_path = find_processed_file(
        file_id
    )

    # -----------------------------------------------------
    # Run OCR
    # -----------------------------------------------------

    try:

        orchestrator = OCROrchestrator()

        result = orchestrator.process_image(
            image_path=processed_path
        )

        return result

    except HTTPException:
        raise

    except ValueError as exc:

        raise HTTPException(
            status_code=400,
            detail=str(exc)
        ) from exc

    except RuntimeError as exc:

        raise HTTPException(
            status_code=500,
            detail=(
                "OCR processing failed. "
                "Please try again with a clearer image."
            )
        ) from exc

    except Exception as exc:

        raise HTTPException(
            status_code=500,
            detail=(
                "An unexpected error occurred while "
                "recognizing the handwriting."
            )
        ) from exc