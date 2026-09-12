"""
AI response parsing utilities.
"""


def parse_ai_response(response: str) -> str:
    """
    Normalize an AI response before returning it to the client.
    """

    if not response:
        raise ValueError(
            "AI response cannot be empty."
        )

    return response.strip()