from typing import Dict, List


SUPPORTED_LANGUAGES: Dict[str, Dict[str, object]] = {
    "en": {
        "name": "English",
        "easyocr_languages": ["en"],
        "enabled": True,
    },

    "hi": {
        "name": "Hindi",
        "easyocr_languages": ["hi"],
        "enabled": False,
    },

    "te": {
        "name": "Telugu",
        "easyocr_languages": ["te"],
        "enabled": False,
    },

    "es": {
        "name": "Spanish",
        "easyocr_languages": ["es"],
        "enabled": False,
    },

    "fr": {
        "name": "French",
        "easyocr_languages": ["fr"],
        "enabled": False,
    },
}


def get_supported_languages() -> List[Dict[str, object]]:
    """
    Return available OCR languages.
    """

    return [
        {
            "code": code,
            "name": config["name"],
            "enabled": config["enabled"],
        }
        for code, config in SUPPORTED_LANGUAGES.items()
    ]


def get_language_config(
    language_code: str
) -> Dict[str, object]:
    """
    Return OCR configuration for a language.
    """

    if language_code not in SUPPORTED_LANGUAGES:
        raise ValueError(
            f"Unsupported OCR language: {language_code}"
        )

    config = SUPPORTED_LANGUAGES[language_code]

    if not config["enabled"]:
        raise ValueError(
            f"OCR language '{config['name']}' "
            "is not enabled yet."
        )

    return config