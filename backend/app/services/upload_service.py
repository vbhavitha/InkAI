import os
import uuid
import shutil

from app.services.pdf_service import extract_pdf_pages


# ==========================================
# BASE DIRECTORY
# ==========================================

BASE_DIR = os.path.dirname(
    os.path.dirname(
        os.path.dirname(__file__)
    )
)


# ==========================================
# ORIGINAL UPLOAD DIRECTORY
# ==========================================

UPLOAD_FOLDER = os.path.join(
    BASE_DIR,
    "uploads",
    "original"
)


# ==========================================
# SAVE SINGLE FILE
# ==========================================

def save_upload(file):

    # Make sure upload directory exists
    os.makedirs(
        UPLOAD_FOLDER,
        exist_ok=True
    )


    # Generate unique ID
    file_id = str(
        uuid.uuid4()
    )


    # Create unique filename
    unique_name = (
        f"{file_id}_{file.filename}"
    )


    # Complete file path
    filepath = os.path.join(
        UPLOAD_FOLDER,
        unique_name
    )


    # Save file
    with open(
        filepath,
        "wb"
    ) as buffer:

        shutil.copyfileobj(
            file.file,
            buffer
        )


    # Get actual file size
    file_size = os.path.getsize(
        filepath
    )


    # Return upload information
    return {

        "id": file_id,

        "filename": unique_name,

        "size": file_size

    }


# ==========================================
# SAVE MULTIPLE FILES
# ==========================================

def save_multiple_uploads(files):

    uploaded_files = []


    for file in files:

        uploaded_files.append(
            save_upload(file)
        )


    return uploaded_files