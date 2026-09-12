"""
Pydantic schemas for InkAI AI features.
"""

from typing import Literal

from pydantic import BaseModel, Field

from enum import Enum
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

class SummaryLength(str, Enum):
    ONE_SENTENCE = "one_sentence"
    SHORT = "short"
    MEDIUM = "medium"
    DETAILED = "detailed"
    EXAM_REVISION = "exam_revision"


class SummarizeRequest(BaseModel):
    text: str = Field(
        ...,
        min_length=1,
        description="Text to summarize",
    )

    length: SummaryLength = Field(
        default=SummaryLength.SHORT,
        description="Summary length/mode",
    )


class SummarizeResponse(BaseModel):
    summary: str

    key_points: list[str]


class FlashcardsRequest(BaseModel):
    text: str = Field(
        ...,
        min_length=1,
        description="Notes used to generate flashcards",
    )


class Flashcard(BaseModel):
    question: str

    answer: str


class FlashcardsResponse(BaseModel):
    flashcards: list[Flashcard]

class MCQDifficulty(str, Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"


class MCQRequest(BaseModel):
    text: str = Field(
        ...,
        min_length=1,
        description="Notes used to generate MCQs",
    )

    count: int = Field(
        default=10,
        ge=1,
        le=50,
        description="Number of MCQs to generate",
    )

    difficulty: MCQDifficulty = Field(
        default=MCQDifficulty.MEDIUM,
        description="MCQ difficulty",
    )


class MCQQuestion(BaseModel):
    question: str

    options: list[str] = Field(
        ...,
        min_length=4,
        max_length=4,
    )

    answer: str

    explanation: str


class MCQResponse(BaseModel):
    questions: list[MCQQuestion]

class QuestionType(str, Enum):
    VERY_SHORT = "very_short"
    SHORT = "short"
    LONG = "long"
    IMPORTANT = "important"
    EXAM = "exam"
    VIVA = "viva"


class QuestionDifficulty(str, Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"


class QuestionGeneratorRequest(BaseModel):
    text: str = Field(
        ...,
        min_length=1,
        description="Notes used to generate questions",
    )

    type: QuestionType = Field(
        default=QuestionType.EXAM,
        description="Type of question to generate",
    )

    difficulty: QuestionDifficulty = Field(
        default=QuestionDifficulty.MEDIUM,
        description="Question difficulty",
    )

    count: int = Field(
        default=10,
        ge=1,
        le=50,
        description="Number of questions to generate",
    )


class GeneratedQuestion(BaseModel):
    question: str

    difficulty: QuestionDifficulty

    topic: str


class QuestionGeneratorResponse(BaseModel):
    questions: list[GeneratedQuestion]

class ExplanationLevel(str, Enum):
    BEGINNER = "beginner"
    SCHOOL_STUDENT = "school_student"
    COLLEGE_STUDENT = "college_student"
    EXAM_PREPARATION = "exam_preparation"
    TECHNICAL = "technical"
    WITH_EXAMPLE = "with_example"
    LIKE_IM_FIVE = "like_im_five"


class ExplainTopicRequest(BaseModel):
    text: str = Field(
        ...,
        min_length=1,
    )

    level: ExplanationLevel = (
        ExplanationLevel.BEGINNER
    )


class ExplainTopicResponse(BaseModel):
    title: str

    explanation: str

    key_points: list[str]

    example: str = ""

    analogy: str = ""

class TranslationRequest(BaseModel):
    text: str = Field(
        ...,
        min_length=1,
    )

    target_language: str = Field(
        ...,
        min_length=1,
        max_length=50,
    )


class TranslationResponse(BaseModel):
    source_language: str

    target_language: str

    translated_text: str

class PresentationSlide(BaseModel):
    title: str

    content: list[str]


class PresentationRequest(BaseModel):
    text: str = Field(
        ...,
        min_length=1,
    )

    title: str = ""


class PresentationPlanResponse(BaseModel):
    title: str

    slides: list[PresentationSlide]

class MarkdownRequest(BaseModel):
    text: str = Field(
        ...,
        min_length=1,
    )


class MarkdownResponse(BaseModel):
    markdown: str