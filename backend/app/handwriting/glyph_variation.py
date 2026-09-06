"""
InkAI Glyph Variation Engine

Step 13:
- Generates subtle, deterministic character variations.
- Uses a seeded random generator so preview/download can
  produce reproducible handwriting.

Step 14:
- Supports selecting between multiple compatible font variants.
"""

from __future__ import annotations

import random
from dataclasses import dataclass
from typing import Sequence


# ============================================================
# VARIATION LIMITS
# ============================================================

# Keep these deliberately subtle.
MIN_ROTATION = -2.0
MAX_ROTATION = 2.0

MIN_SCALE = 0.97
MAX_SCALE = 1.03

MIN_OFFSET_X = -0.3
MAX_OFFSET_X = 0.3

MIN_OFFSET_Y = -1.0
MAX_OFFSET_Y = 1.0

MIN_LETTER_SPACING = -0.2
MAX_LETTER_SPACING = 0.2


# ============================================================
# GLYPH VARIATION
# ============================================================

@dataclass(frozen=True)
class GlyphVariation:
    """
    Represents the visual variation applied to one character.
    """

    rotation: float
    scale: float
    offset_x: float
    offset_y: float
    letter_spacing: float
    font_variant: str | None = None

    def to_dict(self) -> dict:
        """
        Convert variation to a JSON-friendly dictionary.
        """

        return {
            "rotation": self.rotation,
            "scale": self.scale,
            "offset_x": self.offset_x,
            "offset_y": self.offset_y,
            "letter_spacing": self.letter_spacing,
            "font_variant": self.font_variant,
        }


# ============================================================
# SEEDED RANDOM GENERATOR
# ============================================================

def create_rng(seed: int | str | None = None) -> random.Random:
    """
    Create a deterministic random generator.

    The same seed produces the same sequence of
    variations.

    Example:

        rng1 = create_rng(1234)
        rng2 = create_rng(1234)

        Both generators will produce identical results.
    """

    return random.Random(seed)


# ============================================================
# FONT VARIANT SELECTION
# ============================================================

def choose_font_variant(
    rng: random.Random,
    font_variants: Sequence[str] | None = None,
) -> str | None:
    """
    Select one font variant using the seeded RNG.

    Step 14:

        character
            ↓
        compatible font variants
            ↓
        random selection
            ↓
        selected font
    """

    if not font_variants:
        return None

    return rng.choice(
        list(font_variants)
    )


# ============================================================
# CHARACTER VARIATION
# ============================================================

def generate_glyph_variation(
    rng: random.Random,
    font_variants: Sequence[str] | None = None,
    enable_variation: bool = True,
) -> GlyphVariation:
    """
    Generate subtle visual variation for one character.

    The ranges intentionally remain small:

        Rotation:       -2°  → +2°
        Scale:          0.97 → 1.03
        Offset X:       -0.3 → +0.3 px
        Offset Y:       -1   → +1 px
        Letter spacing: -0.2 → +0.2 px
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

    return GlyphVariation(
        rotation=round(
            rng.uniform(
                MIN_ROTATION,
                MAX_ROTATION,
            ),
            3,
        ),
        scale=round(
            rng.uniform(
                MIN_SCALE,
                MAX_SCALE,
            ),
            4,
        ),
        offset_x=round(
            rng.uniform(
                MIN_OFFSET_X,
                MAX_OFFSET_X,
            ),
            3,
        ),
        offset_y=round(
            rng.uniform(
                MIN_OFFSET_Y,
                MAX_OFFSET_Y,
            ),
            3,
        ),
        letter_spacing=round(
            rng.uniform(
                MIN_LETTER_SPACING,
                MAX_LETTER_SPACING,
            ),
            3,
        ),
        font_variant=choose_font_variant(
            rng,
            font_variants,
        ),
    )


# ============================================================
# RENDER CHARACTER CONFIGURATION
# ============================================================

def render_character(
    character: str,
    rng: random.Random,
    font_variants: Sequence[str] | None = None,
    enable_variation: bool = True,
) -> dict:
    """
    Prepare everything required to render one character.

    Concept:

        render_character(character)
                    ↓
             random variation
                    ↓
              render config

    This function does not draw the character itself.
    It returns a deterministic rendering configuration
    that can be consumed by the actual renderer.
    """

    if not character:
        raise ValueError(
            "Character cannot be empty."
        )

    variation = generate_glyph_variation(
        rng=rng,
        font_variants=font_variants,
        enable_variation=enable_variation,
    )

    return {
        "character": character,
        **variation.to_dict(),
    }


# ============================================================
# TEXT VARIATION
# ============================================================

def generate_text_variations(
    text: str,
    seed: int | str | None = None,
    font_variants: Sequence[str] | None = None,
    enable_variation: bool = True,
) -> list[dict]:
    """
    Generate deterministic variation data for every
    character in a string.

    Example:

        "Hello"

        ↓

        [
            {
                "character": "H",
                "rotation": ...,
                "scale": ...,
                ...
            },
            ...
        ]

    Calling this function again with the same seed
    produces the same result.
    """

    rng = create_rng(seed)

    variations = []

    for character in text:
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
                rng=rng,
                font_variants=font_variants,
                enable_variation=enable_variation,
            )
        )

    return variations


# ============================================================
# PAGE VARIATION
# ============================================================

def generate_page_variations(
    text: str,
    seed: int | str | None = None,
    font_variants: Sequence[str] | None = None,
    enable_variation: bool = True,
) -> dict:
    """
    Generate reproducible variation information for
    an entire page.

    The returned seed should be stored with the document
    or generation job if exact preview/download matching
    is required.
    """

    variations = generate_text_variations(
        text=text,
        seed=seed,
        font_variants=font_variants,
        enable_variation=enable_variation,
    )

    return {
        "seed": seed,
        "variation_enabled": enable_variation,
        "characters": variations,
    }


# ============================================================
# VALIDATION
# ============================================================

def validate_variation(
    variation: GlyphVariation,
) -> bool:
    """
    Verify that a generated variation stays inside
    the safe natural-handwriting ranges.
    """

    if not (
        MIN_ROTATION
        <= variation.rotation
        <= MAX_ROTATION
    ):
        return False

    if not (
        MIN_SCALE
        <= variation.scale
        <= MAX_SCALE
    ):
        return False

    if not (
        MIN_OFFSET_X
        <= variation.offset_x
        <= MAX_OFFSET_X
    ):
        return False

    if not (
        MIN_OFFSET_Y
        <= variation.offset_y
        <= MAX_OFFSET_Y
    ):
        return False

    if not (
        MIN_LETTER_SPACING
        <= variation.letter_spacing
        <= MAX_LETTER_SPACING
    ):
        return False

    return True