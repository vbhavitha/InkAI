import os
import uuid
import shutil
from typing import List

from fastapi import (
    APIRouter,
    UploadFile,
    File,
    HTTPException
)

from app.services.upload_service import (
    save_upload,
    save_multiple_uploads
)

from app.schemas.upload_schema import UploadResponse

from app.services.pdf_service import extract_pdf_pages


router = APIRouter(
    prefix="/upload",
    tags=["Upload"]
)


# ==========================================
# SINGLE UPLOAD
# ==========================================

@router.post(
    "/",
    response_model=UploadResponse
)
def upload_file(
    file: UploadFile = File(...)
):

    return save_upload(file)


# ==========================================
# MULTIPLE UPLOAD
# ==========================================

@router.post(
    "/multiple",
    response_model=List[UploadResponse]
)
def upload_multiple_files(
    files: List[UploadFile] = File(...)
):

    return save_multiple_uploads(files)


# ==========================================
# DELETE UPLOADED FILE
# ==========================================

@router.delete(
    "/{file_id}"
)
def delete_uploaded_file(
    file_id: str
):

    uploads_folder = os.path.join(

        os.path.dirname(
            os.path.dirname(
                os.path.dirname(__file__)
            )
        ),

        "uploads",
        "original"

    )


    if not os.path.exists(
        uploads_folder
    ):

        raise HTTPException(

            status_code=404,

            detail="Upload folder not found"

        )


    # Find file beginning with the UUID
    matching_file = None


    for filename in os.listdir(
        uploads_folder
    ):

        if filename.startswith(
            file_id + "_"
        ):

            matching_file = filename

            break


    if matching_file is None:

        raise HTTPException(

            status_code=404,

            detail="File not found"

        )


    filepath = os.path.join(

        uploads_folder,

        matching_file

    )


    try:

        os.remove(filepath)

    except OSError:

        raise HTTPException(

            status_code=500,

            detail="Unable to delete file"

        )


    return {

        "success": True,

        "message": "File deleted successfully",

        "id": file_id,

        "filename": matching_file

    }

@router.post("/pdf-pages")
def extract_pdf(
    file: UploadFile = File(...)
):

    if file.content_type != "application/pdf":

        return {
            "error": "File must be a PDF"
        }


    file_id = str(
        uuid.uuid4()
    )


    upload_folder = os.path.join(
        os.path.dirname(
            os.path.dirname(
                os.path.dirname(__file__)
            )
        ),
        "uploads",
        "original"
    )


    os.makedirs(
        upload_folder,
        exist_ok=True
    )


    filename = (
        f"{file_id}_{file.filename}"
    )


    filepath = os.path.join(
        upload_folder,
        filename
    )


    with open(
        filepath,
        "wb"
    ) as buffer:

        shutil.copyfileobj(
            file.file,
            buffer
        )


    pages = extract_pdf_pages(
        filepath,
        file_id
    )


    return {

        "id": file_id,

        "filename": filename,

        "pages": pages

    }