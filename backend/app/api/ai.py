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
    ExplainTopicRequest,
    ExplainTopicResponse,
    TranslationRequest,
    TranslationResponse,
    PresentationRequest,
    PresentationPlanResponse,
    MarkdownRequest,
    MarkdownResponse,
)

from pathlib import Path
from uuid import uuid4

from fastapi.responses import FileResponse

from app.presentation.generator import (
    generate_presentation,
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

@router.post(
    "/explain",
    response_model=ExplainTopicResponse,
)
def explain_topic(
    request: ExplainTopicRequest,
):
    try:
        result = ai_service.explain_topic(
            text=request.text,
            level=request.level.value,
        )

        return ExplainTopicResponse(
            title=result["title"],
            explanation=result["explanation"],
            key_points=result["key_points"],
            example=result["example"],
            analogy=result["analogy"],
        )

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        )

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=(
                "Failed to explain topic: "
                f"{error}"
            ),
        )

@router.post(
    "/translate",
    response_model=TranslationResponse,
)
def translate_text(
    request: TranslationRequest,
):
    try:
        result = ai_service.translate_text(
            text=request.text,
            target_language=request.target_language,
        )

        return TranslationResponse(
            source_language=result[
                "source_language"
            ],
            target_language=result[
                "target_language"
            ],
            translated_text=result[
                "translated_text"
            ],
        )

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        )

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=(
                "Failed to translate text: "
                f"{error}"
            ),
        )

@router.post(
    "/translate",
    response_model=TranslationResponse,
)
def translate_text(
    request: TranslationRequest,
):
    try:
        result = ai_service.translate_text(
            text=request.text,
            target_language=request.target_language,
        )

        return TranslationResponse(
            source_language=result[
                "source_language"
            ],
            target_language=result[
                "target_language"
            ],
            translated_text=result[
                "translated_text"
            ],
        )

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        )

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=(
                "Failed to translate text: "
                f"{error}"
            ),
        )

@router.post(
    "/presentation",
)
def create_presentation(
    request: PresentationRequest,
):
    try:
        # ------------------------------------------------------
        # 1. Ask AI to plan the presentation
        # ------------------------------------------------------

        plan = ai_service.create_presentation_plan(
            text=request.text,
            title=request.title,
        )

        # ------------------------------------------------------
        # 2. Generate actual PPTX
        # ------------------------------------------------------

        output_directory = (
            Path("generated")
            / "presentations"
        )

        output_directory.mkdir(
            parents=True,
            exist_ok=True,
        )

        file_id = str(uuid4())

        output_path = (
            output_directory
            / f"{file_id}.pptx"
        )

        generate_presentation(
            title=plan["title"],
            slides=plan["slides"],
            output_path=output_path,
        )

        # ------------------------------------------------------
        # 3. Return file
        # ------------------------------------------------------

        return FileResponse(
            path=str(output_path),
            media_type=(
                "application/vnd.openxmlformats-"
                "officedocument.presentationml.presentation"
            ),
            filename=(
                f"{plan['title']}.pptx"
            ),
        )

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        )

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=(
                "Failed to generate presentation: "
                f"{error}"
            ),
        )

@router.post(
    "/markdown",
    response_model=MarkdownResponse,
)
def convert_to_markdown(
    request: MarkdownRequest,
):
    try:
        result = ai_service.convert_to_markdown(
            text=request.text,
        )

        return MarkdownResponse(
            markdown=result["markdown"]
        )

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        )

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=(
                "Failed to convert notes to Markdown: "
                f"{error}"
            ),
        )