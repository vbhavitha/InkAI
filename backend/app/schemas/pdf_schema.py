from pydantic import BaseModel
from typing import List


class PDFPage(BaseModel):

    page: int

    filename: str

    size: int


class PDFPagesResponse(BaseModel):

    id: str

    filename: str

    pages: List[PDFPage]