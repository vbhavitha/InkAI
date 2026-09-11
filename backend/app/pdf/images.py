from pathlib import Path

from reportlab.lib.utils import ImageReader


def resolve_image(
    image_path: str | Path,
):
    """
    Safely resolve an image for ReportLab.

    Returns None when the image cannot be loaded.
    """

    if not image_path:
        return None

    path = Path(
        str(image_path)
    )

    if not path.exists():
        return None

    if not path.is_file():
        return None

    try:
        return ImageReader(
            str(path)
        )
    except Exception:
        return None