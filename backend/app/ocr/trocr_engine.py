from typing import Optional

import numpy as np
import torch
from PIL import Image
from transformers import (
    TrOCRProcessor,
    VisionEncoderDecoderModel,
)


class TrOCREngine:
    """
    Microsoft TrOCR engine for handwritten text recognition.

    TrOCR is used by InkAI to recognize text from
    individual cropped handwriting regions.

    EasyOCR is responsible for locating text regions.
    TrOCR is responsible for recognizing the handwriting
    inside those regions.
    """

    def __init__(
        self,
        model_name: str = (
            "microsoft/trocr-base-handwritten"
        ),
        device: Optional[str] = None
    ):
        """
        Initialize the TrOCR model.

        The handwritten model is used because InkAI
        primarily focuses on handwritten documents.
        """

        if device is None:
            device = (
                "cuda"
                if torch.cuda.is_available()
                else "cpu"
            )

        self.device = device

        try:
            self.processor = (
                TrOCRProcessor.from_pretrained(
                    model_name
                )
            )

            self.model = (
                VisionEncoderDecoderModel.from_pretrained(
                    model_name
                )
            )

            self.model.to(
                self.device
            )

            self.model.eval()

        except Exception as exc:
            raise RuntimeError(
                "Unable to load the TrOCR model."
            ) from exc

    # =====================================================
    # RECOGNIZE REGION
    # =====================================================

    def recognize_region(
        self,
        image: np.ndarray
    ) -> str:
        """
        Recognize handwritten text from one cropped region.

        Parameters:
            image:
                An OpenCV image in BGR format.

        Returns:
            The recognized text.
        """

        if image is None or image.size == 0:
            raise ValueError(
                "Cannot recognize text from an empty image region."
            )

        try:
            # OpenCV uses BGR.
            # PIL/TrOCR expects RGB.
            image_rgb = image[:, :, ::-1]

            pil_image = Image.fromarray(
                image_rgb
            )

            pixel_values = (
                self.processor(
                    images=pil_image,
                    return_tensors="pt"
                ).pixel_values
            )

            pixel_values = pixel_values.to(
                self.device
            )

            with torch.no_grad():

                generated_ids = (
                    self.model.generate(
                        pixel_values
                    )
                )

            text = (
                self.processor.batch_decode(
                    generated_ids,
                    skip_special_tokens=True
                )[0]
            )

            return text.strip()

        except ValueError:
            raise

        except Exception as exc:
            raise RuntimeError(
                "TrOCR failed to recognize handwriting."
            ) from exc