"""
InkAI PDF Watermark
===================

Reusable watermark renderer for assignment PDFs.

Supported modes:
- none
- text
- image

Watermarks are disabled by default.

Example configuration:
{
    "type": "text",
    "text": "DRAFT",
    "opacity": 0.12,
    "rotation": 35,
    "position": "center"
}

Image example:
{
    "type": "image",
    "src": "/path/to/logo.png",
    "opacity": 0.10,
    "rotation": 0,
    "position": "center",
    "width": 180,
    "height": 180
}
"""

from __future__ import annotations

from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Any, Dict, Optional

from reportlab.lib.utils import ImageReader


WATERMARK_NONE = "none"
WATERMARK_TEXT = "text"
WATERMARK_IMAGE = "image"

VALID_TYPES = {
    WATERMARK_NONE,
    WATERMARK_TEXT,
    WATERMARK_IMAGE,
}

VALID_POSITIONS = {
    "center",
    "top-left",
    "top-center",
    "top-right",
    "middle-left",
    "middle-right",
    "bottom-left",
    "bottom-center",
    "bottom-right",
}


@dataclass
class WatermarkConfig:
    """
    Watermark settings.

    The defaults intentionally keep assignment watermarks OFF.
    """

    type: str = WATERMARK_NONE

    # Text watermark.
    text: str = "DRAFT"

    # Image watermark.
    src: Optional[str] = None

    # Shared settings.
    opacity: float = 0.12
    rotation: float = 0.0
    position: str = "center"

    # Text sizing.
    font_size: float = 72.0
    font_name: str = "Helvetica-Bold"

    # Image sizing.
    width: Optional[float] = None
    height: Optional[float] = None

    # Optional explicit coordinates in points.
    x: Optional[float] = None
    y: Optional[float] = None

    @classmethod
    def from_dict(
        cls,
        value: Optional[Dict[str, Any]],
    ) -> "WatermarkConfig":
        if not isinstance(value, dict):
            return cls()

        data = dict(value)

        # Accept common aliases used by frontend configuration.
        if "mode" in data and "type" not in data:
            data["type"] = data["mode"]

        if "image" in data and "src" not in data:
            data["src"] = data["image"]

        if "fontSize" in data and "font_size" not in data:
            data["font_size"] = data["fontSize"]

        if "fontName" in data and "font_name" not in data:
            data["font_name"] = data["fontName"]

        if "font_size" in data:
            try:
                data["font_size"] = float(data["font_size"])
            except (TypeError, ValueError):
                data["font_size"] = cls.font_size

        if "opacity" in data:
            try:
                data["opacity"] = float(data["opacity"])
            except (TypeError, ValueError):
                data["opacity"] = cls.opacity

        if "rotation" in data:
            try:
                data["rotation"] = float(data["rotation"])
            except (TypeError, ValueError):
                data["rotation"] = cls.rotation

        for key in ("width", "height", "x", "y"):
            if key in data and data[key] is not None:
                try:
                    data[key] = float(data[key])
                except (TypeError, ValueError):
                    data[key] = None

        return cls(
            type=str(data.get("type", cls.type)).lower(),
            text=str(data.get("text", cls.text)),
            src=data.get("src"),
            opacity=max(
                0.0,
                min(1.0, float(data.get("opacity", cls.opacity))),
            ),
            rotation=float(data.get("rotation", cls.rotation)),
            position=str(
                data.get("position", cls.position)
            ).lower(),
            font_size=max(
                1.0,
                float(data.get("font_size", cls.font_size)),
            ),
            font_name=str(
                data.get("font_name", cls.font_name)
            ),
            width=data.get("width"),
            height=data.get("height"),
            x=data.get("x"),
            y=data.get("y"),
        )

    def normalized(self) -> "WatermarkConfig":
        config = WatermarkConfig.from_dict(asdict(self))

        if config.type not in VALID_TYPES:
            config.type = WATERMARK_NONE

        if config.position not in VALID_POSITIONS:
            config.position = "center"

        if config.type == WATERMARK_TEXT and not config.text.strip():
            config.type = WATERMARK_NONE

        if config.type == WATERMARK_IMAGE and not config.src:
            config.type = WATERMARK_NONE

        return config


class WatermarkRenderer:
    """Draws one watermark onto an existing ReportLab canvas."""

    def __init__(
        self,
        config: Optional[WatermarkConfig | Dict[str, Any]] = None,
    ):
        if isinstance(config, WatermarkConfig):
            self.config = config.normalized()
        else:
            self.config = WatermarkConfig.from_dict(config).normalized()

    def enabled(self) -> bool:
        return self.config.type != WATERMARK_NONE

    def draw(
        self,
        canvas,
        page_width: float,
        page_height: float,
    ) -> None:
        if not self.enabled():
            return

        if self.config.type == WATERMARK_TEXT:
            self._draw_text(canvas, page_width, page_height)
            return

        if self.config.type == WATERMARK_IMAGE:
            self._draw_image(canvas, page_width, page_height)

    # --------------------------------------------------------
    # TEXT
    # --------------------------------------------------------

    def _draw_text(
        self,
        canvas,
        page_width: float,
        page_height: float,
    ) -> None:
        text = self.config.text.strip()

        if not text:
            return

        font_size = self.config.font_size

        try:
            text_width = canvas.stringWidth(
                text,
                self.config.font_name,
                font_size,
            )
        except Exception:
            text_width = len(text) * font_size * 0.55

        text_height = font_size

        x, y = self._resolve_position(
            page_width,
            page_height,
            text_width,
            text_height,
        )

        self._save_state(canvas)

        try:
            self._set_opacity(canvas, self.config.opacity)

            canvas.setFont(
                self.config.font_name,
                font_size,
            )
            canvas.setFillGray(0.5)

            if self.config.rotation:
                canvas.translate(
                    x + text_width / 2,
                    y + text_height / 2,
                )
                canvas.rotate(self.config.rotation)
                canvas.drawCentredString(
                    0,
                    -text_height / 2,
                    text,
                )
            else:
                canvas.drawString(x, y, text)

        finally:
            canvas.restoreState()

    # --------------------------------------------------------
    # IMAGE
    # --------------------------------------------------------

    def _draw_image(
        self,
        canvas,
        page_width: float,
        page_height: float,
    ) -> None:
        if not self.config.src:
            return

        try:
            image = ImageReader(str(self.config.src))
            image_width, image_height = image.getSize()
        except Exception:
            return

        if image_width <= 0 or image_height <= 0:
            return

        width, height = self._fit_image(
            image_width,
            image_height,
        )

        x, y = self._resolve_position(
            page_width,
            page_height,
            width,
            height,
        )

        self._save_state(canvas)

        try:
            self._set_opacity(canvas, self.config.opacity)

            if self.config.rotation:
                canvas.translate(
                    x + width / 2,
                    y + height / 2,
                )
                canvas.rotate(self.config.rotation)

                canvas.drawImage(
                    image,
                    -width / 2,
                    -height / 2,
                    width=width,
                    height=height,
                    preserveAspectRatio=True,
                    mask="auto",
                )
            else:
                canvas.drawImage(
                    image,
                    x,
                    y,
                    width=width,
                    height=height,
                    preserveAspectRatio=True,
                    mask="auto",
                )

        finally:
            canvas.restoreState()

    # --------------------------------------------------------
    # POSITIONING
    # --------------------------------------------------------

    def _resolve_position(
        self,
        page_width: float,
        page_height: float,
        object_width: float,
        object_height: float,
    ) -> tuple[float, float]:
        if (
            self.config.x is not None
            and self.config.y is not None
        ):
            return (
                self.config.x,
                self.config.y,
            )

        position = self.config.position

        if position == "top-left":
            return (
                24,
                page_height - object_height - 24,
            )

        if position == "top-center":
            return (
                (page_width - object_width) / 2,
                page_height - object_height - 24,
            )

        if position == "top-right":
            return (
                page_width - object_width - 24,
                page_height - object_height - 24,
            )

        if position == "middle-left":
            return (
                24,
                (page_height - object_height) / 2,
            )

        if position == "middle-right":
            return (
                page_width - object_width - 24,
                (page_height - object_height) / 2,
            )

        if position == "bottom-left":
            return (
                24,
                24,
            )

        if position == "bottom-center":
            return (
                (page_width - object_width) / 2,
                24,
            )

        if position == "bottom-right":
            return (
                page_width - object_width - 24,
                24,
            )

        # Default: center.
        return (
            (page_width - object_width) / 2,
            (page_height - object_height) / 2,
        )

    def _fit_image(
        self,
        source_width: float,
        source_height: float,
    ) -> tuple[float, float]:
        requested_width = self.config.width
        requested_height = self.config.height

        if (
            requested_width
            and requested_width > 0
            and requested_height
            and requested_height > 0
        ):
            scale = min(
                requested_width / source_width,
                requested_height / source_height,
            )

            return (
                source_width * scale,
                source_height * scale,
            )

        if requested_width and requested_width > 0:
            scale = requested_width / source_width
            return (
                requested_width,
                source_height * scale,
            )

        if requested_height and requested_height > 0:
            scale = requested_height / source_height
            return (
                source_width * scale,
                requested_height,
            )

        # Sensible default for a page watermark.
        max_dimension = 220.0
        scale = min(
            1.0,
            max_dimension / max(source_width, source_height),
        )

        return (
            source_width * scale,
            source_height * scale,
        )

    # --------------------------------------------------------
    # CANVAS STATE
    # --------------------------------------------------------

    @staticmethod
    def _save_state(canvas) -> None:
        canvas.saveState()

    @staticmethod
    def _set_opacity(canvas, opacity: float) -> None:
        """
        ReportLab supports alpha on modern PDF canvases. Keep a fallback
        for environments where setFillAlpha is unavailable.
        """
        try:
            canvas.setFillAlpha(opacity)
        except AttributeError:
            pass


def draw_watermark(
    canvas,
    page_width: float,
    page_height: float,
    config: Optional[WatermarkConfig | Dict[str, Any]] = None,
) -> None:
    """
    Convenience function for renderer integration.
    """
    WatermarkRenderer(config).draw(
        canvas,
        page_width,
        page_height,
    )
