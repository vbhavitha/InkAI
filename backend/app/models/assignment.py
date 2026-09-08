from datetime import datetime

from sqlalchemy import Column, DateTime, Integer, String

from app.database.database import Base


class Assignment(Base):
    __tablename__ = "assignments"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, nullable=False, index=True)
    document_id = Column(Integer, nullable=False, index=True)

    title = Column(String, nullable=False)
    subject = Column(String, nullable=True)

    student_name = Column(String, nullable=True)
    roll_number = Column(String, nullable=True)
    class_name = Column(String, nullable=True)
    section = Column(String, nullable=True)

    teacher_name = Column(String, nullable=True)
    assignment_date = Column(String, nullable=True)

    template = Column(String, nullable=True)
    paper_style = Column(String, nullable=True)
    handwriting_style = Column(String, nullable=True)
    ink_color = Column(String, nullable=True)

    page_count = Column(Integer, default=1)

    pdf_path = Column(String, nullable=True)

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