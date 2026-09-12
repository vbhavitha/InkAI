"""
AI API routes for InkAI.

The API layer only handles HTTP requests and responses.
AI provider logic belongs in the AI service/provider layers.
"""

from fastapi import APIRouter, HTTPException

from app.ai.ai_service import ai_service
from app.ai.schemas import AIRequest, AIResponse


router = APIRouter(
    prefix="/ai",
    tags=["AI"],
)


@router.post(
    "/generate",
    response_model=AIResponse,
)
def generate_ai_response(
    request: AIRequest,
) -> AIResponse:
    """Generate an AI response."""

    try:
        response = ai_service.generate(
            instruction=request.instruction,
            context=request.context,
        )

        return AIResponse(
            response=response
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail="AI service failed.",
        ) from exc