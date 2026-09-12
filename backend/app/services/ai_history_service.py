"""
Service for storing and retrieving AI history.
"""

from datetime import datetime

from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.models.ai_history import AIHistory


def create_ai_history(
    db: Session,
    feature: str,
    input_text: str,
    output_text: str,
    model: str | None = None,
    user_id: int | None = None,
    document_id: int | None = None,
) -> AIHistory:
    """
    Store one AI operation in history.
    """

    history = AIHistory(
        user_id=user_id,
        document_id=document_id,
        feature=feature,
        input_text=input_text,
        output_text=output_text,
        model=model,
    )

    db.add(history)
    db.commit()
    db.refresh(history)

    return history


def get_ai_history(
    db: Session,
    user_id: int | None = None,
    document_id: int | None = None,
    limit: int = 50,
) -> list[AIHistory]:
    """
    Retrieve recent AI history.
    """

    query = db.query(AIHistory)

    if user_id is not None:
        query = query.filter(
            AIHistory.user_id == user_id
        )

    if document_id is not None:
        query = query.filter(
            AIHistory.document_id == document_id
        )

    return (
        query
        .order_by(desc(AIHistory.created_at))
        .limit(limit)
        .all()
    )


def delete_ai_history(
    db: Session,
    history_id: int,
) -> bool:
    """
    Delete one AI history entry.
    """

    history = (
        db.query(AIHistory)
        .filter(AIHistory.id == history_id)
        .first()
    )

    if history is None:
        return False

    db.delete(history)
    db.commit()

    return True