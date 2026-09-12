"""
Central AI service layer for InkAI.

All AI features should communicate with the AI provider
through this service.

Flow:

Prompt
   ↓
AIProvider
   ↓
AI response
   ↓
Parser
   ↓
Validated result
"""

from typing import Any

from app.ai.parser import parse_ai_response
from app.ai.provider import AIProvider
from app.ai.prompts import (
    build_ai_prompt,
    grammar_prompt,
    rewrite_prompt,
    summarize_prompt,
    flashcards_prompt,
    mcq_prompt,
    question_generator_prompt,
)


class AIService:
    """
    Central service responsible for all AI operations.

    API routes should call AIService instead of communicating
    directly with AIProvider.
    """

    def __init__(self):
        self.provider = AIProvider()

    # ---------------------------------------------------------
    # Internal helpers
    # ---------------------------------------------------------

    @staticmethod
    def _validate_text(text: str) -> str:
        """
        Validate and normalize input text.
        """
        if not text or not text.strip():
            raise ValueError("Text is required.")

        return text.strip()

    def _generate(self, prompt: str) -> str:
        """
        Send a prompt to the AI provider and parse the response.
        """
        raw_response = self.provider.generate(prompt)

        return parse_ai_response(raw_response)

    def _generate_structured(self, prompt: str) -> Any:
        """
        Generate and parse a structured AI response.

        The parser is responsible for converting the AI response
        into a Python object when the model returns JSON.
        """
        raw_response = self.provider.generate(prompt)

        return parse_ai_response(raw_response)

    # ---------------------------------------------------------
    # Generic AI
    # ---------------------------------------------------------

    def generate(
        self,
        instruction: str,
        context: str | None = None,
    ) -> str:
        """
        Generate a general AI response.
        """
        instruction = self._validate_text(instruction)

        prompt = build_ai_prompt(
            instruction=instruction,
            context=context,
        )

        return self._generate(prompt)

    # ---------------------------------------------------------
    # Feature 1 — Grammar Correction
    # ---------------------------------------------------------

    def grammar_correct(self, text: str) -> str:
        """
        Correct grammar, spelling, punctuation,
        and sentence structure.
        """
        text = self._validate_text(text)

        prompt = grammar_prompt(text)

        return self._generate(prompt)

    # Backward-compatible name used by the existing API.
    def correct_grammar(self, text: str) -> str:
        return self.grammar_correct(text)

    # ---------------------------------------------------------
    # Feature 2 — Rewrite Notes
    # ---------------------------------------------------------

    def rewrite(
        self,
        text: str,
        style: str = "simple",
    ) -> str:
        """
        Rewrite notes using the requested style.
        """
        text = self._validate_text(text)

        prompt = rewrite_prompt(
            text=text,
            style=style,
        )

        return self._generate(prompt)

    # Backward-compatible name used by the existing API.
    def rewrite_notes(
        self,
        text: str,
        style: str = "simple",
    ) -> str:
        return self.rewrite(text, style)

    # ---------------------------------------------------------
    # Feature 3 — Summarization
    # ---------------------------------------------------------

    def summarize(
        self,
        text: str,
        length: str = "short",
    ) -> dict:
        """
        Generate a structured summary.
        """
        text = self._validate_text(text)

        prompt = summarize_prompt(
            text=text,
            length=length,
        )

        result = self._generate_structured(prompt)

        if not isinstance(result, dict):
            raise ValueError(
                "AI summary response must be a JSON object."
            )

        return {
            "summary": result.get("summary", ""),
            "key_points": result.get("key_points", []),
        }

    # Backward-compatible name.
    def summarize_notes(
        self,
        text: str,
        length: str = "short",
    ) -> dict:
        return self.summarize(text, length)

    # ---------------------------------------------------------
    # Feature 4 — Flashcards
    # ---------------------------------------------------------

    def generate_flashcards(
        self,
        text: str,
        count: int = 10,
    ) -> dict:
        """
        Generate structured flashcards.
        """
        text = self._validate_text(text)

        prompt = flashcards_prompt(
            text=text,
            count=count,
        )

        result = self._generate_structured(prompt)

        if not isinstance(result, dict):
            raise ValueError(
                "AI flashcard response must be a JSON object."
            )

        return {
            "flashcards": result.get("flashcards", []),
        }

    # ---------------------------------------------------------
    # Feature 5 — MCQs
    # ---------------------------------------------------------

    def generate_mcqs(
        self,
        text: str,
        count: int = 10,
        difficulty: str = "medium",
    ) -> dict:
        """
        Generate structured multiple-choice questions.
        """
        text = self._validate_text(text)

        prompt = mcq_prompt(
            text=text,
            count=count,
            difficulty=difficulty,
        )

        result = self._generate_structured(prompt)

        if not isinstance(result, dict):
            raise ValueError(
                "AI MCQ response must be a JSON object."
            )

        return {
            "questions": result.get("questions", []),
        }

    # ---------------------------------------------------------
    # Feature 6 — Question Generation
    # ---------------------------------------------------------

    def generate_questions(
        self,
        text: str,
        count: int = 10,
        question_type: str = "exam",
        difficulty: str = "medium",
    ) -> dict:
        """
        Generate structured questions.
        """
        text = self._validate_text(text)

        prompt = question_generator_prompt(
            text=text,
            question_type=question_type,
            difficulty=difficulty,
            count=count,
        )

        result = self._generate_structured(prompt)

        if not isinstance(result, dict):
            raise ValueError(
                "AI question response must be a JSON object."
            )

        return {
            "questions": result.get("questions", []),
        }

    # ---------------------------------------------------------
    # Feature 7 — Explain Difficult Topics
    # ---------------------------------------------------------

    def explain_topic(
        self,
        text: str,
        level: str = "college_student",
    ) -> dict:
        """
        Explain a difficult topic according to the
        selected learner level.
        """

        text = self._validate_text(text)

        prompt = f"""
You are an educational AI assistant.

Explain the following topic for the requested audience level.

LEVEL:
{level}

TOPIC:
{text}

Requirements:

1. Explain the concept clearly.
2. Preserve technical accuracy.
3. Use simple language where appropriate.
4. Include a useful example when possible.
5. Do not invent unrelated information.
6. Structure the response for easy study.

Return valid JSON in exactly this structure:

{{
    "topic": "topic name",
    "level": "{level}",
    "explanation": "clear explanation",
    "example": "simple example",
    "key_points": [
        "key point 1",
        "key point 2"
    ]
}}
""".strip()

        result = self._generate_structured(prompt)

        if not isinstance(result, dict):
            raise ValueError(
                "AI explanation response must be a JSON object."
            )

        return {
            "topic": result.get("topic", text),
            "level": result.get("level", level),
            "explanation": result.get("explanation", ""),
            "example": result.get("example", ""),
            "key_points": result.get("key_points", []),
        }

    # ---------------------------------------------------------
    # Feature 8 — Translation
    # ---------------------------------------------------------

    def translate(
        self,
        text: str,
        language: str,
    ) -> dict:
        """
        Translate notes into the requested language.

        The original text is never modified here.
        The frontend can preview the translation and allow
        the user to accept or reject it.
        """

        text = self._validate_text(text)

        language = self._validate_text(language)

        prompt = f"""
You are a professional translation assistant.

Translate the following educational notes into:

TARGET LANGUAGE:
{language}

ORIGINAL TEXT:
{text}

Requirements:

1. Preserve the original meaning.
2. Do not add unrelated information.
3. Preserve headings, lists, numbering, and structure where possible.
4. Use natural language in the target language.
5. Return valid JSON only.

Return exactly:

{{
    "source_language": "detected source language",
    "target_language": "{language}",
    "translated_text": "translated content"
}}
""".strip()

        result = self._generate_structured(prompt)

        if not isinstance(result, dict):
            raise ValueError(
                "AI translation response must be a JSON object."
            )

        return {
            "source_language": result.get(
                "source_language",
                "unknown",
            ),
            "target_language": result.get(
                "target_language",
                language,
            ),
            "translated_text": result.get(
                "translated_text",
                "",
            ),
        }

    # ---------------------------------------------------------
    # Feature 9 — Presentation Planning
    # ---------------------------------------------------------

    def generate_presentation(
        self,
        text: str,
    ) -> dict:
        """
        Generate a structured presentation plan.

        This method creates the AI-generated presentation
        structure. The actual .pptx rendering should remain
        inside the presentation module.
        """

        text = self._validate_text(text)

        prompt = f"""
You are an expert educational presentation planner.

Convert the following notes into a well-structured
presentation.

NOTES:
{text}

Requirements:

1. Create a clear presentation title.
2. Organize the content into logical slides.
3. Each slide should have a title.
4. Each slide should contain concise bullet points.
5. Preserve important information from the notes.
6. Do not invent unrelated facts.
7. Return valid JSON only.

Return exactly:

{{
    "title": "presentation title",
    "slides": [
        {{
            "title": "slide title",
            "content": [
                "bullet point 1",
                "bullet point 2"
            ]
        }}
    ]
}}
""".strip()

        result = self._generate_structured(prompt)

        if not isinstance(result, dict):
            raise ValueError(
                "AI presentation response must be a JSON object."
            )

        return {
            "title": result.get(
                "title",
                "Untitled Presentation",
            ),
            "slides": result.get(
                "slides",
                [],
            ),
        }

    # ---------------------------------------------------------
    # Feature 10 — Markdown Conversion
    # ---------------------------------------------------------

    def convert_to_markdown(
        self,
        text: str,
    ) -> str:
        """
        Convert notes into clean Markdown.
        """

        text = self._validate_text(text)

        prompt = f"""
Convert the following educational notes into clean,
well-structured Markdown.

NOTES:
{text}

Requirements:

1. Create an appropriate main heading.
2. Use ## and ### headings where appropriate.
3. Preserve numbered lists.
4. Preserve bullet lists.
5. Use bold text for important concepts where useful.
6. Do not add unrelated information.
7. Preserve the meaning of the original notes.
8. Return only Markdown.
""".strip()

        return self._generate(prompt)


# -------------------------------------------------------------
# Shared application instance
# -------------------------------------------------------------

ai_service = AIService()