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
    SummarizeRequest,
    SummarizeResponse,
    FlashcardsRequest,
    FlashcardsResponse,
    MCQRequest,
    MCQResponse,
    QuestionGeneratorRequest,
    QuestionGeneratorResponse,
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

@router.post(
    "/summarize",
    response_model=SummarizeResponse,
)
def summarize_notes(
    request: SummarizeRequest,
):
    """
    Summarize notes and return structured key points.
    """

    result = ai_service.summarize_notes(
        text=request.text,
        length=request.length.value,
    )

    return SummarizeResponse(
        summary=result["summary"],
        key_points=result["key_points"],
    )

@router.post(
    "/flashcards",
    response_model=FlashcardsResponse,
)
def generate_flashcards(
    request: FlashcardsRequest,
):
    """
    Generate structured flashcards from notes.
    """

    result = ai_service.generate_flashcards(
        text=request.text,
    )

    return FlashcardsResponse(
        flashcards=result["flashcards"],
    )

@router.post(
    "/mcqs",
    response_model=MCQResponse,
)
def generate_mcqs(
    request: MCQRequest,
):
    """
    Generate multiple-choice questions.
    """

    result = ai_service.generate_mcqs(
        text=request.text,
        count=request.count,
        difficulty=request.difficulty.value,
    )

    return MCQResponse(
        questions=result["questions"],
    )@router.post(
    "/questions",
    response_model=QuestionGeneratorResponse,
)
def generate_questions(
    request: QuestionGeneratorRequest,
):
    """
    Generate non-MCQ questions.
    """

    result = ai_service.generate_questions(
        text=request.text,
        question_type=request.type.value,
        difficulty=request.difficulty.value,
        count=request.count,
    )

    return QuestionGeneratorResponse(
        questions=result["questions"],
    )