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

def mcq_prompt(
    text: str,
    count: int = 10,
    difficulty: str = "medium",
) -> str:
    """
    Generate multiple-choice questions from notes.
    """

    return f"""
You are an expert exam question generator for InkAI.

Generate {count} multiple-choice questions from the following notes.

DIFFICULTY:
{difficulty}

IMPORTANT RULES:
1. Use ONLY information present in the supplied notes.
2. Do not invent facts.
3. Questions must test understanding of the source material.
4. Each question must have exactly 4 options.
5. There must be exactly ONE correct answer.
6. The correct answer must exactly match one of the options.
7. Provide a short explanation for the correct answer.
8. Avoid duplicate questions.
9. Keep the questions clear and suitable for students.
10. Return ONLY valid JSON.
11. Do not use Markdown.
12. Do not wrap the response in ```json or ```.

EXPECTED FORMAT:

{{
    "questions": [
        {{
            "question": "Which protocol is connection-oriented?",
            "options": [
                "UDP",
                "TCP",
                "IP",
                "ICMP"
            ],
            "answer": "TCP",
            "explanation": "TCP establishes a connection before data transmission."
        }}
    ]
}}

NOTES:
{text}
""".strip()

def question_generator_prompt(
    text: str,
    question_type: str = "exam",
    difficulty: str = "medium",
    count: int = 10,
) -> str:
    """
    Generate non-MCQ questions from notes.
    """

    type_instructions = {
        "very_short": (
            "Generate very short-answer questions that can usually "
            "be answered in one or two sentences."
        ),

        "short": (
            "Generate short-answer questions that require concise "
            "explanations or definitions."
        ),

        "long": (
            "Generate long-answer questions requiring detailed "
            "explanations, comparisons, processes, or examples."
        ),

        "important": (
            "Generate the most important questions a student should "
            "prepare from the supplied notes."
        ),

        "exam": (
            "Generate exam-oriented questions that are likely to test "
            "important concepts from the supplied notes."
        ),

        "viva": (
            "Generate viva questions suitable for an oral examination. "
            "Focus on concepts, definitions, reasoning, and understanding."
        ),
    }

    instruction = type_instructions.get(
        question_type,
        type_instructions["exam"],
    )

    return f"""
You are an expert academic question generator for InkAI.

Generate {count} questions from the following notes.

QUESTION TYPE:
{question_type}

DIFFICULTY:
{difficulty}

QUESTION STYLE:
{instruction}

IMPORTANT RULES:
1. Use ONLY information present in the supplied notes.
2. Do not invent facts.
3. Do not generate multiple-choice questions.
4. Questions should require the student to formulate their own answer.
5. Avoid duplicate questions.
6. Cover different important topics from the notes.
7. Assign an appropriate topic to every question.
8. The difficulty must be one of:
   - easy
   - medium
   - hard
9. Return ONLY valid JSON.
10. Do not use Markdown.
11. Do not wrap the response in ```json or ```.

EXPECTED FORMAT:

{{
    "questions": [
        {{
            "question": "Explain the working of TCP.",
            "difficulty": "medium",
            "topic": "TCP"
        }}
    ]
}}

NOTES:
{text}
""".strip()

def explain_topic_prompt(
    text: str,
    level: str = "beginner",
) -> str:
    level_instructions = {
        "beginner": (
            "Explain using simple language for someone with little "
            "prior knowledge."
        ),
        "school_student": (
            "Explain at a school-student level using simple terminology "
            "and relatable examples."
        ),
        "college_student": (
            "Explain at a college-student level with appropriate "
            "technical terminology."
        ),
        "exam_preparation": (
            "Explain for exam preparation. Focus on definitions, "
            "important concepts, keywords, processes, and facts."
        ),
        "technical": (
            "Provide a technically detailed explanation including "
            "important technical terminology and how the concept works."
        ),
        "with_example": (
            "Explain clearly and provide a practical example."
        ),
        "like_im_five": (
            "Explain as if teaching a five-year-old using extremely "
            "simple language and familiar analogies."
        ),
    }

    instruction = level_instructions.get(
        level,
        level_instructions["beginner"],
    )

    return f"""
You are InkAI, an expert educational AI assistant.

TOPIC:
{text}

LEVEL:
{level}

INSTRUCTIONS:
{instruction}

Return ONLY valid JSON.

Do not use Markdown code fences.

Return exactly:

{{
    "title": "Topic title",
    "explanation": "Clear explanation.",
    "key_points": [
        "Important point 1",
        "Important point 2",
        "Important point 3"
    ],
    "example": "",
    "analogy": ""
}}

Rules:
- Do not invent facts.
- Do not add unrelated information.
- Preserve technical accuracy.
- example should contain a practical example when useful.
- analogy should contain an analogy when useful.
""".strip()

def translate_prompt(
    text: str,
    target_language: str,
) -> str:
    return f"""
You are InkAI's professional translation assistant.

Translate the following text into:

TARGET LANGUAGE:
{target_language}

TEXT:
{text}

IMPORTANT RULES:
1. Preserve the original meaning.
2. Do not summarize.
3. Do not add information.
4. Do not remove information.
5. Preserve names, numbers, formulas, abbreviations,
   and technical terms where appropriate.
6. Produce natural translation.
7. Return ONLY valid JSON.
8. Do not use Markdown code fences.

Return exactly:

{{
    "source_language": "Detected source language",
    "target_language": "{target_language}",
    "translated_text": "Translated text"
}}
""".strip()

def presentation_planner_prompt(
    text: str,
    title: str = "",
) -> str:
    return f"""
You are InkAI's presentation planning assistant.

Convert the following notes into a structured educational
PowerPoint presentation.

TITLE:
{title}

NOTES:
{text}

IMPORTANT RULES:
1. Use ONLY information contained in the notes.
2. Do not invent facts.
3. Organize the material logically.
4. Create a clear title.
5. Create between 3 and 15 slides depending on content length.
6. Each slide must have a concise title.
7. Each slide should contain 2-6 concise content points.
8. Avoid putting paragraphs into slides.
9. Keep slides suitable for classroom or academic presentations.
10. Return ONLY valid JSON.
11. Do not use Markdown code fences.

EXPECTED FORMAT:

{{
    "title": "Machine Learning",
    "slides": [
        {{
            "title": "Introduction",
            "content": [
                "Definition of Machine Learning",
                "Relationship with Artificial Intelligence"
            ]
        }},
        {{
            "title": "Types of Machine Learning",
            "content": [
                "Supervised Learning",
                "Unsupervised Learning",
                "Reinforcement Learning"
            ]
        }}
    ]
}}
""".strip()

def markdown_prompt(
    text: str,
) -> str:
    return f"""
You are InkAI's Markdown formatting assistant.

Convert the following notes into clean Markdown.

IMPORTANT RULES:
1. Preserve the original meaning.
2. Do not add information.
3. Do not summarize.
4. Organize headings logically.
5. Use Markdown headings.
6. Use numbered lists where appropriate.
7. Use bullet lists where appropriate.
8. Preserve code, formulas, terminology, and important formatting.
9. Return ONLY the Markdown content.
10. Do not wrap the result in ```markdown.

NOTES:
{text}
""".strip()