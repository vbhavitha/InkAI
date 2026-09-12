"""
Prompt definitions for InkAI AI features.

Keep all AI prompts in this module instead of scattering
prompt text throughout API routes and services.
"""


def grammar_prompt(text: str) -> str:
    """
    Correct grammar, spelling, punctuation, and sentence structure.
    """

    return f"""
You are a professional grammar correction assistant.

Correct the grammar, spelling, punctuation,
and sentence structure of the following notes.

Preserve the original meaning.

Do not add new information.

Return only the corrected text.

NOTES:
{text}
""".strip()


def rewrite_prompt(text: str) -> str:
    """
    Rewrite notes for better clarity and structure.
    """

    return f"""
Rewrite the following notes so they are clear,
well-structured, and easy for a student to understand.

Preserve all important information.

Do not introduce information that is not present
in the original notes.

Return only the rewritten text.

NOTES:
{text}
""".strip()


def summarize_prompt(text: str) -> str:
    """
    Generate a concise summary of notes.
    """

    return f"""
Summarize the following notes.

Extract the most important concepts,
definitions, and key points.

Do not introduce information that is not present
in the original notes.

Return only the summary.

NOTES:
{text}
""".strip()


def build_ai_prompt(
    instruction: str,
    context: str | None = None,
) -> str:
    """
    Build a general-purpose InkAI prompt.
    """

    parts = [
        "You are an AI assistant for InkAI.",
        "Provide accurate, clear, and useful responses.",
        "",
        f"INSTRUCTION:\n{instruction}",
    ]

    if context:
        parts.extend(
            [
                "",
                f"CONTEXT:\n{context}",
            ]
        )

    return "\n".join(parts)