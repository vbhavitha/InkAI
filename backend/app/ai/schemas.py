"""
Pydantic schemas for InkAI AI features.

These schemas validate both incoming requests and
structured AI responses.
"""

from enum import Enum
from typing import Literal

from pydantic import BaseModel, Field


# =============================================================
# Shared Types
# =============================================================

RewriteStyle = Literal[
    "simple",
    "professional",
    "academic",
    "exam_notes",
    "detailed",
    "concise",
]


# =============================================================
# Generic AI
# =============================================================

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


class AIResponse(BaseModel):
    """Generic AI response."""

    response: str


# =============================================================
# Feature 1 — Grammar Correction
# =============================================================

class GrammarRequest(BaseModel):
    """Grammar correction request."""

    text: str = Field(
        ...,
        min_length=1,
        description="Text to correct.",
    )


class GrammarResponse(BaseModel):
    """Grammar correction response."""

    result: str


# =============================================================
# Feature 2 — Rewrite
# =============================================================

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


class RewriteResponse(BaseModel):
    """Rewrite response."""

    result: str


# =============================================================
# Feature 3 — Summarization
# =============================================================

class SummaryLength(str, Enum):
    """Summary length modes."""

    ONE_SENTENCE = "one_sentence"
    SHORT = "short"
    MEDIUM = "medium"
    DETAILED = "detailed"
    EXAM_REVISION = "exam_revision"


class SummarizeRequest(BaseModel):
    """Summarization request."""

    text: str = Field(
        ...,
        min_length=1,
        description="Text to summarize.",
    )

    length: SummaryLength = Field(
        default=SummaryLength.SHORT,
        description="Summary length/mode.",
    )


class SummarizeResponse(BaseModel):
    """Structured summary response."""

    summary: str

    key_points: list[str]


# =============================================================
# Feature 4 — Flashcards
# =============================================================

class FlashcardsRequest(BaseModel):
    """Flashcard generation request."""

    text: str = Field(
        ...,
        min_length=1,
        description="Notes used to generate flashcards.",
    )

    count: int = Field(
        default=10,
        ge=1,
        le=50,
        description="Number of flashcards to generate.",
    )


class Flashcard(BaseModel):
    """Single flashcard."""

    question: str
    answer: str


class FlashcardsResponse(BaseModel):
    """Flashcard generation response."""

    flashcards: list[Flashcard]


# =============================================================
# Feature 5 — MCQs
# =============================================================

class MCQDifficulty(str, Enum):
    """MCQ difficulty levels."""

    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"


class MCQRequest(BaseModel):
    """MCQ generation request."""

    text: str = Field(
        ...,
        min_length=1,
        description="Notes used to generate MCQs.",
    )

    count: int = Field(
        default=10,
        ge=1,
        le=50,
        description="Number of MCQs to generate.",
    )

    difficulty: MCQDifficulty = Field(
        default=MCQDifficulty.MEDIUM,
        description="MCQ difficulty.",
    )


class MCQQuestion(BaseModel):
    """Single multiple-choice question."""

    question: str

    options: list[str] = Field(
        ...,
        min_length=4,
        max_length=4,
    )

    answer: str

    explanation: str


class MCQResponse(BaseModel):
    """MCQ generation response."""

    questions: list[MCQQuestion]


# =============================================================
# Feature 6 — Question Generation
# =============================================================

class QuestionType(str, Enum):
    """Question generation types."""

    VERY_SHORT = "very_short"
    SHORT = "short"
    LONG = "long"
    IMPORTANT = "important"
    EXAM = "exam"
    VIVA = "viva"


class QuestionDifficulty(str, Enum):
    """Question difficulty levels."""

    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"


class QuestionGeneratorRequest(BaseModel):
    """Question generation request."""

    text: str = Field(
        ...,
        min_length=1,
        description="Notes used to generate questions.",
    )

    type: QuestionType = Field(
        default=QuestionType.EXAM,
        description="Type of question to generate.",
    )

    difficulty: QuestionDifficulty = Field(
        default=QuestionDifficulty.MEDIUM,
        description="Question difficulty.",
    )

    count: int = Field(
        default=10,
        ge=1,
        le=50,
        description="Number of questions to generate.",
    )


class GeneratedQuestion(BaseModel):
    """Single generated question."""

    question: str

    difficulty: QuestionDifficulty

    topic: str


class QuestionGeneratorResponse(BaseModel):
    """Question generation response."""

    questions: list[GeneratedQuestion]


# =============================================================
# Feature 7 — Explain Difficult Topics
# =============================================================

class ExplanationLevel(str, Enum):
    """Explanation audience levels."""

    BEGINNER = "beginner"
    SCHOOL_STUDENT = "school_student"
    COLLEGE_STUDENT = "college_student"
    EXAM_PREPARATION = "exam_preparation"
    TECHNICAL = "technical"
    WITH_EXAMPLE = "with_example"
    LIKE_IM_FIVE = "like_im_five"


class ExplainTopicRequest(BaseModel):
    """Difficult-topic explanation request."""

    text: str = Field(
        ...,
        min_length=1,
        description="Topic or concept to explain.",
    )

    level: ExplanationLevel = Field(
        default=ExplanationLevel.COLLEGE_STUDENT,
        description="Target learner level.",
    )


class ExplainTopicResponse(BaseModel):
    """Structured topic explanation."""

    topic: str

    level: ExplanationLevel

    explanation: str

    example: str

    key_points: list[str]


# =============================================================
# Feature 8 — Translation
# =============================================================

class TranslationRequest(BaseModel):
    """Translation request."""

    text: str = Field(
        ...,
        min_length=1,
        description="Text to translate.",
    )

    target_language: str = Field(
        ...,
        min_length=1,
        description="Target language.",
    )


class TranslationResponse(BaseModel):
    """Translation response."""

    source_language: str

    target_language: str

    translated_text: str


# =============================================================
# Feature 9 — Presentation
# =============================================================

class PresentationRequest(BaseModel):
    """Presentation generation request."""

    text: str = Field(
        ...,
        min_length=1,
        description="Notes to convert into a presentation.",
    )


class PresentationSlide(BaseModel):
    """Single presentation slide."""

    title: str

    content: list[str]


class PresentationResponse(BaseModel):
    """Structured presentation plan."""

    title: str

    slides: list[PresentationSlide]


# =============================================================
# Feature 10 — Markdown
# =============================================================

class MarkdownRequest(BaseModel):
    """Markdown conversion request."""

    text: str = Field(
        ...,
        min_length=1,
        description="Notes to convert into Markdown.",
    )


class MarkdownResponse(BaseModel):
    """Markdown conversion response."""

    markdown: str