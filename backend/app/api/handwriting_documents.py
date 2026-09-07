from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db

from app.models.handwriting_document import (
    HandwritingDocument,
)

from app.schemas.handwriting_schema import (
    HandwritingDocumentCreate,
    HandwritingDocumentResponse,
    HandwritingDocumentUpdate,
)


router = APIRouter(
    prefix="/api/handwriting/documents",
    tags=["Handwriting Documents"],
)


# ============================================================
# CREATE
# ============================================================


@router.post(
    "",
    response_model=HandwritingDocumentResponse,
)
def create_handwriting_document(
    request: HandwritingDocumentCreate,
    db: Session = Depends(get_db),
):
    """
    Create handwriting settings for a document.

    If settings already exist for the same document and user,
    the existing record is returned instead of creating a
    duplicate record.
    """

    # --------------------------------------------------------
    # Verify document exists
    # --------------------------------------------------------

    from app.models.document import Document

    document = (
        db.query(Document)
        .filter(
            Document.id == request.document_id,
            Document.user_id == request.user_id,
        )
        .first()
    )

    if not document:
        raise HTTPException(
            status_code=404,
            detail="Document not found.",
        )

    # --------------------------------------------------------
    # Check existing handwriting settings
    # --------------------------------------------------------

    existing = (
        db.query(HandwritingDocument)
        .filter(
            HandwritingDocument.document_id
            == request.document_id,
            HandwritingDocument.user_id
            == request.user_id,
        )
        .first()
    )

    if existing:
        return existing

    # --------------------------------------------------------
    # Create settings
    # --------------------------------------------------------

    handwriting_document = HandwritingDocument(
        document_id=request.document_id,
        user_id=request.user_id,
        style=request.style,
        font=request.font,
        ink_color=request.ink_color,
        paper_style=request.paper_style,
        font_size=request.font_size,
        line_spacing=request.line_spacing,
        letter_spacing=request.letter_spacing,
        naturalness=request.naturalness,
        random_seed=request.random_seed,
    )

    db.add(handwriting_document)
    db.commit()
    db.refresh(handwriting_document)

    return handwriting_document


# ============================================================
# GET
# ============================================================


@router.get(
    "/{document_id}",
    response_model=HandwritingDocumentResponse,
)
def get_handwriting_document(
    document_id: int,
    user_id: int,
    db: Session = Depends(get_db),
):
    """
    Retrieve handwriting settings for a document.
    """

    handwriting_document = (
        db.query(HandwritingDocument)
        .filter(
            HandwritingDocument.document_id == document_id,
            HandwritingDocument.user_id == user_id,
        )
        .first()
    )

    if not handwriting_document:
        raise HTTPException(
            status_code=404,
            detail=(
                "Handwriting settings "
                "not found for this document."
            ),
        )

    return handwriting_document


# ============================================================
# UPDATE
# ============================================================


@router.put(
    "/{document_id}",
    response_model=HandwritingDocumentResponse,
)
def update_handwriting_document(
    document_id: int,
    request: HandwritingDocumentUpdate,
    user_id: int,
    db: Session = Depends(get_db),
):
    """
    Update handwriting settings for a document.
    """

    handwriting_document = (
        db.query(HandwritingDocument)
        .filter(
            HandwritingDocument.document_id == document_id,
            HandwritingDocument.user_id == user_id,
        )
        .first()
    )

    if not handwriting_document:
        raise HTTPException(
            status_code=404,
            detail=(
                "Handwriting settings "
                "not found for this document."
            ),
        )

    # --------------------------------------------------------
    # Update only supplied fields
    # --------------------------------------------------------

    update_data = request.model_dump(
        exclude_unset=True
    )

    for field_name, value in update_data.items():
        setattr(
            handwriting_document,
            field_name,
            value,
        )

    db.commit()
    db.refresh(handwriting_document)

    return handwriting_document


# ============================================================
# DELETE
# ============================================================


@router.delete(
    "/{document_id}",
)
def delete_handwriting_document(
    document_id: int,
    user_id: int,
    db: Session = Depends(get_db),
):
    """
    Delete handwriting settings for a document.

    This does not delete the original Document.
    """

    handwriting_document = (
        db.query(HandwritingDocument)
        .filter(
            HandwritingDocument.document_id == document_id,
            HandwritingDocument.user_id == user_id,
        )
        .first()
    )

    if not handwriting_document:
        raise HTTPException(
            status_code=404,
            detail=(
                "Handwriting settings "
                "not found for this document."
            ),
        )

    db.delete(
        handwriting_document
    )

    db.commit()

    return {
        "document_id": document_id,
        "status": "deleted",
    }