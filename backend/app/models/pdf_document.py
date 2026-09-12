from datetime import datetime

from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
)

from app.database.database import Base


class PdfDocument(Base):
    """
    Stores metadata for generated InkAI PDF documents.

    The actual PDF file is stored on disk under:

        backend/storage/pdf/final/

    This table stores the metadata and file location.
    """

    __tablename__ = "pdf_documents"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    user_id = Column(
        Integer,
        nullable=False,
        index=True,
    )

    document_id = Column(
        Integer,
        ForeignKey("documents.id"),
        nullable=False,
        index=True,
    )

    assignment_id = Column(
        Integer,
        ForeignKey("assignments.id"),
        nullable=False,
        index=True,
    )

    filename = Column(
        String(255),
        nullable=False,
    )

    file_path = Column(
        String(1000),
        nullable=False,
    )

    page_size = Column(
        String(50),
        nullable=False,
        default="A4",
    )

    page_count = Column(
        Integer,
        nullable=False,
        default=1,
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )