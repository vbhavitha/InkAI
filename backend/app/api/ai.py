"""
AI API routes for InkAI.
"""

from fastapi import APIRouter, HTTPException

from app.ai.ai_service import ai_service
from app.ai.schemas import (
    AIRequest,
    AIResponse,
    GrammarRequest,
    GrammarResponse,
    RewriteRequest,
    RewriteResponse,
)


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
    """
    General-purpose AI endpoint.
    """

    try:
        response = ai_service.generate(
            instruction=request.instruction,
            context=request.context,
        )

        return AIResponse(
            response=response,
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


@router.post(
    "/grammar",
    response_model=GrammarResponse,
)
def correct_grammar(
    request: GrammarRequest,
) -> GrammarResponse:
    """
    Correct grammar in the supplied text.
    """

    try:
        result = ai_service.correct_grammar(
            text=request.text,
        )

        return GrammarResponse(
            result=result,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail="Grammar correction failed.",
        ) from exc


@router.post(
    "/rewrite",
    response_model=RewriteResponse,
)
def rewrite_notes(
    request: RewriteRequest,
) -> RewriteResponse:
    """
    Rewrite notes using the selected style.
    """

    try:
        result = ai_service.rewrite_notes(
            text=request.text,
            style=request.style,
        )

        return RewriteResponse(
            result=result,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail="Note rewriting failed.",
        ) from exc