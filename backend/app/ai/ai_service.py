"""
AI service layer for InkAI.

The API layer communicates with this service instead of
calling the AI provider directly.
"""

from app.ai.parser import parse_ai_response
from app.ai.provider import AIProvider
from app.ai.prompts import build_ai_prompt


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
        Generate an AI response.
        """

        prompt = build_ai_prompt(
            instruction=instruction,
            context=context,
        )

        response = self.provider.generate(prompt)

        return parse_ai_response(response)


ai_service = AIService()