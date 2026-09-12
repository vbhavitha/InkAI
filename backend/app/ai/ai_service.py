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


ai_service = AIService()