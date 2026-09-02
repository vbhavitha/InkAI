import uuid

from sqlalchemy import (
    Column,
    String,
    Boolean,
    DateTime,
    Integer,
    BigInteger,
    Text
)

from sqlalchemy.dialects.postgresql import UUID

from sqlalchemy.sql import func

from app.database.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )

    full_name = Column(
        String,
        nullable=False
    )

    email = Column(
        String,
        unique=True,
        nullable=False
    )

    password = Column(
        String,
        nullable=False
    )

    profile_image = Column(
        String,
        nullable=True
    )

    is_verified = Column(
        Boolean,
        default=False
    )

    google_user = Column(
        Boolean,
        default=False
    )

    storage_used = Column(
        BigInteger,
        default=0
    )

    total_documents = Column(
        Integer,
        default=0
    )

    subscription_type = Column(
        String,
        default="Free"
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    updated_at = Column(
        DateTime(timezone=True),
        onupdate=func.now(),
        server_default=func.now()
    )

    reset_token = Column(
        Text,
        nullable=True
    )

    reset_token_expiry = Column(
        DateTime(timezone=True),
        nullable=True
    )

    ocr_results = relationship(
        "OCRResultModel",
        back_populates="user",
        cascade="all, delete-orphan"
    )