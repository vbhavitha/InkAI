"""
InkAI Ink Effects Engine
========================

Step 18
-------
Simulates subtle natural variation in handwriting ink:

- Slight opacity variation
- Slight stroke darkness variation
- Very subtle texture
- Deterministic output
- Readability-first limits

Step 19
-------
Provides a dedicated pencil mode:

- Lighter strokes
- Gray tones
- Slight opacity variation
- Very subtle pencil texture

IMPORTANT:
The effect must remain subtle.
It should make handwriting feel less digitally uniform,
not make the text noisy or difficult to read.
"""

from __future__ import annotations

from dataclasses import dataclass


# ============================================================
# SAFE INK LIMITS
# ============================================================

# Normal handwriting
MIN_OPACITY_MULTIPLIER = 0.94
MAX_OPACITY_MULTIPLIER = 1.04

MIN_DARKNESS_MULTIPLIER = 0.94
MAX_DARKNESS_MULTIPLIER = 1.04

MIN_TEXTURE = 0.0
MAX_TEXTURE = 0.08


# Pencil handwriting
PENCIL_MIN_OPACITY_MULTIPLIER = 0.88
PENCIL_MAX_OPACITY_MULTIPLIER = 0.98

PENCIL_MIN_DARKNESS_MULTIPLIER = 0.82
PENCIL_MAX_DARKNESS_MULTIPLIER = 0.94

PENCIL_MIN_TEXTURE = 0.02
PENCIL_MAX_TEXTURE = 0.10


# ============================================================
# DATA MODEL
# ============================================================

@dataclass(frozen=True)
class InkVariation:
    """
    Visual properties applied to one character or stroke.
    """

    opacity_multiplier: float
    darkness_multiplier: float
    texture_strength: float

    def to_dict(self) -> dict:
        return {
            "opacity_multiplier": self.opacity_multiplier,
            "darkness_multiplier": self.darkness_multiplier,
            "texture_strength": self.texture_strength,
        }


# ============================================================
# DETERMINISTIC HASH
# ============================================================

def deterministic_hash(value: str) -> int:
    """
    Deterministic FNV-1a hash.

    We intentionally avoid Python's built-in hash()
    because Python hash values may differ between processes.
    """

    hash_value = 2166136261

    for character in value:
        hash_value ^= ord(character)
        hash_value = (
            hash_value * 16777619
        ) & 0xFFFFFFFF

    return hash_value


# ============================================================
# DETERMINISTIC NORMALIZATION
# ============================================================

def normalized_value(seed: str) -> float:
    """
    Convert a deterministic seed into a value between 0 and 1.
    """

    hashed = deterministic_hash(seed)

    return hashed / 0xFFFFFFFF


# ============================================================
# RANGE MAPPING
# ============================================================

def seeded_value(
    seed: str,
    minimum: float,
    maximum: float,
) -> float:
    """
    Generate a deterministic floating-point value
    inside the requested range.
    """

    normalized = normalized_value(seed)

    return (
        minimum
        + normalized * (maximum - minimum)
    )


# ============================================================
# NORMAL INK
# ============================================================

def generate_ink_variation(
    document_id: str,
    page_number: int,
    character_index: int,
    enable_variation: bool = True,
) -> InkVariation:
    """
    Generate subtle deterministic ink variation.

    Seed:

        document_id
            +
        page_number
            +
        character_index

    This guarantees that the same document produces
    the same ink appearance every time.
    """

    if not enable_variation:
        return InkVariation(
            opacity_multiplier=1.0,
            darkness_multiplier=1.0,
            texture_strength=0.0,
        )

    base_seed = (
        f"{document_id}:"
        f"{page_number}:"
        f"{character_index}"
    )

    opacity = seeded_value(
        f"{base_seed}:opacity",
        MIN_OPACITY_MULTIPLIER,
        MAX_OPACITY_MULTIPLIER,
    )

    darkness = seeded_value(
        f"{base_seed}:darkness",
        MIN_DARKNESS_MULTIPLIER,
        MAX_DARKNESS_MULTIPLIER,
    )

    texture = seeded_value(
        f"{base_seed}:texture",
        MIN_TEXTURE,
        MAX_TEXTURE,
    )

    return InkVariation(
        opacity_multiplier=round(
            opacity,
            4,
        ),
        darkness_multiplier=round(
            darkness,
            4,
        ),
        texture_strength=round(
            texture,
            4,
        ),
    )


# ============================================================
# PENCIL MODE
# ============================================================

def generate_pencil_variation(
    document_id: str,
    page_number: int,
    character_index: int,
    enable_variation: bool = True,
) -> InkVariation:
    """
    Generate subtle pencil-specific variation.

    Pencil should appear:

    - lighter
    - slightly gray
    - less uniform
    - softly textured
    """

    if not enable_variation:
        return InkVariation(
            opacity_multiplier=0.94,
            darkness_multiplier=0.88,
            texture_strength=0.04,
        )

    base_seed = (
        f"{document_id}:"
        f"{page_number}:"
        f"{character_index}:pencil"
    )

    opacity = seeded_value(
        f"{base_seed}:opacity",
        PENCIL_MIN_OPACITY_MULTIPLIER,
        PENCIL_MAX_OPACITY_MULTIPLIER,
    )

    darkness = seeded_value(
        f"{base_seed}:darkness",
        PENCIL_MIN_DARKNESS_MULTIPLIER,
        PENCIL_MAX_DARKNESS_MULTIPLIER,
    )

    texture = seeded_value(
        f"{base_seed}:texture",
        PENCIL_MIN_TEXTURE,
        PENCIL_MAX_TEXTURE,
    )

    return InkVariation(
        opacity_multiplier=round(
            opacity,
            4,
        ),
        darkness_multiplier=round(
            darkness,
            4,
        ),
        texture_strength=round(
            texture,
            4,
        ),
    )


# ============================================================
# CHARACTER INK EFFECT
# ============================================================

def generate_character_ink_effect(
    document_id: str,
    page_number: int,
    character_index: int,
    ink_style: str = "blue",
    enable_variation: bool = True,
) -> dict:
    """
    Generate complete deterministic ink information
    for one character.
    """

    if ink_style == "pencil":
        variation = generate_pencil_variation(
            document_id=document_id,
            page_number=page_number,
            character_index=character_index,
            enable_variation=enable_variation,
        )
    else:
        variation = generate_ink_variation(
            document_id=document_id,
            page_number=page_number,
            character_index=character_index,
            enable_variation=enable_variation,
        )

    return {
        "ink_style": ink_style,
        **variation.to_dict(),
    }


# ============================================================
# TEXT INK EFFECTS
# ============================================================

def generate_text_ink_effects(
    text: str,
    document_id: str,
    page_number: int,
    ink_style: str = "blue",
    enable_variation: bool = True,
    start_character_index: int = 0,
) -> list[dict]:
    """
    Generate ink effects for every character.

    Spaces remain visually neutral because they do not
    contain visible ink.
    """

    effects = []

    for index, character in enumerate(text):

        character_index = (
            start_character_index + index
        )

        if character.isspace():
            effects.append(
                {
                    "character": character,
                    "ink_style": ink_style,
                    "opacity_multiplier": 1.0,
                    "darkness_multiplier": 1.0,
                    "texture_strength": 0.0,
                }
            )

            continue

        effect = generate_character_ink_effect(
            document_id=document_id,
            page_number=page_number,
            character_index=character_index,
            ink_style=ink_style,
            enable_variation=enable_variation,
        )

        effects.append(
            {
                "character": character,
                **effect,
            }
        )

    return effects


# ============================================================
# VALIDATION
# ============================================================

def validate_ink_variation(
    variation: InkVariation,
    pencil: bool = False,
) -> bool:
    """
    Validate that ink variation remains within
    readability-safe limits.
    """

    if pencil:
        return (
            PENCIL_MIN_OPACITY_MULTIPLIER
            <= variation.opacity_multiplier
            <= PENCIL_MAX_OPACITY_MULTIPLIER
            and
            PENCIL_MIN_DARKNESS_MULTIPLIER
            <= variation.darkness_multiplier
            <= PENCIL_MAX_DARKNESS_MULTIPLIER
            and
            PENCIL_MIN_TEXTURE
            <= variation.texture_strength
            <= PENCIL_MAX_TEXTURE
        )

    return (
        MIN_OPACITY_MULTIPLIER
        <= variation.opacity_multiplier
        <= MAX_OPACITY_MULTIPLIER
        and
        MIN_DARKNESS_MULTIPLIER
        <= variation.darkness_multiplier
        <= MAX_DARKNESS_MULTIPLIER
        and
        MIN_TEXTURE
        <= variation.texture_strength
        <= MAX_TEXTURE
    )