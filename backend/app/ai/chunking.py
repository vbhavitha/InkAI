"""
Document chunking utilities for InkAI.

Purpose:

Large document
      ↓
Paragraph/section chunks
      ↓
Relevant chunks
      ↓
AI

This prevents blindly sending very large documents
to the AI provider.
"""

from __future__ import annotations

import re
from dataclasses import dataclass


# Approximate character limits.
# These are deliberately conservative because characters
# are not the same as model tokens.
DEFAULT_CHUNK_SIZE = 6000
DEFAULT_CHUNK_OVERLAP = 500


@dataclass
class DocumentChunk:
    """
    Represents one chunk of document content.
    """

    index: int
    text: str


def normalize_text(text: str) -> str:
    """
    Normalize excessive whitespace while preserving
    paragraph boundaries.
    """

    if not text:
        return ""

    text = text.replace("\r\n", "\n")
    text = text.replace("\r", "\n")

    # Remove excessive spaces/tabs.
    text = re.sub(r"[ \t]+", " ", text)

    # Keep paragraph boundaries.
    text = re.sub(r"\n{3,}", "\n\n", text)

    return text.strip()


def chunk_text(
    text: str,
    chunk_size: int = DEFAULT_CHUNK_SIZE,
    overlap: int = DEFAULT_CHUNK_OVERLAP,
) -> list[DocumentChunk]:
    """
    Split a document into overlapping chunks.

    The function tries to split at paragraph boundaries
    before falling back to sentence/character boundaries.
    """

    text = normalize_text(text)

    if not text:
        return []

    if chunk_size <= 0:
        raise ValueError(
            "chunk_size must be greater than zero."
        )

    if overlap < 0:
        raise ValueError(
            "overlap cannot be negative."
        )

    if overlap >= chunk_size:
        raise ValueError(
            "overlap must be smaller than chunk_size."
        )

    # Small document — no chunking required.
    if len(text) <= chunk_size:
        return [
            DocumentChunk(
                index=0,
                text=text,
            )
        ]

    paragraphs = [
        paragraph.strip()
        for paragraph in text.split("\n\n")
        if paragraph.strip()
    ]

    chunks: list[DocumentChunk] = []
    current = ""

    for paragraph in paragraphs:

        # If adding the paragraph still fits,
        # keep building the current chunk.
        candidate = (
            f"{current}\n\n{paragraph}"
            if current
            else paragraph
        )

        if len(candidate) <= chunk_size:
            current = candidate
            continue

        # Save current chunk.
        if current:
            chunks.append(
                DocumentChunk(
                    index=len(chunks),
                    text=current.strip(),
                )
            )

        # Paragraph itself is too large.
        if len(paragraph) > chunk_size:
            paragraph_chunks = _split_large_text(
                paragraph,
                chunk_size,
            )

            for part in paragraph_chunks:
                chunks.append(
                    DocumentChunk(
                        index=len(chunks),
                        text=part,
                    )
                )

            current = ""
            continue

        current = paragraph

    # Save final chunk.
    if current:
        chunks.append(
            DocumentChunk(
                index=len(chunks),
                text=current.strip(),
            )
        )

    # Add overlap between neighboring chunks.
    if overlap == 0 or len(chunks) <= 1:
        return chunks

    overlapped_chunks: list[DocumentChunk] = []

    for index, chunk in enumerate(chunks):

        prefix = ""

        if index > 0:
            previous_text = chunks[index - 1].text

            prefix = previous_text[-overlap:]

        combined = (
            f"{prefix}\n\n{chunk.text}"
            if prefix
            else chunk.text
        )

        overlapped_chunks.append(
            DocumentChunk(
                index=index,
                text=combined.strip(),
            )
        )

    return overlapped_chunks


def _split_large_text(
    text: str,
    chunk_size: int,
) -> list[str]:
    """
    Split an oversized paragraph.

    Preference:

    sentences
       ↓
    words
       ↓
    hard character boundary
    """

    sentences = re.split(
        r"(?<=[.!?])\s+",
        text,
    )

    chunks: list[str] = []
    current = ""

    for sentence in sentences:

        sentence = sentence.strip()

        if not sentence:
            continue

        candidate = (
            f"{current} {sentence}"
            if current
            else sentence
        )

        if len(candidate) <= chunk_size:
            current = candidate
            continue

        if current:
            chunks.append(current.strip())

        # Single sentence is still too large.
        if len(sentence) > chunk_size:
            for start in range(
                0,
                len(sentence),
                chunk_size,
            ):
                chunks.append(
                    sentence[
                        start:start + chunk_size
                    ].strip()
                )

            current = ""
        else:
            current = sentence

    if current:
        chunks.append(current.strip())

    return chunks


def select_relevant_chunks(
    chunks: list[DocumentChunk],
    query: str,
    top_k: int = 3,
) -> list[DocumentChunk]:
    """
    Select chunks that are most relevant to a query.

    This is intentionally lightweight.

    Later, InkAI can replace this with embeddings/vector
    search without changing the API layer.
    """

    if not chunks:
        return []

    query = normalize_text(query).lower()

    if not query:
        return chunks[:top_k]

    query_words = {
        word
        for word in re.findall(
            r"\b[a-zA-Z0-9]+\b",
            query,
        )
        if len(word) > 2
    }

    if not query_words:
        return chunks[:top_k]

    scored_chunks = []

    for chunk in chunks:

        chunk_words = {
            word
            for word in re.findall(
                r"\b[a-zA-Z0-9]+\b",
                chunk.text.lower(),
            )
        }

        score = len(
            query_words.intersection(chunk_words)
        )

        scored_chunks.append(
            (score, chunk)
        )

    scored_chunks.sort(
        key=lambda item: item[0],
        reverse=True,
    )

    selected = [
        chunk
        for score, chunk in scored_chunks
        if score > 0
    ]

    return selected[:top_k] or chunks[:top_k]


def prepare_relevant_context(
    text: str,
    query: str | None = None,
    chunk_size: int = DEFAULT_CHUNK_SIZE,
    top_k: int = 3,
) -> str:
    """
    Prepare AI context from a potentially large document.

    If no query is supplied:
        return the first relevant/default chunks.

    If a query is supplied:
        return the chunks most relevant to that query.
    """

    chunks = chunk_text(
        text=text,
        chunk_size=chunk_size,
    )

    if not chunks:
        return ""

    if len(chunks) == 1:
        return chunks[0].text

    if query:
        selected = select_relevant_chunks(
            chunks=chunks,
            query=query,
            top_k=top_k,
        )
    else:
        selected = chunks[:top_k]

    return "\n\n---\n\n".join(
        chunk.text
        for chunk in selected
    )