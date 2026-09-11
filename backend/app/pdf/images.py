"""
InkAI PDF Image Utilities
=========================

Reusable image handling for the PDF engine.

Supported:
    PNG
    JPEG / JPG
    WEBP

Responsibilities:
    - Resolve images safely.
    - Validate supported formats.
    - Read image dimensions.
    - Preserve aspect ratio.
    - Resize oversized images.
    - Respect available content width/height.
    - Calculate image placement without overflowing.
    - Provide drawing helpers for ReportLab.

This module does NOT perform pagination.

The caller decides whether the image fits the current page and,
if necessary, moves the image to the next page.
"""

from __future__ import annotations

import base64
import io
import mimetypes
from dataclasses import dataclass
from pathlib import Path
from typing import Any
from urllib.parse import unquote, urlparse

from PIL import Image
from reportlab.lib.utils import ImageReader


# ============================================================
# SUPPORTED FORMATS
# ============================================================

SUPPORTED_IMAGE_FORMATS = {
    "PNG",
    "JPEG",
    "JPG",
    "WEBP",
}

SUPPORTED_MIME_TYPES = {
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/webp",
}


# ============================================================
# IMAGE DIMENSIONS
# ============================================================

@dataclass(frozen=True)
class ImageDimensions:
    """
    Image dimensions in pixels.
    """

    width: int
    height: int

    @property
    def aspect_ratio(self) -> float:
        if self.height <= 0:
            return 1.0

        return self.width / self.height


@dataclass(frozen=True)
class RenderedImageSize:
    """
    Image dimensions in ReportLab points.
    """

    width: float
    height: float

    @property
    def aspect_ratio(self) -> float:
        if self.height <= 0:
            return 1.0

        return self.width / self.height


@dataclass(frozen=True)
class ImageResource:
    """
    Resolved image resource.
    """

    source: Any
    image: Image.Image
    dimensions: ImageDimensions
    format: str


# ============================================================
# FORMAT HELPERS
# ============================================================

def normalize_image_format(
    image_format: str | None,
) -> str | None:
    """
    Normalize an image format.

    Examples:
        jpg  -> JPEG
        jpeg -> JPEG
        png  -> PNG
        webp -> WEBP
    """

    if not image_format:
        return None

    normalized = (
        str(image_format)
        .strip()
        .upper()
        .replace(".", "")
    )

    if normalized == "JPG":
        return "JPEG"

    if normalized in SUPPORTED_IMAGE_FORMATS:
        return normalized

    return None


def is_supported_image_format(
    image_format: str | None,
) -> bool:
    return (
        normalize_image_format(
            image_format
        )
        is not None
    )


# ============================================================
# SOURCE HANDLING
# ============================================================

def _is_data_uri(
    source: str,
) -> bool:
    return str(source).startswith(
        "data:image/"
    )


def _decode_data_uri(
    source: str,
) -> tuple[bytes, str | None]:
    """
    Decode:

        data:image/png;base64,...

    """

    header, encoded = source.split(
        ",",
        1,
    )

    mime_type = (
        header
        .split(";", 1)[0]
        .replace(
            "data:",
            "",
        )
        .strip()
        .lower()
    )

    if (
        mime_type
        not in SUPPORTED_MIME_TYPES
    ):
        raise ValueError(
            f"Unsupported image MIME type: {mime_type}"
        )

    if ";base64" in header.lower():
        data = base64.b64decode(
            encoded
        )
    else:
        from urllib.parse import unquote_to_bytes

        data = unquote_to_bytes(
            encoded
        )

    return (
        data,
        mime_type,
    )


def _read_source_bytes(
    source: Any,
) -> tuple[bytes, str | None]:
    """
    Read supported image sources.

    Supported:
        - filesystem path
        - bytes
        - bytearray
        - data URI
        - file-like object
    """

    if source is None:
        raise ValueError(
            "Image source is required."
        )

    if isinstance(
        source,
        bytes,
    ):
        return source, None

    if isinstance(
        source,
        bytearray,
    ):
        return bytes(source), None

    if hasattr(
        source,
        "read",
    ):
        current_position = None

        try:
            current_position = source.tell()
        except Exception:
            pass

        data = source.read()

        if (
            current_position is not None
        ):
            try:
                source.seek(
                    current_position
                )
            except Exception:
                pass

        return data, None

    source_string = str(
        source
    ).strip()

    if not source_string:
        raise ValueError(
            "Image source is empty."
        )

    if _is_data_uri(
        source_string
    ):
        return _decode_data_uri(
            source_string
        )

    parsed = urlparse(
        source_string
    )

    if parsed.scheme in (
        "http",
        "https",
    ):
        raise ValueError(
            "Remote image URLs are not "
            "supported directly by the PDF engine. "
            "Download the image first."
        )

    path_string = unquote(
        parsed.path
        if parsed.scheme == "file"
        else source_string
    )

    path = Path(
        path_string
    )

    if not path.exists():
        raise FileNotFoundError(
            f"Image not found: {path}"
        )

    if not path.is_file():
        raise ValueError(
            f"Image source is not a file: {path}"
        )

    return (
        path.read_bytes(),
        mimetypes.guess_type(
            str(path)
        )[0],
    )


# ============================================================
# LOAD IMAGE
# ============================================================

def load_image(
    source: Any,
) -> ImageResource:
    """
    Load an image using Pillow.

    Validates:
        PNG
        JPEG
        WEBP

    Returns:
        ImageResource
    """

    data, mime_type = (
        _read_source_bytes(
            source
        )
    )

    image_buffer = io.BytesIO(
        data
    )

    image = Image.open(
        image_buffer
    )

    detected_format = (
        normalize_image_format(
            image.format
        )
    )

    if detected_format is None:

        if mime_type:
            detected_format = (
                normalize_image_format(
                    mime_type.split(
                        "/"
                    )[-1]
                )
            )

    if (
        detected_format
        not in {
            "PNG",
            "JPEG",
            "WEBP",
        }
    ):
        raise ValueError(
            "Unsupported image format. "
            "Supported formats are PNG, JPEG, and WEBP."
        )

    # Verify the image without modifying it.
    image.verify()

    # Re-open after verify().
    image_buffer.seek(0)

    image = Image.open(
        image_buffer
    )

    image.load()

    return ImageResource(
        source=source,
        image=image,
        dimensions=ImageDimensions(
            width=image.width,
            height=image.height,
        ),
        format=detected_format,
    )


# ============================================================
# REPORTLAB IMAGE READER
# ============================================================

def resolve_image(
    image_path: str | Path,
):
    """
    Backward-compatible helper.

    Returns a ReportLab ImageReader or None.
    """

    if not image_path:
        return None

    try:
        resource = load_image(
            image_path
        )

        return ImageReader(
            resource.image
        )

    except Exception:
        return None


# ============================================================
# ASPECT-RATIO FITTING
# ============================================================

def calculate_contain_size(
    *,
    source_width: float,
    source_height: float,
    max_width: float,
    max_height: float,
) -> RenderedImageSize:
    """
    Resize an image so it fits inside the available rectangle.

    The aspect ratio is always preserved.

    The image will never exceed:
        max_width
        max_height
    """

    if source_width <= 0:
        raise ValueError(
            "Source image width must be greater than 0."
        )

    if source_height <= 0:
        raise ValueError(
            "Source image height must be greater than 0."
        )

    if max_width <= 0:
        raise ValueError(
            "Maximum image width must be greater than 0."
        )

    if max_height <= 0:
        raise ValueError(
            "Maximum image height must be greater than 0."
        )

    scale = min(
        max_width / source_width,
        max_height / source_height,
        1.0,
    )

    return RenderedImageSize(
        width=source_width * scale,
        height=source_height * scale,
    )


def calculate_image_size(
    resource: ImageResource,
    *,
    max_width: float,
    max_height: float,
    requested_width: float | None = None,
    requested_height: float | None = None,
) -> RenderedImageSize:
    """
    Calculate the final rendered image size.

    Requested dimensions are treated as maximum preferences,
    not permission to overflow the available page area.

    Aspect ratio is always preserved.
    """

    source_width = float(
        resource.dimensions.width
    )

    source_height = float(
        resource.dimensions.height
    )

    target_width = (
        float(requested_width)
        if requested_width
        else source_width
    )

    target_height = (
        float(requested_height)
        if requested_height
        else source_height
    )

    # If only width was supplied.
    if (
        requested_width
        and not requested_height
    ):
        target_height = (
            target_width
            * source_height
            / source_width
        )

    # If only height was supplied.
    elif (
        requested_height
        and not requested_width
    ):
        target_width = (
            target_height
            * source_width
            / source_height
        )

    return calculate_contain_size(
        source_width=target_width,
        source_height=target_height,
        max_width=max_width,
        max_height=max_height,
    )


# ============================================================
# DRAW IMAGE
# ============================================================

def draw_image(
    pdf,
    resource: ImageResource,
    *,
    x: float,
    y: float,
    max_width: float,
    max_height: float,
    requested_width: float | None = None,
    requested_height: float | None = None,
    preserve_aspect_ratio: bool = True,
) -> RenderedImageSize:
    """
    Draw an image onto a ReportLab canvas.

    x/y refer to the bottom-left coordinate.

    Returns:
        Final rendered size.
    """

    if preserve_aspect_ratio:

        size = calculate_image_size(
            resource,
            max_width=max_width,
            max_height=max_height,
            requested_width=requested_width,
            requested_height=requested_height,
        )

    else:

        width = min(
            float(
                requested_width
                or resource.dimensions.width
            ),
            max_width,
        )

        height = min(
            float(
                requested_height
                or resource.dimensions.height
            ),
            max_height,
        )

        size = RenderedImageSize(
            width=width,
            height=height,
        )

    image_reader = ImageReader(
        resource.image
    )

    pdf.drawImage(
        image_reader,
        x,
        y,
        width=size.width,
        height=size.height,
        preserveAspectRatio=preserve_aspect_ratio,
        mask="auto",
    )

    return size


# ============================================================
# IMAGE FIT CHECK
# ============================================================

def image_fits(
    *,
    image_height: float,
    available_height: float,
) -> bool:
    """
    Return True if the image fits in the current
    content area.
    """

    return (
        image_height
        <= max(
            0.0,
            available_height,
        )
    )


__all__ = [
    "SUPPORTED_IMAGE_FORMATS",
    "SUPPORTED_MIME_TYPES",
    "ImageDimensions",
    "RenderedImageSize",
    "ImageResource",
    "normalize_image_format",
    "is_supported_image_format",
    "load_image",
    "resolve_image",
    "calculate_contain_size",
    "calculate_image_size",
    "draw_image",
    "image_fits",
]