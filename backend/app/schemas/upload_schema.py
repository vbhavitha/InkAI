from pydantic import BaseModel


class UploadResponse(BaseModel):
    id: str
    filename: str
    size: int