"""
InkAI TrOCR Engine

The Transformers imports are intentionally lazy.

Why?
-------
Importing Transformers at application startup can pull in SciPy/native
dependencies. On some Python/Windows environments this can cause the
FastAPI server itself to fail before it even starts.

The engine therefore loads Transformers only when OCR is actually used.
"""

from __future__ import annotations

from typing import Optional


class TrOCREngine:
    """
    Wrapper around Microsoft's TrOCR model.

    Transformers is loaded lazily inside _load_dependencies().
    """

    def __init__(
        self,
        model_name: str = "microsoft/trocr-base-handwritten",
    ):
        self.model_name = model_name

        self.processor = None
        self.model = None

        self._dependencies_loaded = False

    def _load_dependencies(self):
        """
        Load Transformers/PyTorch only when TrOCR is actually required.
        """

        if self._dependencies_loaded:
            return

        try:
            from transformers import (
                TrOCRProcessor,
                VisionEncoderDecoderModel,
            )

            self.processor = TrOCRProcessor.from_pretrained(
                self.model_name
            )

            self.model = VisionEncoderDecoderModel.from_pretrained(
                self.model_name
            )

            self._dependencies_loaded = True

        except ImportError as exc:
            raise RuntimeError(
                "TrOCR dependencies could not be loaded.\n\n"
                "This usually means that the installed Python/native "
                "packages are incompatible with the current Python "
                "version or a native DLL is being blocked.\n\n"
                f"Original error: {exc}"
            ) from exc

        except OSError as exc:
            raise RuntimeError(
                "TrOCR native dependencies could not be loaded.\n\n"
                "Check the Python version and reinstall the OCR "
                "dependencies in the backend virtual environment.\n\n"
                f"Original error: {exc}"
            ) from exc

    def transcribe(self, image):
        """
        Run handwritten-text recognition on a PIL image.
        """

        self._load_dependencies()

        try:
            import torch

            pixel_values = self.processor(
                images=image,
                return_tensors="pt",
            ).pixel_values

            with torch.no_grad():
                generated_ids = self.model.generate(
                    pixel_values
                )

            generated_text = self.processor.batch_decode(
                generated_ids,
                skip_special_tokens=True,
            )[0]

            return generated_text.strip()

        except Exception as exc:
            raise RuntimeError(
                f"TrOCR inference failed: {exc}"
            ) from exc

    def process(self, image):
        """
        Backwards-compatible alias.
        """

        return self.transcribe(image)

    def __call__(self, image):
        return self.transcribe(image)