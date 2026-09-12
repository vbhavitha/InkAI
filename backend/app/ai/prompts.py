"""
Prompt construction for InkAI AI features.
"""


def build_ai_prompt(
    instruction: str,
    context: str | None = None,
) -> str:
    """
    Build a consistent prompt for InkAI.
    """

    parts = [
        "You are an AI assistant for InkAI.",
        "Provide accurate, clear, and useful responses.",
        "",
        f"Instruction:\n{instruction}",
    ]

    if context:
        parts.extend(
            [
                "",
                f"Context:\n{context}",
            ]
        )

    return "\n".join(parts)