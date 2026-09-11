"""
InkAI PDF Metadata
==================

Reusable PDF document metadata helpers.

Metadata supported:
- Title
- Author
- Subject
- Keywords
- Creator
- Creation Date
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Iterable

from reportlab.pdfgen.canvas import Canvas


@dataclass
class PDFMetadata:
    """Normalized PDF metadata."""

    title: str = ""
    author: str = ""
    subject: str = ""
    keywords: str = ""
    creator: str = "InkAI"
    creation_date: datetime | None = None

    def normalized(self) -> "PDFMetadata":
        """Return a normalized metadata object."""

        creation_date = (
            self.creation_date
            or datetime.now(timezone.utc)
        )

        return PDFMetadata(
            title=str(
                self.title or ""
            ).strip(),

            author=str(
                self.author or ""
            ).strip(),

            subject=str(
                self.subject or ""
            ).strip(),

            keywords=str(
                self.keywords or ""
            ).strip(),

            creator=(
                str(
                    self.creator
                    or "InkAI"
                ).strip()
                or "InkAI"
            ),

            creation_date=creation_date,
        )


def build_metadata(
    *,
    title: str | None = None,
    author: str | None = None,
    subject: str | None = None,
    keywords: str | Iterable[str] | None = None,
    creator: str | None = None,
    creation_date: datetime | None = None,
) -> PDFMetadata:
    """Build normalized metadata."""

    if isinstance(
        keywords,
        (list, tuple, set),
    ):
        keywords_value = ", ".join(
            str(item).strip()
            for item in keywords
            if str(item).strip()
        )
    else:
        keywords_value = str(
            keywords or ""
        )

    return PDFMetadata(
        title=str(
            title or ""
        ),
        author=str(
            author or ""
        ),
        subject=str(
            subject or ""
        ),
        keywords=keywords_value,
        creator=str(
            creator or "InkAI"
        ),
        creation_date=creation_date,
    ).normalized()


def apply_metadata(
    canvas: Canvas,
    metadata: PDFMetadata | None = None,
    *,
    title: str | None = None,
    author: str | None = None,
    subject: str | None = None,
    keywords: str | Iterable[str] | None = None,
    creator: str | None = None,
    creation_date: datetime | None = None,
) -> PDFMetadata:
    """
    Apply metadata to a ReportLab canvas.

    The function remains backward-compatible with the previous
    apply_metadata(title=..., author=...) interface.
    """

    if metadata is None:
        metadata = build_metadata(
            title=title,
            author=author,
            subject=subject,
            keywords=keywords,
            creator=creator,
            creation_date=creation_date,
        )
    else:
        metadata = metadata.normalized()

    if metadata.title:
        canvas.setTitle(
            metadata.title
        )

    if metadata.author:
        canvas.setAuthor(
            metadata.author
        )

    if metadata.subject:
        canvas.setSubject(
            metadata.subject
        )

    if metadata.keywords:
        canvas.setKeywords(
            metadata.keywords
        )

    canvas.setCreator(
        metadata.creator
    )

    # ReportLab's PDFInfo stores creation time through the
    # canvas/document lifecycle. Calling setDateFormatter keeps
    # the generated document deterministic at the metadata layer
    # without manually modifying the PDF internals.
    if metadata.creation_date:
        try:
            canvas.setDateFormatter(
                lambda *_args, **_kwargs:
                metadata.creation_date.strftime(
                    "D:%Y%m%d%H%M%S+00'00'"
                )
            )
        except AttributeError:
            # Older ReportLab versions may not expose
            # setDateFormatter. PDF generation should continue.
            pass

    return metadata


__all__ = [
    "PDFMetadata",
    "build_metadata",
    "apply_metadata",
]