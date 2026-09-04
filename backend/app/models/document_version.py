from datetime import datetime

from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Integer,
    Text,
)

from sqlalchemy.orm import relationship

from app.database.database import Base


class DocumentVersion(Base):
    __tablename__ = "document_versions"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    document_id = Column(
        Integer,
        ForeignKey("documents.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    version_number = Column(
        Integer,
        nullable=False,
    )

    content = Column(
        Text,
        nullable=False,
    )

    title = Column(
        Text,
        nullable=False,
    )

    word_count = Column(
        Integer,
        nullable=False,
        default=0,
    )

    character_count = Column(
        Integer,
        nullable=False,
        default=0,
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    document = relationship(
        "Document",
        back_populates="versions",
    )