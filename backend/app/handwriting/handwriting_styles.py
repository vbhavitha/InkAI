from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent
FONTS_DIR = BASE_DIR / "fonts"


HANDWRITING_STYLES = {
    "neat_student": {
        "name": "Neat Student",

        "fonts": [
            "neat/Kalam-Regular.ttf",
            "neat/PatrickHand-Regular.ttf",
        ],

        "default_size": 22,
        "letter_spacing": 0,
        "line_spacing": 1.5,
    },

    "school_notebook": {
        "name": "School Notebook",

        "fonts": [
            "notebook/Kalam-Regular.ttf",
            "notebook/PatrickHand-Regular.ttf",
        ],

        "default_size": 22,
        "letter_spacing": 0,
        "line_spacing": 1.6,
    },

    "casual_handwriting": {
        "name": "Casual Handwriting",

        "fonts": [
            "casual/IndieFlower-Regular.ttf",
            "casual/GochiHand-Regular.ttf",
        ],

        "default_size": 22,
        "letter_spacing": 0,
        "line_spacing": 1.5,
    },

    "cursive": {
        "name": "Cursive",

        "fonts": [
            "cursive/Caveat-Regular.ttf",
            "cursive/ShadowsIntoLightTwo-Regular.ttf",
        ],

        "default_size": 22,
        "letter_spacing": 0,
        "line_spacing": 1.5,
    },

    "messy_notes": {
        "name": "Messy Notes",

        "fonts": [
            "casual/GochiHand-Regular.ttf",
            "casual/IndieFlower-Regular.ttf",
        ],

        "default_size": 21,
        "letter_spacing": 1,
        "line_spacing": 1.55,
    },

    "pencil_writing": {
        "name": "Pencil Writing",

        "fonts": [
            "notebook/Kalam-Regular.ttf",
            "neat/PatrickHand-Regular.ttf",
        ],

        "default_size": 21,
        "letter_spacing": 0,
        "line_spacing": 1.55,
    },
}


def get_handwriting_styles():
    return HANDWRITING_STYLES


def get_handwriting_style(style_id: str):
    return HANDWRITING_STYLES.get(style_id)


def get_font_path(font_path: str) -> Path:
    return FONTS_DIR / font_path


def get_style_font_paths(style_id: str) -> list[Path]:
    style = get_handwriting_style(style_id)

    if not style:
        return []

    return [
        get_font_path(font)
        for font in style["fonts"]
    ]


def validate_handwriting_styles():
    """
    Check whether all configured font files exist.
    """

    missing_fonts = []

    for style_id, style in HANDWRITING_STYLES.items():
        for font in style["fonts"]:
            font_path = get_font_path(font)

            if not font_path.exists():
                missing_fonts.append(
                    {
                        "style": style_id,
                        "font": font,
                        "path": str(font_path),
                    }
                )

    return missing_fonts