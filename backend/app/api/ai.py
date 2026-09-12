"""
AI API routes for InkAI.

All AI requests flow through:

API Route
    ↓
AIService
    ↓
AIProvider
    ↓
Parser
    ↓
Pydantic response validation
"""

from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

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

from app.presentation.generator import generate_presentation


router = APIRouter(
    prefix="/ai",
    tags=["AI"],
)


# =============================================================
# Generic AI
# =============================================================

@router.post(
    "/generate",
    response_model=AIResponse,
)
def generate_ai_response(
    request: AIRequest,
) -> AIResponse:

    try:
        result = ai_service.generate(
            instruction=request.instruction,
            context=request.context,
        )

        return AIResponse(
            response=result,
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


# =============================================================
# Feature 1 — Grammar Correction
# =============================================================

@router.post(
    "/grammar",
    response_model=GrammarResponse,
)
def correct_grammar(
    request: GrammarRequest,
) -> GrammarResponse:

    try:
        result = ai_service.grammar_correct(
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


# =============================================================
# Feature 2 — Rewrite
# =============================================================

@router.post(
    "/rewrite",
    response_model=RewriteResponse,
)
def rewrite_notes(
    request: RewriteRequest,
) -> RewriteResponse:

    try:
        result = ai_service.rewrite(
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


# =============================================================
# Feature 3 — Summarization
# =============================================================

@router.post(
    "/summarize",
    response_model=SummarizeResponse,
)
def summarize_notes(
    request: SummarizeRequest,
) -> SummarizeResponse:

    try:
        result = ai_service.summarize(
            text=request.text,
            length=request.length.value,
        )

        return SummarizeResponse(
            summary=result["summary"],
            key_points=result["key_points"],
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail="Summarization failed.",
        ) from exc


# =============================================================
# Feature 4 — Flashcards
# =============================================================

@router.post(
    "/flashcards",
    response_model=FlashcardsResponse,
)
def generate_flashcards(
    request: FlashcardsRequest,
) -> FlashcardsResponse:

    try:
        result = ai_service.generate_flashcards(
            text=request.text,
            count=request.count,
        )

        return FlashcardsResponse(
            flashcards=result["flashcards"],
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail="Flashcard generation failed.",
        ) from exc


# =============================================================
# Feature 5 — MCQs
# =============================================================

@router.post(
    "/mcqs",
    response_model=MCQResponse,
)
def generate_mcqs(
    request: MCQRequest,
) -> MCQResponse:

    try:
        result = ai_service.generate_mcqs(
            text=request.text,
            count=request.count,
            difficulty=request.difficulty.value,
        )

        return MCQResponse(
            questions=result["questions"],
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail="MCQ generation failed.",
        ) from exc


# =============================================================
# Feature 6 — Question Generation
# =============================================================

@router.post(
    "/questions",
    response_model=QuestionGeneratorResponse,
)
def generate_questions(
    request: QuestionGeneratorRequest,
) -> QuestionGeneratorResponse:

    try:
        result = ai_service.generate_questions(
            text=request.text,
            question_type=request.type.value,
            difficulty=request.difficulty.value,
            count=request.count,
        )

        return QuestionGeneratorResponse(
            questions=result["questions"],
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail="Question generation failed.",
        ) from exc


# =============================================================
# Feature 7 — Explain Difficult Topics
# =============================================================

@router.post(
    "/explain",
    response_model=ExplainTopicResponse,
)
def explain_topic(
    request: ExplainTopicRequest,
) -> ExplainTopicResponse:

    try:
        result = ai_service.explain_topic(
            text=request.text,
            level=request.level.value,
        )

        return ExplainTopicResponse(
            topic=result["topic"],
            level=result["level"],
            explanation=result["explanation"],
            example=result["example"],
            key_points=result["key_points"],
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail="Topic explanation failed.",
        ) from exc


# =============================================================
# Feature 8 — Translation
# =============================================================

@router.post(
    "/translate",
    response_model=TranslationResponse,
)
def translate_text(
    request: TranslationRequest,
) -> TranslationResponse:

    try:
        result = ai_service.translate(
            text=request.text,
            language=request.target_language,
        )

        return TranslationResponse(
            source_language=result["source_language"],
            target_language=result["target_language"],
            translated_text=result["translated_text"],
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail="Translation failed.",
        ) from exc


# =============================================================
# Feature 9 — Presentation
# =============================================================

@router.post(
    "/presentation",
    response_model=None,
)
def generate_presentation_file(
    request: PresentationRequest,
):
    """
    Generate a PowerPoint presentation.

    Flow:

    Notes
       ↓
    AI presentation planner
       ↓
    Presentation plan
       ↓
    PPT renderer
       ↓
    .pptx
    """

    try:
        # -----------------------------------------------------
        # Step 1 — Ask AIService to create the slide plan
        # -----------------------------------------------------

        plan = ai_service.generate_presentation(
            text=request.text,
        )

        # -----------------------------------------------------
        # Step 2 — Validate the generated plan
        # -----------------------------------------------------

        validated_plan = PresentationPlanResponse(
            title=plan["title"],
            slides=plan["slides"],
        )

        # -----------------------------------------------------
        # Step 3 — Create temporary output directory
        # -----------------------------------------------------

        output_dir = Path("generated_presentations")
        output_dir.mkdir(
            parents=True,
            exist_ok=True,
        )

        output_path = (
            output_dir
            / f"presentation_{uuid4().hex}.pptx"
        )

        # -----------------------------------------------------
        # Step 4 — Render actual PPTX
        # -----------------------------------------------------

        generate_presentation(
            title=validated_plan.title,
            slides=[
                slide.model_dump()
                for slide in validated_plan.slides
            ],
            output_path=output_path,
        )

        # -----------------------------------------------------
        # Step 5 — Return downloadable file
        # -----------------------------------------------------

        return FileResponse(
            path=str(output_path),
            filename="InkAI_Presentation.pptx",
            media_type=(
                "application/vnd.openxmlformats-officedocument."
                "presentationml.presentation"
            ),
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail="Presentation generation failed.",
        ) from exc


# =============================================================
# Feature 10 — Markdown
# =============================================================

@router.post(
    "/markdown",
    response_model=MarkdownResponse,
)
def convert_to_markdown(
    request: MarkdownRequest,
) -> MarkdownResponse:

    try:
        result = ai_service.convert_to_markdown(
            text=request.text,
        )

        return MarkdownResponse(
            markdown=result,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail="Markdown conversion failed.",
        ) from exc