"""
InkAI Glyph Variation Engine

Steps 13-17
------------

Step 13:
    Generate subtle per-character glyph variation.

Step 14:
    Support compatible font variants.

Step 15:
    Use deterministic seeds so preview and download
    produce identical handwriting.

Step 16:
    Add subtle baseline / vertical variation.

Step 17:
    Add subtle per-character rotation.

Seed structure:

    document_id
        +
    page_number
        +
    character_index

The same inputs always produce the same result.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Sequence


# ============================================================
# SAFE VARIATION LIMITS
# ============================================================

# Step 17
MIN_ROTATION = -2.0
MAX_ROTATION = 2.0

# Step 13
MIN_SCALE = 0.97
MAX_SCALE = 1.03

# Step 13
MIN_OFFSET_X = -0.3
MAX_OFFSET_X = 0.3

# Step 16
MIN_OFFSET_Y = -1.0
MAX_OFFSET_Y = 1.0

# Step 12 / Step 13
MIN_LETTER_SPACING = -0.2
MAX_LETTER_SPACING = 0.2


# ============================================================
# GLYPH VARIATION MODEL
# ============================================================

@dataclass(frozen=True)
class GlyphVariation:
    """
    Visual properties applied to one character.
    """

    rotation: float
    scale: float
    offset_x: float
    offset_y: float
    letter_spacing: float
    font_variant: str | None = None

    def to_dict(self) -> dict:
        return {
            "rotation": self.rotation,
            "scale": self.scale,
            "offset_x": self.offset_x,
            "offset_y": self.offset_y,
            "letter_spacing": self.letter_spacing,
            "font_variant": self.font_variant,
        }


# ============================================================
# DETERMINISTIC HASH
# ============================================================

def deterministic_hash(value: str) -> int:
    """
    Cross-process deterministic string hash.

    We deliberately do NOT use Python's built-in hash()
    because its result can differ between processes.

    FNV-1a is simple and deterministic.
    """

    hash_value = 2166136261

    for character in value:
        hash_value ^= ord(character)

        hash_value = (
            hash_value * 16777619
        ) & 0xFFFFFFFF

    return hash_value


# ============================================================
# SEEDED VALUE
# ============================================================

def seeded_value(
    seed: str,
    minimum: float,
    maximum: float,
) -> float:
    """
    Convert a deterministic seed into a value inside
    [minimum, maximum].
    """

    hashed = deterministic_hash(seed)

    normalized = (
        hashed / 0xFFFFFFFF
    )

    return (
        minimum
        + normalized *
        (maximum - minimum)
    )


# ============================================================
# FONT VARIANT SELECTION
# ============================================================

def choose_font_variant(
    seed: str,
    font_variants: Sequence[str] | None = None,
) -> str | None:
    """
    Select a compatible font variant deterministically.

    The same seed always selects the same font.
    """

    if not font_variants:
        return None

    variants = list(font_variants)

    if not variants:
        return None

    hashed = deterministic_hash(seed)

    index = (
        hashed %
        len(variants)
    )

    return variants[index]


# ============================================================
# CHARACTER VARIATION
# ============================================================

def generate_glyph_variation(
    document_id: str,
    page_number: int,
    character_index: int,
    font_variants: Sequence[str] | None = None,
    enable_variation: bool = True,
) -> GlyphVariation:
    """
    Generate deterministic variation for one character.

    Seed:

        document_id
            +
        page_number
            +
        character_index

    Example:

        document-123:page-1:char-42
    """

    if not enable_variation:
        return GlyphVariation(
            rotation=0.0,
            scale=1.0,
            offset_x=0.0,
            offset_y=0.0,
            letter_spacing=0.0,
            font_variant=(
                font_variants[0]
                if font_variants
                else None
            ),
        )

    base_seed = (
        f"{document_id}:"
        f"{page_number}:"
        f"{character_index}"
    )

    rotation = seeded_value(
        f"{base_seed}:rotation",
        MIN_ROTATION,
        MAX_ROTATION,
    )

    scale = seeded_value(
        f"{base_seed}:scale",
        MIN_SCALE,
        MAX_SCALE,
    )

    offset_x = seeded_value(
        f"{base_seed}:offset_x",
        MIN_OFFSET_X,
        MAX_OFFSET_X,
    )

    offset_y = seeded_value(
        f"{base_seed}:offset_y",
        MIN_OFFSET_Y,
        MAX_OFFSET_Y,
    )

    letter_spacing = seeded_value(
        f"{base_seed}:spacing",
        MIN_LETTER_SPACING,
        MAX_LETTER_SPACING,
    )

    font_variant = choose_font_variant(
        f"{base_seed}:font",
        font_variants,
    )

    return GlyphVariation(
        rotation=round(
            rotation,
            3,
        ),
        scale=round(
            scale,
            4,
        ),
        offset_x=round(
            offset_x,
            3,
        ),
        offset_y=round(
            offset_y,
            3,
        ),
        letter_spacing=round(
            letter_spacing,
            3,
        ),
        font_variant=font_variant,
    )


# ============================================================
# RENDER CHARACTER
# ============================================================

def render_character(
    character: str,
    document_id: str,
    page_number: int,
    character_index: int,
    font_variants: Sequence[str] | None = None,
    enable_variation: bool = True,
) -> dict:
    """
    Prepare deterministic rendering information
    for one character.
    """

    if not character:
        raise ValueError(
            "Character cannot be empty."
        )

    variation = (
        generate_glyph_variation(
            document_id=document_id,
            page_number=page_number,
            character_index=character_index,
            font_variants=font_variants,
            enable_variation=enable_variation,
        )
    )

    return {
        "character": character,
        **variation.to_dict(),
    }


# ============================================================
# TEXT VARIATIONS
# ============================================================

def generate_text_variations(
    text: str,
    document_id: str,
    page_number: int,
    start_character_index: int = 0,
    font_variants: Sequence[str] | None = None,
    enable_variation: bool = True,
) -> list[dict]:
    """
    Generate deterministic variation for every character
    in a page or text block.
    """

    variations = []

    for index, character in enumerate(text):

        character_index = (
            start_character_index
            + index
        )

        # Spaces should not rotate or move.
        if character.isspace():
            variations.append(
                {
                    "character": character,
                    "rotation": 0.0,
                    "scale": 1.0,
                    "offset_x": 0.0,
                    "offset_y": 0.0,
                    "letter_spacing": 0.0,
                    "font_variant": (
                        font_variants[0]
                        if font_variants
                        else None
                    ),
                }
            )

            continue

        variations.append(
            render_character(
                character=character,
                document_id=document_id,
                page_number=page_number,
                character_index=character_index,
                font_variants=font_variants,
                enable_variation=enable_variation,
            )
        )

    return variations


# ============================================================
# PAGE VARIATIONS
# ============================================================

def generate_page_variations(
    text: str,
    document_id: str,
    page_number: int,
    font_variants: Sequence[str] | None = None,
    enable_variation: bool = True,
) -> dict:
    """
    Generate deterministic variation data for a complete page.
    """

    characters = generate_text_variations(
        text=text,
        document_id=document_id,
        page_number=page_number,
        start_character_index=0,
        font_variants=font_variants,
        enable_variation=enable_variation,
    )

    return {
        "document_id": document_id,
        "page_number": page_number,
        "variation_enabled": enable_variation,
        "characters": characters,
    }


# ============================================================
# VALIDATION
# ============================================================

def validate_variation(
    variation: GlyphVariation,
) -> bool:

    return (
        MIN_ROTATION
        <= variation.rotation
        <= MAX_ROTATION
        and
        MIN_SCALE
        <= variation.scale
        <= MAX_SCALE
        and
        MIN_OFFSET_X
        <= variation.offset_x
        <= MAX_OFFSET_X
        and
        MIN_OFFSET_Y
        <= variation.offset_y
        <= MAX_OFFSET_Y
        and
        MIN_LETTER_SPACING
        <= variation.letter_spacing
        <= MAX_LETTER_SPACING
    )