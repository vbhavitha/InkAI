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

def summarize_prompt(text: str, length: str) -> str:
    """
    Generate a structured summary with key points.

    Supported lengths:
    - one_sentence
    - short
    - medium
    - detailed
    - exam_revision
    """

    length_instructions = {
        "one_sentence": (
            "Summarize the content in exactly ONE clear sentence."
        ),
        "short": (
            "Provide a short summary in 2-4 sentences."
        ),
        "medium": (
            "Provide a medium-length summary covering the main ideas "
            "without unnecessary details."
        ),
        "detailed": (
            "Provide a detailed summary covering the important concepts, "
            "relationships, explanations, and supporting details."
        ),
        "exam_revision": (
            "Create an exam-oriented revision summary. Focus on definitions, "
            "important concepts, facts, relationships, formulas, processes, "
            "and points that are useful for exam preparation."
        ),
    }

    instruction = length_instructions.get(
        length,
        length_instructions["short"],
    )

    return f"""
You are an expert academic summarization assistant for InkAI.

Summarize the following notes.

SUMMARY MODE:
{instruction}

IMPORTANT RULES:
1. Preserve the original meaning.
2. Do not invent facts.
3. Do not add information that is not present in the input.
4. Identify the most important ideas.
5. Return ONLY valid JSON.
6. Do not use Markdown code fences.
7. The JSON must contain exactly these fields:
   - "summary"
   - "key_points"
8. "summary" must be a string.
9. "key_points" must be an array of concise strings.
10. Return at least 3 key points when the source contains enough information.

EXPECTED FORMAT:
{{
    "summary": "Your summary here.",
    "key_points": [
        "Important point 1",
        "Important point 2",
        "Important point 3"
    ]
}}

TEXT TO SUMMARIZE:
{text}
""".strip()


def flashcards_prompt(text: str) -> str:
    """
    Generate study flashcards from notes.
    """

    return f"""
You are an expert educational flashcard generator for InkAI.

Create useful study flashcards from the following notes.

IMPORTANT RULES:
1. Use ONLY information present in the supplied text.
2. Do not invent facts.
3. Cover the most important concepts.
4. Questions should test understanding rather than simply copy sentences.
5. Answers should be concise but complete.
6. Generate between 5 and 20 flashcards depending on the amount of content.
7. Each flashcard must contain exactly:
   - "question"
   - "answer"
8. Return ONLY valid JSON.
9. Do not use Markdown.
10. Do not wrap the JSON in ```json or ```.

EXPECTED FORMAT:
{{
    "flashcards": [
        {{
            "question": "What is TCP?",
            "answer": "TCP is a connection-oriented transport protocol."
        }},
        {{
            "question": "What is UDP?",
            "answer": "UDP is a connectionless transport protocol."
        }}
    ]
}}

NOTES:
{text}
""".strip()