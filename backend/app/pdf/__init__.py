"""
Reusable PDF engine for InkAI.

This package is intentionally independent from
the assignment-specific application logic.
"""

from .generator import PDFGenerator

__all__ = [
    "PDFGenerator",
]