from typing import Optional

import numpy as np


class MathOCREngine:
    """
    Interface for mathematical OCR.

    The actual math recognition model will be integrated
    after normal handwriting OCR is stable.
    """

    def __init__(self):
        self.model_loaded = False

    def recognize(
        self,
        image: np.ndarray
    ) -> Optional[str]:
        """
        Recognize a mathematical expression and return LaTeX.

        MVP:
        The actual ML model is intentionally not loaded yet.
        """

        if image is None:
            return None

        # Future implementation:
        #
        # image
        #   ↓
        # math recognition model
        #   ↓
        # LaTeX
        #
        # Example:
        #
        # x² + y² = z²
        #
        # becomes:
        #
        # x^2 + y^2 = z^2

        return None