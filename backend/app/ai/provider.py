"""
AI provider abstraction for InkAI.

The rest of the application should communicate with the
AI provider through this module rather than calling the
provider SDK directly.
"""

from __future__ import annotations

from abc import ABC, abstractmethod

from google import genai

from app.config.settings import settings


class AIProvider(ABC):
    """Base interface for AI providers."""

    @abstractmethod
    def generate(self, prompt: str) -> str:
        """Generate a response from the AI provider."""
        raise NotImplementedError


class GeminiProvider(AIProvider):
    """Google Gemini implementation using the current GenAI SDK."""

    def __init__(self) -> None:
        if not settings.AI_API_KEY:
            raise ValueError(
                "AI_API_KEY is not configured."
            )

        if not settings.AI_MODEL:
            raise ValueError(
                "AI_MODEL is not configured."
            )

        self.client = genai.Client(
            api_key=settings.AI_API_KEY
        )

        self.model = settings.AI_MODEL

    def generate(self, prompt: str) -> str:
        """Generate text using Gemini."""

        response = self.client.models.generate_content(
            model=self.model,
            contents=prompt,
        )

        if not response.text:
            raise ValueError(
                "AI provider returned an empty response."
            )

        return response.text


def get_ai_provider() -> AIProvider:
    """
    Return the configured AI provider.

    This keeps provider selection outside API routes.
    """

    provider = settings.AI_PROVIDER.lower()

    if provider == "gemini":
        return GeminiProvider()

    raise ValueError(
        f"Unsupported AI provider: {settings.AI_PROVIDER}"
    )