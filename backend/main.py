import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.routes.auth import router as auth_router
from app.routes.upload import router as upload_router
from app.api.processing import router as processing_router
from app.api.ocr import router as ocr_router


app = FastAPI()


# =========================================================
# CORS
# =========================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
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