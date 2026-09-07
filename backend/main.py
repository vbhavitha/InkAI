import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.routes.auth import router as auth_router
from app.routes.upload import router as upload_router
from app.api.processing import router as processing_router
from app.api.ocr import router as ocr_router

from app.models.user import User
from app.models.ocr_result import OCRResultModel
from app.models.document import Document
from app.api.documents import router as documents_router
from app.models.document_version import DocumentVersion
from app.api.handwriting import router as handwriting_router

from app.models.handwriting_document import HandwritingDocument


app = FastAPI()

from pathlib import Path

HANDWRITING_FONTS_DIR = (
    Path(__file__).resolve().parent
    / "app"
    / "handwriting"
    / "fonts"
)

app.mount(
    "/fonts",
    StaticFiles(directory=HANDWRITING_FONTS_DIR),
    name="handwriting-fonts",
)


# =========================================================
# CORS
# =========================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# API ROUTES
# =========================================================

app.include_router(auth_router)

app.include_router(upload_router)

app.include_router(processing_router)

app.include_router(ocr_router)

app.include_router(documents_router)

app.include_router(handwriting_router)

# =========================================================
# UPLOADS DIRECTORY
# =========================================================

BASE_DIR = os.path.dirname(
    os.path.abspath(__file__)
)

UPLOADS_DIR = os.path.join(
    BASE_DIR,
    "uploads"
)


app.mount(
    "/uploads",
    StaticFiles(
        directory=UPLOADS_DIR
    ),
    name="uploads"
)


# =========================================================
# HOME
# =========================================================

@app.get("/")
def home():
    return {
        "message": "Welcome to InkAI API"
    }