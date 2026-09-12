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

def grammar_prompt(text: str) -> str:
    """
    Build a prompt for grammar correction.
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

def rewrite_prompt(
    text: str,
    style: str = "simple",
) -> str:
    """
    Build a prompt for rewriting notes according to
    the selected writing style.
    """

    style_instructions = {
        "simple": """
Rewrite the notes using simple and easy-to-understand
language.

Keep the original meaning and important information.
""",

        "professional": """
Rewrite the notes in a professional and polished style.

Use clear and precise language.
Keep all important information.
""",

        "academic": """
Rewrite the notes in a formal academic style.

Use appropriate academic language and structure.
Preserve all important concepts and information.
""",

        "exam_notes": """
Rewrite the notes as concise student exam notes.

Use:
- Clear headings
- Bullet points
- Important keywords
- Short explanations
- Definitions where appropriate

Make the result easy to revise before an examination.

Do not remove important information.
""",

        "detailed": """
Rewrite the notes in a detailed and well-structured way.

Expand explanations only when necessary for clarity.
Do not introduce unrelated information.
""",

        "concise": """
Rewrite the notes in a concise form.

Remove unnecessary repetition while preserving
all important information and concepts.
""",
    }

    selected_instruction = style_instructions.get(
        style.lower(),
        style_instructions["simple"],
    )

    return f"""
You are an AI note-rewriting assistant for InkAI.

{selected_instruction}

Return only the rewritten notes.

NOTES:
{text}
""".strip()