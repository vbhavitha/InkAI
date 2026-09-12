"""
Pydantic schemas for InkAI AI features.
"""

from typing import Literal

from pydantic import BaseModel, Field


RewriteStyle = Literal[
    "simple",
    "professional",
    "academic",
    "exam_notes",
    "detailed",
    "concise",
]


class AIRequest(BaseModel):
    """Generic AI request."""

    instruction: str = Field(
        ...,
        min_length=1,
        description="Instruction or question for the AI.",
    )

    context: str | None = Field(
        default=None,
        description="Optional context.",
    )


class GrammarRequest(BaseModel):
    """Grammar correction request."""

    text: str = Field(
        ...,
        min_length=1,
        description="Text to correct.",
    )


class RewriteRequest(BaseModel):
    """Note rewriting request."""

    text: str = Field(
        ...,
        min_length=1,
        description="Notes to rewrite.",
    )

    style: RewriteStyle = Field(
        default="simple",
        description="Rewrite style.",
    )


class AIResponse(BaseModel):
    """Generic AI response."""

    response: str


class GrammarResponse(BaseModel):
    """Grammar correction response."""

    result: str


class RewriteResponse(BaseModel):
    """Rewrite response."""

    result: str