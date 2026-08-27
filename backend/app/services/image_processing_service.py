import os
import time
from typing import Optional

import cv2

from fastapi import HTTPException

from app.core.exceptions import (
    CorruptedImageError,
    ImageTooLargeError,
    InvalidImageError
)

from app.database.database import SessionLocal

from app.models.image_processing import (
    ImageProcessing
)

from app.processing.pipeline import (
    ImageProcessingPipeline
)

from app.schemas.processing_schema import (
    ProcessingOptions
)

from app.processing.ocr_readiness import (
    OCRReadinessAnalyzer
)


# =========================================================
# DIRECTORIES
# =========================================================

BASE_DIR = os.path.dirname(
    os.path.dirname(
        os.path.dirname(__file__)
    )
)


# =========================================================
# UPLOAD DIRECTORIES
# =========================================================

UPLOADS_FOLDER = os.path.join(
    BASE_DIR,
    "uploads"
)

ORIGINAL_FOLDER = os.path.join(
    UPLOADS_FOLDER,
    "original"
)

PROCESSED_FOLDER = os.path.join(
    UPLOADS_FOLDER,
    "processed"
)

THUMBNAILS_FOLDER = os.path.join(
    UPLOADS_FOLDER,
    "thumbnails"
)


# =========================================================
# PRESETS
# =========================================================

PROCESSING_PRESETS = {

    "auto": {
        "auto_brightness": True,
        "auto_contrast": True,
        "perspective": True,
        "deskew": True,
        "denoise": True,
        "shadow_removal": True,
        "background_cleaning": True,
        "sharpen": True,
        "threshold": True
    },

    "clean_scan": {
        "auto_brightness": False,
        "auto_contrast": True,
        "perspective": False,
        "deskew": False,
        "denoise": True,
        "shadow_removal": False,
        "background_cleaning": False,
        "sharpen": True,
        "threshold": True
    },

    "notebook_photo": {
        "auto_brightness": True,
        "auto_contrast": True,
        "perspective": True,
        "deskew": True,
        "denoise": False,
        "shadow_removal": True,
        "background_cleaning": True,
        "sharpen": False,
        "threshold": False
    },

    "faint_handwriting": {
        "auto_brightness": False,
        "auto_contrast": True,
        "perspective": False,
        "deskew": False,
        "denoise": False,
        "shadow_removal": True,
        "background_cleaning": False,
        "sharpen": True,
        "threshold": True
    }
}


# =========================================================
# FIND UPLOADED FILE
# =========================================================

def find_uploaded_file(file_id: str):
    """
    Find an uploaded file using its file ID prefix.
    """

    if not os.path.exists(ORIGINAL_FOLDER):
        raise HTTPException(
            status_code=404,
            detail="Original upload folder not found."
        )

    for filename in os.listdir(ORIGINAL_FOLDER):

        if filename.startswith(f"{file_id}_"):

            file_path = os.path.join(
                ORIGINAL_FOLDER,
                filename
            )

            if os.path.isfile(file_path):
                return file_path

    raise HTTPException(
        status_code=404,
        detail="Uploaded file not found."
    )


# =========================================================
# PRESET HELPER
# =========================================================

def get_preset_options(
    preset: Optional[str]
):
    """
    Return processing settings for a preset.
    """

    if not preset:
        return None

    preset = preset.lower().strip()

    if preset not in PROCESSING_PRESETS:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Unknown processing preset: {preset}. "
                f"Available presets: "
                f"{', '.join(PROCESSING_PRESETS.keys())}"
            )
        )

    return PROCESSING_PRESETS[
        preset
    ].copy()


# =========================================================
# BUILD PROCESSING OPTIONS
# =========================================================

def build_processing_options(
    options: ProcessingOptions,
    preset: Optional[str] = None
):
    """
    Build final processing settings.

    A preset provides the base configuration.
    Explicit user options override preset values.
    """

    preset_options = get_preset_options(
        preset
    ) or {}

    # Pydantic v2
    if hasattr(options, "model_dump"):
        user_options = options.model_dump(
            exclude_unset=True
        )

    # Pydantic v1
    elif hasattr(options, "dict"):
        user_options = options.dict(
            exclude_unset=True
        )

    elif isinstance(options, dict):
        user_options = options.copy()

    else:
        user_options = {}

    return {
        **preset_options,
        **user_options
    }


# =========================================================
# CREATE THUMBNAIL
# =========================================================

def create_thumbnail(
    image_path: str,
    thumbnail_path: str,
    max_size: int = 400
):
    """
    Create a thumbnail without modifying the source image.
    """

    image = cv2.imread(image_path)

    if image is None:
        raise ValueError(
            "Unable to load image for thumbnail creation."
        )

    height, width = image.shape[:2]

    if width <= 0 or height <= 0:
        raise ValueError(
            "Invalid image dimensions."
        )

    scale = min(
        max_size / width,
        max_size / height
    )

    if scale >= 1:
        thumbnail = image
    else:
        new_width = max(
            1,
            int(width * scale)
        )

        new_height = max(
            1,
            int(height * scale)
        )

        thumbnail = cv2.resize(
            image,
            (
                new_width,
                new_height
            ),
            interpolation=cv2.INTER_AREA
        )

    success = cv2.imwrite(
        thumbnail_path,
        thumbnail
    )

    if not success:
        raise ValueError(
            "Unable to save thumbnail."
        )

    return thumbnail_path


# =========================================================
# CREATE PROCESSING METADATA
# =========================================================

def create_processing_record(
    file_id: str,
    final_options: dict,
    preset: Optional[str],
    db
):
    """
    Create a database record for an image-processing
    operation.
    """

    processing_record = ImageProcessing(
        file_id=file_id,

        preset=preset,

        brightness_enabled=bool(
            final_options.get(
                "auto_brightness",
                False
            )
        ),

        contrast_enabled=bool(
            final_options.get(
                "auto_contrast",
                False
            )
        ),

        perspective_enabled=bool(
            final_options.get(
                "perspective",
                False
            )
        ),

        deskew_enabled=bool(
            final_options.get(
                "deskew",
                False
            )
        ),

        denoise_enabled=bool(
            final_options.get(
                "denoise",
                False
            )
        ),

        shadow_removal_enabled=bool(
            final_options.get(
                "shadow_removal",
                False
            )
        ),

        background_cleaning_enabled=bool(
            final_options.get(
                "background_cleaning",
                False
            )
        ),

        sharpen_enabled=bool(
            final_options.get(
                "sharpen",
                False
            )
        ),

        threshold_enabled=bool(
            final_options.get(
                "threshold",
                False
            )
        ),

        processing_status="processing"
    )

    db.add(processing_record)
    db.commit()
    db.refresh(processing_record)

    return processing_record


# =========================================================
# MARK PROCESSING AS FAILED
# =========================================================

def mark_processing_failed(
    processing_record,
    start_time,
    db
):
    """
    Update processing metadata when processing fails.
    """

    if processing_record is None:
        return

    try:
        processing_record.processing_status = "failed"

        processing_record.processing_time = (
            time.perf_counter()
            - start_time
        )

        db.commit()

    except Exception:
        db.rollback()


# =========================================================
# PROCESS UPLOADED FILE
# =========================================================

def process_uploaded_file(
    file_id: str,
    options: ProcessingOptions,
    preset: Optional[str] = None
):
    """
    Coordinate the complete INK AI image-processing flow.

    The original image is never overwritten.
    """

    db = None
    processing_record = None
    start_time = time.perf_counter()

    try:

        # =================================================
        # FIND ORIGINAL FILE
        # =================================================

        original_path = find_uploaded_file(
            file_id
        )

        original_filename = os.path.basename(
            original_path
        )

        # =================================================
        # OCR READINESS ANALYSIS
        # =================================================

        original_image = cv2.imread(
            original_path
        )

        if original_image is None:
            raise InvalidImageError(
                "Unable to analyze the uploaded image."
            )

        readiness_analyzer = OCRReadinessAnalyzer()

        ocr_readiness = readiness_analyzer.analyze(
            original_image
        )

        # =================================================
        # CREATE DIRECTORIES
        # =================================================

        os.makedirs(
            PROCESSED_FOLDER,
            exist_ok=True
        )

        os.makedirs(
            THUMBNAILS_FOLDER,
            exist_ok=True
        )

        # =================================================
        # CREATE FILE NAMES
        # =================================================

        original_name, original_extension = (
            os.path.splitext(original_filename)
        )

        processed_filename = (
            f"{original_name}_processed"
            f"{original_extension}"
        )

        thumbnail_filename = (
            f"{original_name}_thumb"
            f"{original_extension}"
        )

        processed_path = os.path.join(
            PROCESSED_FOLDER,
            processed_filename
        )

        thumbnail_path = os.path.join(
            THUMBNAILS_FOLDER,
            thumbnail_filename
        )

        # =================================================
        # BUILD OPTIONS
        # =================================================

        final_options = build_processing_options(
            options,
            preset
        )

        # =================================================
        # CREATE DATABASE METADATA
        # =================================================

        db = SessionLocal()

        processing_record = create_processing_record(
            file_id=file_id,
            final_options=final_options,
            preset=preset,
            db=db
        )

        # =================================================
        # CREATE PIPELINE
        # =================================================

        pipeline = ImageProcessingPipeline(
            options=final_options
        )

        # =================================================
        # PROCESS IMAGE
        # =================================================

        pipeline.process_image(
            input_path=original_path,
            output_path=processed_path
        )

        # =================================================
        # VERIFY PROCESSED IMAGE
        # =================================================

        if not os.path.exists(processed_path):
            raise RuntimeError(
                "Processed image was not created."
            )

        # =================================================
        # CREATE THUMBNAIL
        # =================================================

        create_thumbnail(
            processed_path,
            thumbnail_path
        )

        # =================================================
        # STEP 17 — LINE DETECTION
        # =================================================

        detected_lines = []

        try:

            processed_image = pipeline.load_image(
                processed_path
            )

            detected_lines = (
                pipeline.detect_text_lines(
                    processed_image
                )
            )

        except Exception:
            # Line detection is optional for now.
            # A failure here should not fail processing.
            detected_lines = []

        # =================================================
        # MARK PROCESSING AS COMPLETED
        # =================================================

        processing_record.processing_status = (
            "completed"
        )

        processing_record.processing_time = (
            time.perf_counter()
            - start_time
        )

        db.commit()
        db.refresh(processing_record)

        # =================================================
        # FRONTEND URLS
        # =================================================

        original_url = (
            f"/uploads/original/"
            f"{original_filename}"
        )

        processed_url = (
            f"/uploads/processed/"
            f"{processed_filename}"
        )

        thumbnail_url = (
            f"/uploads/thumbnails/"
            f"{thumbnail_filename}"
        )

        # =================================================
        # SUCCESS RESPONSE
        # =================================================

        return {
            "success": True,

            "file_id": file_id,

            "preset": preset,

            "ocr_readiness": ocr_readiness,

            "original": {
                "filename": original_filename,
                "path": original_url
            },

            "processed": {
                "filename": processed_filename,
                "path": processed_url
            },

            "thumbnail": {
                "filename": thumbnail_filename,
                "path": thumbnail_url
            },

            "processing": {
                "status": "completed",

                "steps": {
                    "load_image": "completed",
                    "validate_image": "completed",

                    "auto_brightness": (
                        "completed"
                        if final_options.get(
                            "auto_brightness",
                            False
                        )
                        else "skipped"
                    ),

                    "auto_contrast": (
                        "completed"
                        if final_options.get(
                            "auto_contrast",
                            False
                        )
                        else "skipped"
                    ),

                    "perspective": (
                        "completed"
                        if final_options.get(
                            "perspective",
                            False
                        )
                        else "skipped"
                    ),

                    "deskew": (
                        "completed"
                        if final_options.get(
                            "deskew",
                            False
                        )
                        else "skipped"
                    ),

                    "denoise": (
                        "completed"
                        if final_options.get(
                            "denoise",
                            False
                        )
                        else "skipped"
                    ),

                    "shadow_removal": (
                        "completed"
                        if final_options.get(
                            "shadow_removal",
                            False
                        )
                        else "skipped"
                    ),

                    "background_cleaning": (
                        "completed"
                        if final_options.get(
                            "background_cleaning",
                            False
                        )
                        else "skipped"
                    ),

                    "sharpen": (
                        "completed"
                        if final_options.get(
                            "sharpen",
                            False
                        )
                        else "skipped"
                    ),

                    "threshold": (
                        "completed"
                        if final_options.get(
                            "threshold",
                            False
                        )
                        else "skipped"
                    ),

                    "line_detection": "completed",
                    "thumbnail": "completed"
                }
            },

            "settings": final_options,

            "line_detection": {
                "count": len(detected_lines),
                "regions": detected_lines
            },

            "message": (
                "Image processing completed successfully."
            )
        }

    # =====================================================
    # STEP 25 — SPECIFIC IMAGE ERRORS
    # =====================================================

    except CorruptedImageError as exc:

        if db is not None:
            mark_processing_failed(
                processing_record,
                start_time,
                db
            )

        raise HTTPException(
            status_code=400,
            detail="This image appears to be corrupted."
        ) from exc

    except ImageTooLargeError as exc:

        if db is not None:
            mark_processing_failed(
                processing_record,
                start_time,
                db
            )

        raise HTTPException(
            status_code=413,
            detail="Image resolution is too large."
        ) from exc

    except InvalidImageError as exc:

        if db is not None:
            mark_processing_failed(
                processing_record,
                start_time,
                db
            )

        raise HTTPException(
            status_code=400,
            detail="Unable to process image."
        ) from exc

    except HTTPException:
        # Preserve intentional HTTP errors such as
        # "Uploaded file not found".
        raise

    except Exception as exc:

        if db is not None:
            mark_processing_failed(
                processing_record,
                start_time,
                db
            )

        raise HTTPException(
            status_code=500,
            detail=(
                "We couldn't enhance this page. "
                "Try the original image or another "
                "processing preset."
            )
        ) from exc

    finally:

        # Always close the database connection.
        if db is not None:
            db.close()