from datetime import datetime

from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
)

from sqlalchemy.orm import relationship

from app.database.database import Base


class Document(Base):
    __tablename__ = "documents"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    )

    title = Column(
        String(255),
        nullable=False,
        default="Untitled Document",
    )

    content = Column(
        Text,
        nullable=False,
    )

    source_file_id = Column(
        Integer,
        nullable=True,
        index=True,
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

    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    user = relationship(
        "User",
        back_populates="documents",
    )

    versions = relationship(
        "DocumentVersion",
        back_populates="document",
        cascade="all, delete-orphan",
        order_by="DocumentVersion.version_number",
    )