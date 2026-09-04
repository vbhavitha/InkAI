from datetime import datetime

from pydantic import BaseModel, ConfigDict


class DocumentVersionResponse(BaseModel):
    id: int

    document_id: int

    version_number: int

    title: str

    content: dict

    word_count: int

    character_count: int

    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )


class RestoreVersionResponse(BaseModel):
    message: str

    document_id: int

    restored_version: int

    document: dict