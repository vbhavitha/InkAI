from __future__ import annotations

import os
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.api.pdf import router as pdf_router


# =========================================================
# ROUTES
# =========================================================

from app.routes.auth import router as auth_router
from app.routes.upload import router as upload_router

from app.api.processing import router as processing_router
from app.api.ocr import router as ocr_router
from app.api.documents import router as documents_router
from app.api.handwriting import router as handwriting_router

from app.api.assignments import router as assignments_router

from app.api.handwriting_documents import (
    router as handwriting_documents_router,
)


# =========================================================
# MODELS
# =========================================================
#
# These imports ensure SQLAlchemy registers the models.
#

from app.models.user import User
from app.models.ocr_result import OCRResultModel
from app.models.document import Document
from app.models.document_version import DocumentVersion
from app.models.handwriting_document import HandwritingDocument
from app.models.assignment import Assignment
from app.models.pdf_document import PdfDocument


# =========================================================
# STORAGE
# =========================================================

from app.storage.storage_service import (
    STORAGE_ROOT,
    initialize_storage,
)


# Make sure the storage folders exist
# before FastAPI mounts them.
initialize_storage()


# =========================================================
# APP
# =========================================================

app = FastAPI(
    title="InkAI API",
    version="1.0.0",
)


# =========================================================
# HANDWRITING FONTS
# =========================================================

HANDWRITING_FONTS_DIR = (
    Path(__file__).resolve().parent
    / "app"
    / "handwriting"
    / "fonts"
)


app.mount(
    "/fonts",
    StaticFiles(
        directory=HANDWRITING_FONTS_DIR
    ),
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

app.include_router(
    auth_router
)

app.include_router(
    upload_router
)

app.include_router(
    processing_router
)

app.include_router(
    ocr_router
)

app.include_router(
    documents_router
)

app.include_router(
    handwriting_router
)

app.include_router(assignments_router)

app.include_router(
    handwriting_documents_router
)

app.include_router(
    pdf_router
)


# =========================================================
# GENERATED FILE STORAGE
# =========================================================
#
# IMPORTANT:
#
# Only the dedicated backend/storage directory is exposed.
#
# We do NOT expose the entire backend directory.
#
# Available:
#
# /files/handwriting/previews/
# /files/handwriting/final/
# /files/pdf/
# /files/original/
# /files/processed/
#
# =========================================================

app.mount(
    "/files",
    StaticFiles(
        directory=STORAGE_ROOT
    ),
    name="storage-files",
)


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
    name="uploads",
)


# =========================================================
# HOME
# =========================================================

@app.get("/")
def home():
    return {
        "message": "Welcome to InkAI API"
    }