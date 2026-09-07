from datetime import datetime

from sqlalchemy import (
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
)
from sqlalchemy.orm import relationship

from app.database.database import Base


class HandwritingDocument(Base):
    """
    Stores handwriting-generation settings for a document.

    A Document contains the actual structured document content,
    while HandwritingDocument contains the visual handwriting
    configuration used to render that document.
    """

    __tablename__ = "handwriting_documents"

    # ========================================================
    # PRIMARY KEY
    # ========================================================

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    # ========================================================
    # DOCUMENT / USER REFERENCES
    # ========================================================

    document_id = Column(
        Integer,
        ForeignKey(
            "documents.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    user_id = Column(
        Integer,
        ForeignKey(
            "users.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    # ========================================================
    # HANDWRITING STYLE
    # ========================================================

    style = Column(
        String(100),
        nullable=False,
        default="neat_student",
    )

    font = Column(
        String(255),
        nullable=True,
    )

    # ========================================================
    # VISUAL SETTINGS
    # ========================================================

    ink_color = Column(
        String(50),
        nullable=False,
        default="blue",
    )

    paper_style = Column(
        String(50),
        nullable=False,
        default="ruled",
    )

    font_size = Column(
        Float,
        nullable=False,
        default=22,
    )

    line_spacing = Column(
        Float,
        nullable=False,
        default=1.5,
    )

    letter_spacing = Column(
        Float,
        nullable=False,
        default=0.0,
    )

    # ========================================================
    # NATURAL HANDWRITING VARIATION
    # ========================================================

    naturalness = Column(
        Float,
        nullable=False,
        default=0.5,
    )

    random_seed = Column(
        Integer,
        nullable=False,
        default=12345,
    )

    # ========================================================
    # TIMESTAMPS
    # ========================================================

    created_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
    )

    updated_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )

    # ========================================================
    # RELATIONSHIPS
    # ========================================================

    document = relationship(
        "Document",
        backref="handwriting_documents",
    )

    user = relationship(
        "User",
        backref="handwriting_documents",
    )

    # ========================================================
    # REPRESENTATION
    # ========================================================

    def __repr__(self):
        return (
            "<HandwritingDocument("
            f"id={self.id}, "
            f"document_id={self.document_id}, "
            f"style='{self.style}', "
            f"font='{self.font}', "
            f"ink='{self.ink_color}', "
            f"paper='{self.paper_style}', "
            f"naturalness={self.naturalness}, "
            f"random_seed={self.random_seed}"
            ")>"
        )