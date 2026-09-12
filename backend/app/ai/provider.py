"""
AI provider abstraction for InkAI.

This module keeps provider-specific SDK code isolated from
the API and AI service layers.
"""

from google import genai

from app.config.settings import settings


class AIProvider:
    """Central AI provider for InkAI."""

    def __init__(self):
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

    def generate(self, prompt: str) -> str:
        """
        Generate a response from the configured AI model.
        """

        response = self.client.models.generate_content(
            model=settings.AI_MODEL,
            contents=prompt,
        )

        if not response.text:
            raise ValueError(
                "AI provider returned an empty response."
            )

        return response.text.strip()