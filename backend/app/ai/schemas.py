"""
Pydantic schemas for InkAI AI requests and responses.
"""

from pydantic import BaseModel, Field


class AIRequest(BaseModel):
    """Request sent to the AI service."""

    instruction: str = Field(
        ...,
        min_length=1,
        description="Instruction or question for the AI.",
    )

    context: str | None = Field(
        default=None,
        description="Optional context for the AI.",
    )


class AIResponse(BaseModel):
    """Response returned by the AI service."""

    response: str