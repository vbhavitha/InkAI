from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    Integer,
    String
)

from app.database.database import Base


class ImageProcessing(Base):
    """
    Stores metadata about image-processing operations.
    """

    __tablename__ = "image_processing"

    # =====================================================
    # PRIMARY KEY
    # =====================================================

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    # =====================================================
    # FILE INFORMATION
    # =====================================================

    file_id = Column(
        String,
        nullable=False,
        index=True
    )

    preset = Column(
        String,
        nullable=True
    )

    # =====================================================
    # PROCESSING OPTIONS
    # =====================================================

    brightness_enabled = Column(
        Boolean,
        default=False,
        nullable=False
    )

    contrast_enabled = Column(
        Boolean,
        default=False,
        nullable=False
    )

    deskew_enabled = Column(
        Boolean,
        default=False,
        nullable=False
    )

    perspective_enabled = Column(
        Boolean,
        default=False,
        nullable=False
    )

    denoise_enabled = Column(
        Boolean,
        default=False,
        nullable=False
    )

    shadow_removal_enabled = Column(
        Boolean,
        default=False,
        nullable=False
    )

    background_cleaning_enabled = Column(
        Boolean,
        default=False,
        nullable=False
    )

    sharpen_enabled = Column(
        Boolean,
        default=False,
        nullable=False
    )

    threshold_enabled = Column(
        Boolean,
        default=False,
        nullable=False
    )

    # =====================================================
    # PROCESSING RESULT
    # =====================================================

    processing_status = Column(
        String,
        nullable=False,
        default="pending"
    )

    processing_time = Column(
        Float,
        nullable=True
    )

    # =====================================================
    # TIMESTAMP
    # =====================================================

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )