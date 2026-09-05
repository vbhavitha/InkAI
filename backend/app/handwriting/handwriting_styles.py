from pathlib import Path


# Base directory containing all InkAI handwriting fonts
FONTS_DIR = Path(__file__).resolve().parent / "fonts"


HANDWRITING_STYLES = {
    "neat_student": {
        "name": "Neat Student",
        "description": "Clean and readable student handwriting",
        "fonts": [
            "neat/Kalam-Regular.ttf",
            "neat/PatrickHand-Regular.ttf",
        ],
        "default_size": 22,
        "spacing": 1.0,
        "line_spacing": 1.5,
        "category": "neat",
    },

    "school_notebook": {
        "name": "School Notebook",
        "description": "Natural handwriting suitable for school notes",
        "fonts": [
            "notebook/Kalam-Regular.ttf",
            "notebook/PatrickHand-Regular.ttf",
        ],
        "default_size": 22,
        "spacing": 1.0,
        "line_spacing": 1.6,
        "category": "notebook",
    },

    "casual_handwriting": {
        "name": "Casual Handwriting",
        "description": "Relaxed and informal handwritten style",
        "fonts": [
            "casual/IndieFlower-Regular.ttf",
            "casual/GochiHand-Regular.ttf",
        ],
        "default_size": 22,
        "spacing": 1.0,
        "line_spacing": 1.5,
        "category": "casual",
    },

    "cursive": {
        "name": "Cursive",
        "description": "Flowing and elegant handwritten style",
        "fonts": [
            "cursive/Caveat-Regular.ttf",
            "cursive/ShadowsIntoLightTwo-Regular.ttf",
        ],
        "default_size": 22,
        "spacing": 1.0,
        "line_spacing": 1.5,
        "category": "cursive",
    },

    "messy_notes": {
        "name": "Messy Notes",
        "description": "Loose and slightly irregular note-taking style",
        "fonts": [
            "casual/GochiHand-Regular.ttf",
            "casual/IndieFlower-Regular.ttf",
        ],
        "default_size": 21,
        "spacing": 1.05,
        "line_spacing": 1.55,
        "category": "casual",
    },

    "pencil_writing": {
        "name": "Pencil Writing",
        "description": "Soft notebook-style handwriting",
        "fonts": [
            "notebook/Kalam-Regular.ttf",
            "neat/PatrickHand-Regular.ttf",
        ],
        "default_size": 21,
        "spacing": 1.0,
        "line_spacing": 1.55,
        "category": "notebook",
    },
}


def get_handwriting_styles():
    """
    Return all available handwriting styles.
    """
    return HANDWRITING_STYLES


def get_handwriting_style(style_id: str):
    """
    Return a single handwriting style by its ID.
    """
    return HANDWRITING_STYLES.get(style_id)


def get_font_path(font_relative_path: str) -> Path:
    """
    Convert a font path stored in a style definition
    into its absolute filesystem path.
    """
    return FONTS_DIR / font_relative_path


def get_style_font_paths(style_id: str):
    """
    Return absolute paths for all fonts belonging
    to the requested handwriting style.
    """
    style = get_handwriting_style(style_id)

    if not style:
        raise ValueError(f"Unknown handwriting style: {style_id}")

    return [
        get_font_path(font)
        for font in style["fonts"]
    ]


def validate_handwriting_styles():
    """
    Verify that every font referenced by the style
    configuration actually exists.
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