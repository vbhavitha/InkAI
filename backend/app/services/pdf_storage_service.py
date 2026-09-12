from __future__ import annotations

import shutil
from pathlib import Path
from uuid import uuid4


class PDFStorageService:
    """
    Handles persistent storage of InkAI generated PDFs.

    Storage structure:

        backend/
        └── storage/
            └── pdf/
                ├── previews/
                └── final/
    """

    def __init__(self):
        # backend/
        self.backend_root = (
            Path(__file__).resolve().parents[2]
        )

        # backend/storage/pdf/
        self.pdf_root = (
            self.backend_root
            / "storage"
            / "pdf"
        )

        self.preview_directory = (
            self.pdf_root
            / "previews"
        )

        self.final_directory = (
            self.pdf_root
            / "final"
        )

        self.ensure_directories()

    # =========================================================
    # DIRECTORY INITIALIZATION
    # =========================================================

    def ensure_directories(self) -> None:
        """
        Create PDF storage directories if they do not exist.
        """

        self.preview_directory.mkdir(
            parents=True,
            exist_ok=True,
        )

        self.final_directory.mkdir(
            parents=True,
            exist_ok=True,
        )

    # =========================================================
    # FINAL PDF STORAGE
    # =========================================================

    def save_final_pdf(
        self,
        source_path: str | Path,
        filename: str | None = None,
    ) -> Path:
        """
        Copy a validated PDF into permanent final storage.

        Returns:
            Path to the stored PDF.
        """

        source = Path(source_path)

        if not source.exists():
            raise FileNotFoundError(
                f"Source PDF does not exist: {source}"
            )

        if source.stat().st_size <= 0:
            raise ValueError(
                "Cannot store an empty PDF file."
            )

        self.ensure_directories()

        if filename:
            safe_filename = (
                Path(filename).name
            )
        else:
            safe_filename = (
                f"{uuid4().hex}.pdf"
            )

        if not safe_filename.lower().endswith(".pdf"):
            safe_filename += ".pdf"

        destination = (
            self.final_directory
            / safe_filename
        )

        shutil.copy2(
            source,
            destination,
        )

        return destination

    # =========================================================
    # PREVIEW PDF STORAGE
    # =========================================================

    def save_preview_pdf(
        self,
        source_path: str | Path,
        filename: str | None = None,
    ) -> Path:
        """
        Store a PDF preview.

        This is available for future preview persistence.
        """

        source = Path(source_path)

        if not source.exists():
            raise FileNotFoundError(
                f"Source PDF does not exist: {source}"
            )

        if source.stat().st_size <= 0:
            raise ValueError(
                "Cannot store an empty PDF file."
            )

        self.ensure_directories()

        if filename:
            safe_filename = (
                Path(filename).name
            )
        else:
            safe_filename = (
                f"{uuid4().hex}.pdf"
            )

        if not safe_filename.lower().endswith(".pdf"):
            safe_filename += ".pdf"

        destination = (
            self.preview_directory
            / safe_filename
        )

        shutil.copy2(
            source,
            destination,
        )

        return destination

    # =========================================================
    # DELETE
    # =========================================================

    def delete_pdf(
        self,
        file_path: str | Path | None,
    ) -> bool:
        """
        Delete a stored PDF safely.

        Returns:
            True if a file was deleted.
            False if the file did not exist.
        """

        if not file_path:
            return False

        path = Path(file_path)

        if not path.exists():
            return False

        if not path.is_file():
            return False

        path.unlink()

        return True

    # =========================================================
    # RESOLVE FINAL PDF
    # =========================================================

    def get_final_pdf_path(
        self,
        filename: str,
    ) -> Path:
        """
        Resolve a filename inside final PDF storage.
        """

        safe_filename = Path(
            filename
        ).name

        return (
            self.final_directory
            / safe_filename
        )


pdf_storage_service = PDFStorageService()