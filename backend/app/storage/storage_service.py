"""
InkAI Storage Service

Centralized filesystem storage for generated and uploaded files.

Storage structure:

    backend/storage/
    ├── original/
    ├── processed/
    ├── handwriting/
    │   ├── previews/
    │   └── final/
    └── pdf/

The storage service is responsible for:

    - creating storage directories
    - generating safe filenames
    - saving files
    - reading files
    - deleting files
    - returning storage paths

Important:

    Original files are never overwritten by handwriting
    generation or PDF generation.
"""

from __future__ import annotations

import re
from pathlib import Path
from typing import BinaryIO


# ============================================================
# STORAGE ROOT
# ============================================================

# backend/app/storage/storage_service.py
#                         ↑
# parents[0] = storage
# parents[1] = app
# parents[2] = backend

BACKEND_ROOT = (
    Path(__file__).resolve().parents[2]
)

STORAGE_ROOT = (
    BACKEND_ROOT / "storage"
)


# ============================================================
# STORAGE DIRECTORIES
# ============================================================

ORIGINAL_DIR = (
    STORAGE_ROOT / "original"
)

PROCESSED_DIR = (
    STORAGE_ROOT / "processed"
)

HANDWRITING_DIR = (
    STORAGE_ROOT / "handwriting"
)

HANDWRITING_PREVIEWS_DIR = (
    HANDWRITING_DIR / "previews"
)

HANDWRITING_FINAL_DIR = (
    HANDWRITING_DIR / "final"
)

PDF_DIR = (
    STORAGE_ROOT / "pdf"
)


# ============================================================
# DIRECTORY INITIALIZATION
# ============================================================


def initialize_storage() -> None:
    """
    Create all required storage directories.

    Safe to call multiple times.
    """

    directories = [
        ORIGINAL_DIR,
        PROCESSED_DIR,
        HANDWRITING_PREVIEWS_DIR,
        HANDWRITING_FINAL_DIR,
        PDF_DIR,
    ]

    for directory in directories:
        directory.mkdir(
            parents=True,
            exist_ok=True,
        )


# ============================================================
# SAFE IDENTIFIERS
# ============================================================


def _safe_identifier(
    value: str | int,
) -> str:
    """
    Convert an identifier into a filesystem-safe string.

    Examples:

        123
            -> "123"

        "document-123"
            -> "document-123"

        "../../secret"
            -> "secret"

        "hello world"
            -> "hello-world"
    """

    value = str(value).strip()

    value = re.sub(
        r"[^a-zA-Z0-9_-]+",
        "-",
        value,
    )

    value = value.strip(
        "-_"
    )

    if not value:
        raise ValueError(
            "A valid identifier is required."
        )

    return value


# ============================================================
# SAFE FILE EXTENSIONS
# ============================================================


def _safe_extension(
    extension: str,
    default: str,
) -> str:
    """
    Normalize a file extension.

    Examples:

        "png"
            -> ".png"

        ".png"
            -> ".png"

        ""
            -> ".png"
    """

    extension = (
        extension or default
    ).strip().lower()

    extension = extension.lstrip(".")

    extension = re.sub(
        r"[^a-z0-9]+",
        "",
        extension,
    )

    if not extension:
        extension = default.lstrip(".")

    return f".{extension}"


# ============================================================
# FILE WRITING
# ============================================================


def _write_bytes(
    path: Path,
    data: bytes | bytearray,
) -> Path:
    """
    Write binary data to a file.
    """

    path.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    path.write_bytes(
        bytes(data)
    )

    return path


def _write_file_object(
    path: Path,
    file_object: BinaryIO,
) -> Path:
    """
    Write a binary file-like object to disk.
    """

    path.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    with path.open(
        "wb"
    ) as destination:

        while True:
            chunk = file_object.read(
                1024 * 1024
            )

            if not chunk:
                break

            destination.write(
                chunk
            )

    return path


# ============================================================
# ORIGINAL FILES
# ============================================================


def save_original(
    document_id: str | int,
    data: bytes | bytearray,
    extension: str = "png",
) -> Path:
    """
    Save an original uploaded document.

    IMPORTANT:

        This function creates a new file.
        It never modifies a processed or handwriting file.
    """

    safe_id = _safe_identifier(
        document_id
    )

    safe_extension = _safe_extension(
        extension,
        "png",
    )

    filename = (
        f"{safe_id}{safe_extension}"
    )

    path = (
        ORIGINAL_DIR / filename
    )

    return _write_bytes(
        path,
        data,
    )


# ============================================================
# PROCESSED FILES
# ============================================================


def save_processed(
    document_id: str | int,
    data: bytes | bytearray,
    extension: str = "png",
) -> Path:
    """
    Save a processed/preprocessed document.

    The original file remains untouched.
    """

    safe_id = _safe_identifier(
        document_id
    )

    safe_extension = _safe_extension(
        extension,
        "png",
    )

    filename = (
        f"{safe_id}_processed{safe_extension}"
    )

    path = (
        PROCESSED_DIR / filename
    )

    return _write_bytes(
        path,
        data,
    )


# ============================================================
# HANDWRITING PREVIEW
# ============================================================


def save_handwriting_preview(
    document_id: str | int,
    page_number: int,
    data: bytes | bytearray,
    extension: str = "png",
) -> Path:
    """
    Save a single handwriting preview page.

    Example:

        document_id = 123
        page_number = 1

    Result:

        storage/handwriting/previews/123_page_1.png
    """

    if page_number < 1:
        raise ValueError(
            "Page number must be greater than zero."
        )

    safe_id = _safe_identifier(
        document_id
    )

    safe_extension = _safe_extension(
        extension,
        "png",
    )

    filename = (
        f"{safe_id}_page_{page_number}"
        f"{safe_extension}"
    )

    path = (
        HANDWRITING_PREVIEWS_DIR
        / filename
    )

    return _write_bytes(
        path,
        data,
    )


# ============================================================
# HANDWRITING FINAL
# ============================================================


def save_handwriting_final(
    document_id: str | int,
    data: bytes | bytearray,
    extension: str = "png",
) -> Path:
    """
    Save the final handwriting export.

    Example:

        storage/handwriting/final/123.png
    """

    safe_id = _safe_identifier(
        document_id
    )

    safe_extension = _safe_extension(
        extension,
        "png",
    )

    filename = (
        f"{safe_id}{safe_extension}"
    )

    path = (
        HANDWRITING_FINAL_DIR
        / filename
    )

    return _write_bytes(
        path,
        data,
    )


# ============================================================
# PDF
# ============================================================


def save_pdf(
    document_id: str | int,
    data: bytes | bytearray,
) -> Path:
    """
    Save a generated handwriting PDF.

    Example:

        storage/pdf/123.pdf
    """

    safe_id = _safe_identifier(
        document_id
    )

    filename = (
        f"{safe_id}.pdf"
    )

    path = (
        PDF_DIR / filename
    )

    return _write_bytes(
        path,
        data,
    )


# ============================================================
# FILE OBJECT VARIANTS
# ============================================================


def save_original_file(
    document_id: str | int,
    file_object: BinaryIO,
    extension: str = "png",
) -> Path:
    """
    Save an original uploaded file object.
    """

    safe_id = _safe_identifier(
        document_id
    )

    safe_extension = _safe_extension(
        extension,
        "png",
    )

    path = (
        ORIGINAL_DIR
        / f"{safe_id}{safe_extension}"
    )

    return _write_file_object(
        path,
        file_object,
    )


def save_processed_file(
    document_id: str | int,
    file_object: BinaryIO,
    extension: str = "png",
) -> Path:
    """
    Save a processed file object.
    """

    safe_id = _safe_identifier(
        document_id
    )

    safe_extension = _safe_extension(
        extension,
        "png",
    )

    path = (
        PROCESSED_DIR
        / f"{safe_id}_processed"
        f"{safe_extension}"
    )

    return _write_file_object(
        path,
        file_object,
    )


# ============================================================
# FILE READING
# ============================================================


def read_file(
    path: Path,
) -> bytes:
    """
    Read a stored file.

    Only paths located inside STORAGE_ROOT are allowed.
    """

    resolved_path = (
        path.resolve()
    )

    storage_root = (
        STORAGE_ROOT.resolve()
    )

    try:
        resolved_path.relative_to(
            storage_root
        )
    except ValueError as exc:
        raise ValueError(
            "Access outside the storage directory is not allowed."
        ) from exc

    if not resolved_path.exists():
        raise FileNotFoundError(
            f"Stored file not found: {resolved_path}"
        )

    if not resolved_path.is_file():
        raise ValueError(
            f"Storage path is not a file: {resolved_path}"
        )

    return resolved_path.read_bytes()


# ============================================================
# FILE EXISTENCE
# ============================================================


def file_exists(
    path: Path,
) -> bool:
    """
    Check whether a stored file exists safely.
    """

    resolved_path = (
        path.resolve()
    )

    storage_root = (
        STORAGE_ROOT.resolve()
    )

    try:
        resolved_path.relative_to(
            storage_root
        )
    except ValueError:
        return False

    return (
        resolved_path.exists()
        and resolved_path.is_file()
    )


# ============================================================
# FILE DELETION
# ============================================================


def delete_file(
    path: Path,
) -> bool:
    """
    Delete a stored file safely.

    Returns:

        True  -> file was deleted
        False -> file did not exist
    """

    resolved_path = (
        path.resolve()
    )

    storage_root = (
        STORAGE_ROOT.resolve()
    )

    try:
        resolved_path.relative_to(
            storage_root
        )
    except ValueError as exc:
        raise ValueError(
            "Access outside the storage directory is not allowed."
        ) from exc

    if not resolved_path.exists():
        return False

    if not resolved_path.is_file():
        raise ValueError(
            f"Storage path is not a file: {resolved_path}"
        )

    resolved_path.unlink()

    return True


# ============================================================
# STORAGE PATH HELPERS
# ============================================================


def get_handwriting_preview_path(
    document_id: str | int,
    page_number: int,
    extension: str = "png",
) -> Path:
    """
    Return the expected path for a handwriting preview.
    """

    if page_number < 1:
        raise ValueError(
            "Page number must be greater than zero."
        )

    safe_id = _safe_identifier(
        document_id
    )

    safe_extension = _safe_extension(
        extension,
        "png",
    )

    return (
        HANDWRITING_PREVIEWS_DIR
        / (
            f"{safe_id}_page_"
            f"{page_number}"
            f"{safe_extension}"
        )
    )


def get_handwriting_final_path(
    document_id: str | int,
    extension: str = "png",
) -> Path:
    """
    Return the expected path for a final handwriting file.
    """

    safe_id = _safe_identifier(
        document_id
    )

    safe_extension = _safe_extension(
        extension,
        "png",
    )

    return (
        HANDWRITING_FINAL_DIR
        / f"{safe_id}{safe_extension}"
    )


def get_pdf_path(
    document_id: str | int,
) -> Path:
    """
    Return the expected path for a generated PDF.
    """

    safe_id = _safe_identifier(
        document_id
    )

    return (
        PDF_DIR
        / f"{safe_id}.pdf"
    )


# ============================================================
# INITIALIZE STORAGE ON IMPORT
# ============================================================


initialize_storage()