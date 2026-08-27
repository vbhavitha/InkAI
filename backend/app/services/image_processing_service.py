import os
import cv2
from typing import Optional
import time

from fastapi import HTTPException

from app.database.database import SessionLocal

from app.models.image_processing import (
    ImageProcessing
)

from app.schemas.processing_schema import (
    ProcessingOptions
)

from app.processing.pipeline import (
    ImageProcessingPipeline
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
    Find uploaded file using its file ID prefix.
    """

    if not os.path.exists(
        ORIGINAL_FOLDER
    ):
        raise HTTPException(
            status_code=404,
            detail=(
                "Original upload folder not found."
            )
        )

    for filename in os.listdir(
        ORIGINAL_FOLDER
    ):

        if filename.startswith(
            f"{file_id}_"
        ):

            file_path = os.path.join(
                ORIGINAL_FOLDER,
                filename
            )

            if os.path.isfile(
                file_path
            ):
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
# PROCESSING OPTIONS
# =========================================================

def build_processing_options(
    options: ProcessingOptions,
    preset: Optional[str] = None
):
    """
    Build final processing settings.

    If a preset is supplied, it becomes the base
    configuration. Explicit user options can then
    override the preset.
    """

    preset_options = get_preset_options(
        preset
    )

    if preset_options is None:
        preset_options = {}

    # Pydantic model → dictionary
    if hasattr(
        options,
        "model_dump"
    ):
        user_options = options.model_dump(
            exclude_unset=True
        )

    elif hasattr(
        options,
        "dict"
    ):
        user_options = options.dict(
            exclude_unset=True
        )

    elif isinstance(
        options,
        dict
    ):
        user_options = options.copy()

    else:
        user_options = {}

    # Preset first, user settings second
    final_options = {
        **preset_options,
        **user_options
    }

    return final_options

# =========================================================
# CREATE THUMBNAIL
# =========================================================

def create_thumbnail(
    image_path: str,
    thumbnail_path: str,
    max_size: int = 400
):
    """
    Create a small preview thumbnail from an image.

    The original image is never modified.
    """

    image = cv2.imread(
        image_path
    )

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

    # Don't enlarge small images
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

    db.add(
        processing_record
    )

    db.commit()

    db.refresh(
        processing_record
    )

    return processing_record

# =========================================================
# PROCESS UPLOADED FILE
# =========================================================

def process_uploaded_file(
    file_id: str,
    options: ProcessingOptions,
    preset: Optional[str] = None
):
    """
    Process an uploaded handwritten image.

    The original image is NEVER overwritten.

    Creates:

        original/
            original image

        processed/
            processed image

        thumbnails/
            processed thumbnail
    """

    # =====================================================
    # FIND ORIGINAL FILE
    # =====================================================

    original_path = find_uploaded_file(
        file_id
    )

    original_filename = os.path.basename(
        original_path
    )

    # =====================================================
    # CREATE DIRECTORIES
    # =====================================================

    os.makedirs(
        ORIGINAL_FOLDER,
        exist_ok=True
    )

    os.makedirs(
        PROCESSED_FOLDER,
        exist_ok=True
    )

    os.makedirs(
        THUMBNAILS_FOLDER,
        exist_ok=True
    )

    # =====================================================
    # FILE NAMES
    # =====================================================

    original_name, original_extension = (
        os.path.splitext(
            original_filename
        )
    )

    processed_filename = (
        f"{original_name}_processed"
        f"{original_extension}"
    )

    thumbnail_filename = (
        f"{original_name}_thumb"
        f"{original_extension}"
    )

    # =====================================================
    # FILE PATHS
    # =====================================================

    processed_path = os.path.join(
        PROCESSED_FOLDER,
        processed_filename
    )

    thumbnail_path = os.path.join(
        THUMBNAILS_FOLDER,
        thumbnail_filename
    )

    # =====================================================
    # BUILD PROCESSING OPTIONS
    # =====================================================

    final_options = build_processing_options(
        options,
        preset
    )

    # =====================================================
    # STEP 23 — CREATE PROCESSING METADATA
    # =====================================================

    db = SessionLocal()

    processing_record = None

    start_time = time.perf_counter()

    try:

        processing_record = create_processing_record(
            file_id=file_id,
            final_options=final_options,
            preset=preset,
            db=db
        )

    except Exception as exc:

        db.close()

        raise HTTPException(
            status_code=500,
            detail="Unable to create processing metadata."
        ) from exc

    # =====================================================
    # CREATE PIPELINE
    # =====================================================

    pipeline = ImageProcessingPipeline(
        options=final_options
    )

    # =====================================================
    # PROCESS IMAGE
    # =====================================================

    try:

        pipeline.process_image(
            input_path=original_path,
            output_path=processed_path
        )

    except ValueError as exc:

        processing_record.processing_status = "failed"

        processing_record.processing_time = (
            time.perf_counter()
            - start_time
        )

        db.commit()

        db.close()

        raise HTTPException(
            status_code=400,
            detail=str(exc)
        ) from exc


    except Exception as exc:

        processing_record.processing_status = "failed"

        processing_record.processing_time = (
            time.perf_counter()
            - start_time
        )

        db.commit()

        db.close()

        raise HTTPException(
            status_code=500,
            detail=(
                "Image processing failed."
            )
        ) from exc

    # =====================================================
    # VERIFY PROCESSED IMAGE
    # =====================================================

    if not os.path.exists(
        processed_path
    ):
        raise HTTPException(
            status_code=500,
            detail=(
                "Processed image was not created."
            )
        )

    # =====================================================
    # CREATE THUMBNAIL
    # =====================================================

    try:

        create_thumbnail(
            processed_path,
            thumbnail_path
        )

    except ValueError as exc:

        raise HTTPException(
            status_code=500,
            detail=str(exc)
        ) from exc

    # =====================================================
    # STEP 17 — LINE DETECTION
    # =====================================================

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
        detected_lines = []


    # =====================================================
    # STEP 23 — COMPLETE PROCESSING METADATA
    # =====================================================

    processing_record.processing_status = "completed"

    processing_record.processing_time = (
        time.perf_counter()
        - start_time
    )

    db.commit()

    db.refresh(
        processing_record
    )

    db.close()

    # =====================================================
    # FRONTEND URLS
    # =====================================================

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

    # =====================================================
    # RESPONSE
    # =====================================================

    return {
        "success": True,

        "file_id": file_id,

        "preset": preset,

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
                        True
                    )
                    else "skipped"
                ),

                "auto_contrast": (
                    "completed"
                    if final_options.get(
                        "auto_contrast",
                        True
                    )
                    else "skipped"
                ),

                "perspective": (
                    "completed"
                    if final_options.get(
                        "perspective",
                        True
                    )
                    else "skipped"
                ),

                "deskew": (
                    "completed"
                    if final_options.get(
                        "deskew",
                        True
                    )
                    else "skipped"
                ),

                "denoise": (
                    "completed"
                    if final_options.get(
                        "denoise",
                        True
                    )
                    else "skipped"
                ),

                "shadow_removal": (
                    "completed"
                    if final_options.get(
                        "shadow_removal",
                        True
                    )
                    else "skipped"
                ),

                "background_cleaning": (
                    "completed"
                    if final_options.get(
                        "background_cleaning",
                        True
                    )
                    else "skipped"
                ),

                "sharpen": (
                    "completed"
                    if final_options.get(
                        "sharpen",
                        True
                    )
                    else "skipped"
                ),

                "threshold": (
                    "completed"
                    if final_options.get(
                        "threshold",
                        True
                    )
                    else "skipped"
                ),

                "line_detection": "completed",

                "thumbnail": "completed"
            }
        },

        "settings": final_options,

        "line_detection": {
            "count": len(
                detected_lines
            ),
            "regions": detected_lines
        },

        "message": (
            "Image processing completed successfully."
        )
    }