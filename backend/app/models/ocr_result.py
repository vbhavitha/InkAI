from datetime import datetime

from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from app.database.database import Base


class OCRResultModel(Base):
    __tablename__ = "ocr_results"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # ID/path of the uploaded file
    file_id = Column(String, nullable=True)

    full_text = Column(Text, nullable=False)

    overall_confidence = Column(Float, nullable=True)

    language = Column(String, nullable=True)

    engine_used = Column(String, nullable=True)

    processing_time = Column(Float, nullable=True)

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    user = relationship("User", back_populates="ocr_results")