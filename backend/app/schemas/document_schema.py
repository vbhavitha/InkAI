from datetime import datetime

from pydantic import BaseModel, ConfigDict


class DocumentCreate(BaseModel):
    title: str = "Untitled Document"

    content: dict

    source_file_id: int | None = None

    word_count: int = 0

    character_count: int = 0


class DocumentUpdate(BaseModel):
    title: str | None = None

    content: dict | None = None

    source_file_id: int | None = None

    word_count: int | None = None

    character_count: int | None = None


class DocumentResponse(BaseModel):
    id: int

    user_id: int

    title: str

    content: dict

    source_file_id: int | None

    word_count: int

    character_count: int

    created_at: datetime

    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )