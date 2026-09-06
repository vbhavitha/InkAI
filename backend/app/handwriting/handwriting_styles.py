from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent
FONTS_DIR = BASE_DIR / "fonts"


HANDWRITING_STYLES = {
    "neat_student": {
        "name": "Neat Student",
        "category": "neat",
        "description": (
            "Clean student-style handwriting."
        ),

        "fonts": [
            "neat/Kalam-Regular.ttf",
            "neat/PatrickHand-Regular.ttf",
        ],

        # True compatible variants will be added later.
        "font_variants": [],

        "default_size": 22,
        "spacing": 0,
        "line_spacing": 1.5,
    },

    "school_notebook": {
        "name": "School Notebook",
        "category": "notebook",
        "description": (
            "Natural notebook-style handwriting."
        ),

        "fonts": [
            "notebook/Kalam-Regular.ttf",
            "notebook/PatrickHand-Regular.ttf",
        ],

        "font_variants": [],

        "default_size": 22,
        "spacing": 0,
        "line_spacing": 1.6,
    },

    "casual_handwriting": {
        "name": "Casual Handwriting",
        "category": "casual",
        "description": (
            "Relaxed casual handwriting."
        ),

        "fonts": [
            "casual/IndieFlower-Regular.ttf",
            "casual/GochiHand-Regular.ttf",
        ],

        "font_variants": [],

        "default_size": 22,
        "spacing": 0,
        "line_spacing": 1.5,
    },

    "cursive": {
        "name": "Cursive",
        "category": "cursive",
        "description": (
            "Flowing cursive handwriting."
        ),

        "fonts": [
            "cursive/Caveat-Regular.ttf",
            "cursive/ShadowsIntoLightTwo-Regular.ttf",
        ],

        "font_variants": [],

        "default_size": 22,
        "spacing": 0,
        "line_spacing": 1.5,
    },

    "messy_notes": {
        "name": "Messy Notes",
        "category": "casual",
        "description": (
            "Loose handwritten notes style."
        ),

        "fonts": [
            "casual/GochiHand-Regular.ttf",
            "casual/IndieFlower-Regular.ttf",
        ],

        "font_variants": [],

        "default_size": 21,
        "spacing": 1,
        "line_spacing": 1.55,
    },

    "pencil_writing": {
        "name": "Pencil Writing",
        "category": "pencil",
        "description": (
            "Soft pencil-like handwriting."
        ),

        "fonts": [
            "notebook/Kalam-Regular.ttf",
            "neat/PatrickHand-Regular.ttf",
        ],

        "font_variants": [],

        "default_size": 21,
        "spacing": 0,
        "line_spacing": 1.55,
    },
}


# ============================================================
# STYLE ACCESS
# ============================================================

def get_handwriting_styles():
    return HANDWRITING_STYLES


def get_handwriting_style(
    style_id: str,
):
    return HANDWRITING_STYLES.get(
        style_id
    )


# ============================================================
# FONT ACCESS
# ============================================================

def get_font_path(
    font_path: str,
) -> Path:
    return FONTS_DIR / font_path


def get_style_font_paths(
    style_id: str,
) -> list[Path]:

    style = get_handwriting_style(
        style_id
    )

    if not style:
        return []

    return [
        get_font_path(font)
        for font in style["fonts"]
    ]


def get_style_font_variants(
    style_id: str,
) -> list[Path]:

    style = get_handwriting_style(
        style_id
    )

    if not style:
        return []

    return [
        get_font_path(font)
        for font in style.get(
            "font_variants",
            [],
        )
    ]


# ============================================================
# VALIDATION
# ============================================================

def validate_handwriting_styles():

    missing_fonts = []

    for (
        style_id,
        style,
    ) in HANDWRITING_STYLES.items():

        all_fonts = (
            style.get("fonts", [])
            +
            style.get(
                "font_variants",
                [],
            )
        )

        for font in all_fonts:

            font_path = get_font_path(
                font
            )

            if not font_path.exists():
                missing_fonts.append(
                    {
                        "style": style_id,
                        "font": font,
                        "path": str(
                            font_path
                        ),
                    }
                )

    return missing_fonts