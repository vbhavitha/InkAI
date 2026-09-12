"""
AI service layer for InkAI.

API routes should call this service instead of interacting
directly with an AI provider.
"""

from app.ai.parser import parse_ai_response
from app.ai.prompts import build_ai_prompt
from app.ai.provider import get_ai_provider


class AIService:
    """Application-level AI service."""

    def __init__(self) -> None:
        self.provider = get_ai_provider()

    def generate(
        self,
        instruction: str,
        context: str | None = None,
    ) -> str:
        """Generate an AI response."""

        prompt = build_ai_prompt(
            instruction=instruction,
            context=context,
        )

        raw_response = self.provider.generate(prompt)

        return parse_ai_response(raw_response)


ai_service = AIService()