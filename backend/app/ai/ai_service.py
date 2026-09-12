"""
AI service layer for InkAI.

API routes communicate with this service instead of
calling the AI provider directly.
"""

from app.ai.parser import parse_ai_response
from app.ai.provider import AIProvider
from app.ai.prompts import (
    build_ai_prompt,
    grammar_prompt,
    rewrite_prompt,
)

from .prompts import (
    grammar_prompt,
    rewrite_prompt,
    summarize_prompt,
    flashcards_prompt,
    mcq_prompt,
    question_generator_prompt,
    explain_topic_prompt,
    translate_prompt,
    presentation_planner_prompt,
    markdown_prompt,
)


class AIService:
    """Application-level AI service."""

    def __init__(self):
        self.provider = AIProvider()

    def generate(
        self,
        instruction: str,
        context: str | None = None,
    ) -> str:
        """
        Generate a general AI response.
        """

        prompt = build_ai_prompt(
            instruction=instruction,
            context=context,
        )

        response = self.provider.generate(prompt)

        return parse_ai_response(response)

    def correct_grammar(
        self,
        text: str,
    ) -> str:
        """
        Correct grammar, spelling, punctuation,
        and sentence structure.
        """

        prompt = grammar_prompt(text)

        response = self.provider.generate(prompt)

        return parse_ai_response(response)

    def rewrite_notes(
        self,
        text: str,
        style: str = "simple",
    ) -> str:
        """
        Rewrite notes according to the selected style.
        """

        prompt = rewrite_prompt(
            text=text,
            style=style,
        )

        response = self.provider.generate(prompt)

        return parse_ai_response(response)

    def summarize_notes(
        self,
        text: str,
        length: str = "short",
    ):
        """
        Generate a structured summary from notes.
        """

        if not text or not text.strip():
            raise ValueError("Text is required.")

        prompt = summarize_prompt(
            text=text.strip(),
            length=length,
        )

        raw_response = self.generate(
            prompt
        )

        parsed_response = self.parse_ai_response(
            raw_response
        )

        return {
            "summary": parsed_response.get(
                "summary",
                "",
            ),
            "key_points": parsed_response.get(
                "key_points",
                [],
            ),
        }

    def generate_flashcards(
        self,
        text: str,
    ):
        """
        Generate structured flashcards from notes.
        """

        if not text or not text.strip():
            raise ValueError("Text is required.")

        prompt = flashcards_prompt(
            text=text.strip()
        )

        raw_response = self.generate(
            prompt
        )

        parsed_response = self.parse_ai_response(
            raw_response
        )

        return {
            "flashcards": parsed_response.get(
                "flashcards",
                [],
            ),
        }

    def generate_mcqs(
        self,
        text: str,
        count: int = 10,
        difficulty: str = "medium",
    ):
        """
        Generate structured multiple-choice questions.
        """

        if not text or not text.strip():
            raise ValueError("Text is required.")

        prompt = mcq_prompt(
            text=text.strip(),
            count=count,
            difficulty=difficulty,
        )

        raw_response = self.generate(prompt)

        parsed_response = self.parse_ai_response(
            raw_response
        )

        questions = parsed_response.get(
            "questions",
            [],
        )

        return {
            "questions": questions,
        }

    def generate_questions(
        self,
        text: str,
        question_type: str = "exam",
        difficulty: str = "medium",
        count: int = 10,
    ):
        """
        Generate structured non-MCQ questions.
        """

        if not text or not text.strip():
            raise ValueError("Text is required.")

        prompt = question_generator_prompt(
            text=text.strip(),
            question_type=question_type,
            difficulty=difficulty,
            count=count,
        )

        raw_response = self.generate(prompt)

        parsed_response = self.parse_ai_response(
            raw_response
        )

        questions = parsed_response.get(
            "questions",
            [],
        )

        return {
            "questions": questions,
        }

    def explain_topic(
        self,
        text: str,
        level: str = "beginner",
    ):
        if not text or not text.strip():
            raise ValueError("Topic is required.")

        prompt = explain_topic_prompt(
            text=text.strip(),
            level=level,
        )

        raw_response = self.generate(prompt)

        parsed_response = self.parse_ai_response(
            raw_response
        )

        return {
            "title": parsed_response.get(
                "title",
                text.strip(),
            ),
            "explanation": parsed_response.get(
                "explanation",
                "",
            ),
            "key_points": parsed_response.get(
                "key_points",
                [],
            ),
            "example": parsed_response.get(
                "example",
                "",
            ),
            "analogy": parsed_response.get(
                "analogy",
                "",
            ),
        }

    def translate_text(
        self,
        text: str,
        target_language: str,
    ):
        if not text or not text.strip():
            raise ValueError("Text is required.")

        if not target_language or not target_language.strip():
            raise ValueError(
                "Target language is required."
            )

        prompt = translate_prompt(
            text=text.strip(),
            target_language=target_language.strip(),
        )

        raw_response = self.generate(prompt)

        parsed_response = self.parse_ai_response(
            raw_response
        )

        return {
            "source_language": parsed_response.get(
                "source_language",
                "Unknown",
            ),
            "target_language": parsed_response.get(
                "target_language",
                target_language.strip(),
            ),
            "translated_text": parsed_response.get(
                "translated_text",
                "",
            ),
        }

    def create_presentation_plan(
        self,
        text: str,
        title: str = "",
    ):
        if not text or not text.strip():
            raise ValueError("Notes are required.")

        prompt = presentation_planner_prompt(
            text=text.strip(),
            title=title.strip(),
        )

        raw_response = self.generate(prompt)

        parsed_response = self.parse_ai_response(
            raw_response
        )

        return {
            "title": parsed_response.get(
                "title",
                title.strip() or "InkAI Presentation",
            ),
            "slides": parsed_response.get(
                "slides",
                [],
            ),
        }

    def convert_to_markdown(
        self,
        text: str,
    ):
        if not text or not text.strip():
            raise ValueError("Text is required.")

        prompt = markdown_prompt(
            text=text.strip()
        )

        raw_response = self.generate(prompt)

        return {
            "markdown": raw_response.strip()
        }


ai_service = AIService()