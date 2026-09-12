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


ai_service = AIService()