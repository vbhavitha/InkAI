import json

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)

from sqlalchemy.orm import Session

from app.database.database import get_db

from app.models.document import Document

from app.schemas.document_schema import (
    DocumentCreate,
    DocumentUpdate,
    DocumentResponse,
)

from app.models.document_version import DocumentVersion

from app.schemas.document_version_schema import (
    DocumentVersionResponse,
)


router = APIRouter(
    prefix="/api/documents",
    tags=["Documents"],
)


# ============================================================
# TEMPORARY USER
# ============================================================

# TODO:
# Replace this with the authenticated user's ID
# when the authentication dependency is connected.

TEMP_USER_ID = 1


# ============================================================
# CREATE DOCUMENT
# ============================================================

@router.post(
    "",
    response_model=DocumentResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_document(
    document_data: DocumentCreate,
    db: Session = Depends(get_db),
):
    document = Document(
        user_id=TEMP_USER_ID,

        title=document_data.title,

        content=json.dumps(
            document_data.content
        ),

        source_file_id=document_data.source_file_id,

        word_count=document_data.word_count,

        character_count=document_data.character_count,
    )

    db.add(document)

    db.flush()

    # ========================================================
    # CREATE VERSION 1
    # ========================================================

    version = DocumentVersion(
        document_id=document.id,

        version_number=1,

        title=document.title,

        content=document.content,

        word_count=document.word_count,

        character_count=document.character_count,
    )

    db.add(version)

    db.commit()

    db.refresh(document)

    return convert_document(document)


# ============================================================
# GET DOCUMENT
# ============================================================

@router.get(
    "/{document_id}/versions",
    response_model=list[DocumentVersionResponse],
)
def get_document_versions(
    document_id: int,
    db: Session = Depends(get_db),
):
    document = (
        db.query(Document)
        .filter(
            Document.id == document_id,
            Document.user_id == TEMP_USER_ID,
        )
        .first()
    )

    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )

    versions = (
        db.query(DocumentVersion)
        .filter(
            DocumentVersion.document_id
            == document_id
        )
        .order_by(
            DocumentVersion.version_number.desc()
        )
        .all()
    )

    return [
        {
            "id": version.id,

            "document_id": version.document_id,

            "version_number":
                version.version_number,

            "title": version.title,

            "content": json.loads(
                version.content
            ),

            "word_count":
                version.word_count,

            "character_count":
                version.character_count,

            "created_at":
                version.created_at,
        }
        for version in versions
    ]


# ============================================================
# UPDATE DOCUMENT
# ============================================================

@router.put(
    "/{document_id}",
    response_model=DocumentResponse,
)
def update_document(
    document_id: int,
    document_data: DocumentUpdate,
    db: Session = Depends(get_db),
):
    document = (
        db.query(Document)
        .filter(
            Document.id == document_id,
            Document.user_id == TEMP_USER_ID,
        )
        .first()
    )

    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )

    update_data = document_data.model_dump(
        exclude_unset=True
    )

    if "title" in update_data:
        document.title = update_data["title"]

    if "content" in update_data:
        document.content = json.dumps(
            update_data["content"]
        )

    if "source_file_id" in update_data:
        document.source_file_id = (
            update_data["source_file_id"]
        )

    if "word_count" in update_data:
        document.word_count = (
            update_data["word_count"]
        )

    if "character_count" in update_data:
        document.character_count = (
            update_data["character_count"]
        )

    # ========================================================
    # CREATE NEW VERSION
    # ========================================================

    latest_version = (
        db.query(DocumentVersion)
        .filter(
            DocumentVersion.document_id
            == document.id
        )
        .order_by(
            DocumentVersion.version_number.desc()
        )
        .first()
    )

    next_version_number = (
        latest_version.version_number + 1
        if latest_version
        else 1
    )

    version = DocumentVersion(
        document_id=document.id,

        version_number=next_version_number,

        title=document.title,

        content=document.content,

        word_count=document.word_count,

        character_count=document.character_count,
    )

    db.add(version)

    db.commit()

    db.refresh(document)

    return convert_document(document)


# ============================================================
# DELETE DOCUMENT
# ============================================================

@router.delete(
    "/{document_id}",
)
def delete_document(
    document_id: int,
    db: Session = Depends(get_db),
):
    document = (
        db.query(Document)
        .filter(
            Document.id == document_id,
            Document.user_id == TEMP_USER_ID,
        )
        .first()
    )

    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )

    db.delete(document)

    db.commit()

    return {
        "message": "Document deleted successfully",
        "document_id": document_id,
    }

@router.post(
    "/{document_id}/versions/{version_id}/restore",
)
def restore_document_version(
    document_id: int,
    version_id: int,
    db: Session = Depends(get_db),
):
    # ========================================================
    # FIND DOCUMENT
    # ========================================================

    document = (
        db.query(Document)
        .filter(
            Document.id == document_id,
            Document.user_id == TEMP_USER_ID,
        )
        .first()
    )

    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )

    # ========================================================
    # FIND VERSION
    # ========================================================

    version = (
        db.query(DocumentVersion)
        .filter(
            DocumentVersion.id == version_id,

            DocumentVersion.document_id
            == document_id,
        )
        .first()
    )

    if not version:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document version not found",
        )

    # ========================================================
    # RESTORE CONTENT
    # ========================================================

    document.title = version.title

    document.content = version.content

    document.word_count = version.word_count

    document.character_count = (
        version.character_count
    )

    # ========================================================
    # CREATE NEW VERSION
    #
    # Restoring does NOT destroy history.
    # Instead, it creates a new version.
    # ========================================================

    latest_version = (
        db.query(DocumentVersion)
        .filter(
            DocumentVersion.document_id
            == document_id
        )
        .order_by(
            DocumentVersion.version_number.desc()
        )
        .first()
    )

    next_version_number = (
        latest_version.version_number + 1
        if latest_version
        else 1
    )

    restored_version = DocumentVersion(
        document_id=document.id,

        version_number=next_version_number,

        title=document.title,

        content=document.content,

        word_count=document.word_count,

        character_count=document.character_count,
    )

    db.add(restored_version)

    db.commit()

    db.refresh(document)

    return {
        "message":
            "Document version restored successfully",

        "document_id":
            document.id,

        "restored_version":
            version.version_number,

        "new_version":
            next_version_number,

        "document":
            convert_document(document),
    }


# ============================================================
# DATABASE MODEL → RESPONSE
# ============================================================

def convert_document(document: Document):
    return {
        "id": document.id,

        "user_id": document.user_id,

        "title": document.title,

        "content": json.loads(
            document.content
        ),

        "source_file_id": document.source_file_id,

        "word_count": document.word_count,

        "character_count": document.character_count,

        "created_at": document.created_at,

        "updated_at": document.updated_at,
    }