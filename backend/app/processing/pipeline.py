import os

import cv2
import numpy as np

from app.core.exceptions import (
    CorruptedImageError,
    ImageTooLargeError,
    InvalidImageError
)


class ImageProcessingPipeline:
    """
    INK AI image-processing pipeline.

    Main pipeline:

        Load
          ↓
        Validate
          ↓
        Auto Brightness
          ↓
        Auto Contrast
          ↓
        Perspective Correction
          ↓
        Deskew
          ↓
        Noise Removal
          ↓
        Shadow Removal
          ↓
        Background Cleaning
          ↓
        Sharpen
          ↓
        Threshold
          ↓
        Save

    Edge detection and line detection are auxiliary
    operations used for document analysis.
    """

    def __init__(self, options=None):
        self.options = options

    # =========================================================
    # STEP 5 — LOAD IMAGE
    # =========================================================

    def load_image(self, input_path):
        """
        Load an image from disk.

        Raises a specific error when the file cannot
        be found or decoded.
        """

        if not input_path or not os.path.isfile(
            input_path
        ):
            raise InvalidImageError(
                "Unable to process image."
            )

        image = cv2.imread(
            input_path
        )

        if image is None:
            raise CorruptedImageError(
                "This image appears to be corrupted."
            )

        return image

    # =========================================================
    # IMAGE VALIDATION
    # =========================================================

    def validate_image(self, image):
        """
        Validate image dimensions and resolution.

        Raises a specific error when the image is invalid
        or exceeds the maximum allowed resolution.
        """

        if image is None:
            raise InvalidImageError(
                "Unable to process image."
            )

        if image.size == 0:
            raise InvalidImageError(
                "Unable to process image."
            )

        if len(image.shape) < 2:
            raise InvalidImageError(
                "Unable to process image."
            )

        height, width = image.shape[:2]

        if height < 10 or width < 10:
            raise InvalidImageError(
                "Unable to process image."
            )

        # ---------------------------------------------
        # Maximum image resolution
        # ---------------------------------------------

        max_pixels = 40_000_000

        if height * width > max_pixels:
            raise ImageTooLargeError(
                "Image resolution is too large."
            )

        return image

    # =========================================================
    # STEP 8 — GRAYSCALE
    # =========================================================

    def grayscale(self, image):
        """
        Convert BGR image to grayscale.
        """

        if image is None:
            raise ValueError(
                "Cannot convert an empty image to grayscale."
            )

        if len(image.shape) == 2:
            return image

        return cv2.cvtColor(
            image,
            cv2.COLOR_BGR2GRAY
        )

    # =========================================================
    # STEP 6 — AUTO BRIGHTNESS
    # =========================================================

    def auto_brightness(self, image):
        """
        Automatically normalize brightness using LAB
        luminance.
        """

        if image is None:
            raise ValueError(
                "Cannot adjust brightness of an empty image."
            )

        if len(image.shape) == 2:

            mean_brightness = float(
                np.mean(image)
            )

            target = 145.0

            adjustment = (
                target -
                mean_brightness
            )

            if abs(adjustment) < 10:
                return image

            adjustment = float(
                np.clip(
                    adjustment,
                    -35,
                    35
                )
            )

            adjusted = (
                image.astype(np.float32)
                + adjustment
            )

            return np.clip(
                adjusted,
                0,
                255
            ).astype(np.uint8)

        lab = cv2.cvtColor(
            image,
            cv2.COLOR_BGR2LAB
        )

        l_channel, a_channel, b_channel = cv2.split(
            lab
        )

        mean_luminance = float(
            np.mean(l_channel)
        )

        target_luminance = 145.0

        adjustment = (
            target_luminance -
            mean_luminance
        )

        if abs(adjustment) < 10:
            return image

        adjustment = float(
            np.clip(
                adjustment,
                -35,
                35
            )
        )

        adjusted_l = (
            l_channel.astype(np.float32)
            + adjustment
        )

        adjusted_l = np.clip(
            adjusted_l,
            0,
            255
        ).astype(np.uint8)

        adjusted_lab = cv2.merge(
            [
                adjusted_l,
                a_channel,
                b_channel
            ]
        )

        return cv2.cvtColor(
            adjusted_lab,
            cv2.COLOR_LAB2BGR
        )

    # =========================================================
    # STEP 7 — AUTO CONTRAST
    # =========================================================

    def auto_contrast(self, image):
        """
        Improve local contrast using CLAHE.
        """

        if image is None:
            raise ValueError(
                "Cannot adjust contrast of an empty image."
            )

        clahe = cv2.createCLAHE(
            clipLimit=2.0,
            tileGridSize=(8, 8)
        )

        if len(image.shape) == 2:
            return clahe.apply(image)

        lab = cv2.cvtColor(
            image,
            cv2.COLOR_BGR2LAB
        )

        l_channel, a_channel, b_channel = cv2.split(
            lab
        )

        enhanced_l = clahe.apply(
            l_channel
        )

        enhanced_lab = cv2.merge(
            [
                enhanced_l,
                a_channel,
                b_channel
            ]
        )

        return cv2.cvtColor(
            enhanced_lab,
            cv2.COLOR_LAB2BGR
        )

    # =========================================================
    # STEP 9 — PERSPECTIVE CORRECTION
    # =========================================================

    def perspective_correction(self, image):
        """
        Detect a page-like contour and correct perspective.
        """

        if image is None:
            raise ValueError(
                "Cannot correct perspective of an empty image."
            )

        original = image.copy()

        edges = self.edge_detection(
            image
        )

        contours, _ = cv2.findContours(
            edges,
            cv2.RETR_LIST,
            cv2.CHAIN_APPROX_SIMPLE
        )

        if not contours:
            return original

        contours = sorted(
            contours,
            key=cv2.contourArea,
            reverse=True
        )

        image_area = (
            image.shape[0] *
            image.shape[1]
        )

        page_contour = None

        for contour in contours[:20]:

            area = cv2.contourArea(
                contour
            )

            if area < image_area * 0.20:
                continue

            perimeter = cv2.arcLength(
                contour,
                True
            )

            approximation = cv2.approxPolyDP(
                contour,
                0.02 * perimeter,
                True
            )

            if len(approximation) == 4:
                page_contour = approximation
                break

        if page_contour is None:
            return original

        points = page_contour.reshape(
            4,
            2
        ).astype(np.float32)

        ordered_points = self._order_points(
            points
        )

        (
            top_left,
            top_right,
            bottom_right,
            bottom_left
        ) = ordered_points

        width_top = np.linalg.norm(
            top_right - top_left
        )

        width_bottom = np.linalg.norm(
            bottom_right - bottom_left
        )

        max_width = int(
            max(
                width_top,
                width_bottom
            )
        )

        height_left = np.linalg.norm(
            bottom_left - top_left
        )

        height_right = np.linalg.norm(
            bottom_right - top_right
        )

        max_height = int(
            max(
                height_left,
                height_right
            )
        )

        if max_width <= 0 or max_height <= 0:
            return original

        destination = np.array(
            [
                [0, 0],
                [max_width - 1, 0],
                [
                    max_width - 1,
                    max_height - 1
                ],
                [0, max_height - 1]
            ],
            dtype=np.float32
        )

        matrix = cv2.getPerspectiveTransform(
            ordered_points,
            destination
        )

        return cv2.warpPerspective(
            image,
            matrix,
            (
                max_width,
                max_height
            )
        )

    # =========================================================
    # PERSPECTIVE HELPER
    # =========================================================

    def _order_points(self, points):
        """
        Order four points as:

        top-left
        top-right
        bottom-right
        bottom-left
        """

        ordered = np.zeros(
            (4, 2),
            dtype=np.float32
        )

        coordinate_sum = points.sum(
            axis=1
        )

        ordered[0] = points[
            np.argmin(coordinate_sum)
        ]

        ordered[2] = points[
            np.argmax(coordinate_sum)
        ]

        coordinate_difference = np.diff(
            points,
            axis=1
        ).reshape(-1)

        ordered[1] = points[
            np.argmin(
                coordinate_difference
            )
        ]

        ordered[3] = points[
            np.argmax(
                coordinate_difference
            )
        ]

        return ordered

    # =========================================================
    # STEP 10 — DESKEW
    # =========================================================

    def deskew(self, image):
        """
        Correct dominant text rotation.
        """

        if image is None:
            raise ValueError(
                "Cannot deskew an empty image."
            )

        gray = self.grayscale(
            image
        )

        blurred = cv2.GaussianBlur(
            gray,
            (3, 3),
            0
        )

        _, binary = cv2.threshold(
            blurred,
            0,
            255,
            cv2.THRESH_BINARY_INV +
            cv2.THRESH_OTSU
        )

        kernel = cv2.getStructuringElement(
            cv2.MORPH_RECT,
            (3, 3)
        )

        binary = cv2.morphologyEx(
            binary,
            cv2.MORPH_OPEN,
            kernel,
            iterations=1
        )

        coordinates = np.column_stack(
            np.where(binary > 0)
        )

        if len(coordinates) < 50:
            return image

        points = np.column_stack(
            (
                coordinates[:, 1],
                coordinates[:, 0]
            )
        ).astype(np.float32)

        rect = cv2.minAreaRect(
            points
        )

        angle = rect[-1]

        if angle < -45:
            angle = 90 + angle

        if abs(angle) < 0.5:
            return image

        if abs(angle) > 15:
            return image

        height, width = image.shape[:2]

        center = (
            width // 2,
            height // 2
        )

        rotation_matrix = cv2.getRotationMatrix2D(
            center,
            angle,
            1.0
        )

        cos = abs(
            rotation_matrix[0, 0]
        )

        sin = abs(
            rotation_matrix[0, 1]
        )

        new_width = int(
            (height * sin) +
            (width * cos)
        )

        new_height = int(
            (height * cos) +
            (width * sin)
        )

        rotation_matrix[0, 2] += (
            new_width / 2
        ) - center[0]

        rotation_matrix[1, 2] += (
            new_height / 2
        ) - center[1]

        return cv2.warpAffine(
            image,
            rotation_matrix,
            (
                new_width,
                new_height
            ),
            flags=cv2.INTER_CUBIC,
            borderMode=cv2.BORDER_CONSTANT,
            borderValue=(255, 255, 255)
        )

    # =========================================================
    # STEP 11 — NOISE REMOVAL
    # =========================================================

    def noise_removal(self, image):
        """
        Mild noise removal.
        """

        if image is None:
            raise ValueError(
                "Cannot remove noise from an empty image."
            )

        return cv2.medianBlur(
            image,
            3
        )

    # =========================================================
    # STEP 12 — SHADOW REMOVAL
    # =========================================================

    def shadow_removal(self, image):
        """
        Normalize uneven illumination.
        """

        if image is None:
            raise ValueError(
                "Cannot remove shadows from an empty image."
            )

        gray = self.grayscale(
            image
        )

        kernel = cv2.getStructuringElement(
            cv2.MORPH_ELLIPSE,
            (21, 21)
        )

        background = cv2.morphologyEx(
            gray,
            cv2.MORPH_CLOSE,
            kernel
        )

        normalized = cv2.divide(
            gray,
            background,
            scale=255
        )

        return cv2.GaussianBlur(
            normalized,
            (3, 3),
            0
        )

    # =========================================================
    # STEP 13 — BACKGROUND CLEANING
    # =========================================================

    def background_cleaning(self, image):
        """
        Reduce paper/background variation.
        """

        if image is None:
            raise ValueError(
                "Cannot clean an empty image."
            )

        gray = self.grayscale(
            image
        )

        kernel = cv2.getStructuringElement(
            cv2.MORPH_RECT,
            (15, 15)
        )

        background = cv2.morphologyEx(
            gray,
            cv2.MORPH_OPEN,
            kernel
        )

        cleaned = cv2.subtract(
            background,
            gray
        )

        cleaned = cv2.normalize(
            cleaned,
            None,
            0,
            255,
            cv2.NORM_MINMAX
        )

        return cv2.bitwise_not(
            cleaned
        )

    # =========================================================
    # STEP 14 — SHARPEN
    # =========================================================

    def sharpen(self, image):
        """
        Controlled unsharp masking.
        """

        if image is None:
            raise ValueError(
                "Cannot sharpen an empty image."
            )

        blurred = cv2.GaussianBlur(
            image,
            (0, 0),
            sigmaX=1.0
        )

        return cv2.addWeighted(
            image,
            1.5,
            blurred,
            -0.5,
            0
        )

    # =========================================================
    # STEP 15 — THRESHOLD
    # =========================================================

    def threshold(self, image):
        """
        Adaptive thresholding for handwriting photographs.
        """

        if image is None:
            raise ValueError(
                "Cannot threshold an empty image."
            )

        gray = self.grayscale(
            image
        )

        blurred = cv2.GaussianBlur(
            gray,
            (3, 3),
            0
        )

        return cv2.adaptiveThreshold(
            blurred,
            255,
            cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY,
            31,
            11
        )

    # =========================================================
    # STEP 16 — EDGE DETECTION
    # =========================================================

    def edge_detection(self, image):
        """
        Detect edges using Canny.

        This is an intermediate representation and should
        not normally be sent directly to OCR.
        """

        if image is None:
            raise ValueError(
                "Cannot detect edges in an empty image."
            )

        gray = self.grayscale(
            image
        )

        blurred = cv2.GaussianBlur(
            gray,
            (5, 5),
            0
        )

        edges = cv2.Canny(
            blurred,
            50,
            150
        )

        return edges

    # =========================================================
    # STEP 17 — LINE DETECTION
    # =========================================================

    def detect_text_lines(self, image):
        """
        Detect approximate handwritten text-line regions.

        Returns a list of bounding boxes:

            [
                {
                    "x": ...,
                    "y": ...,
                    "width": ...,
                    "height": ...
                }
            ]

        The detected regions can later be sent individually
        to the OCR engine.
        """

        if image is None:
            raise ValueError(
                "Cannot detect text lines in an empty image."
            )

        gray = self.grayscale(
            image
        )

        # Binary image with handwriting as white
        binary = cv2.adaptiveThreshold(
            gray,
            255,
            cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY_INV,
            31,
            11
        )

        # Connect characters belonging to the same line.
        horizontal_kernel = cv2.getStructuringElement(
            cv2.MORPH_RECT,
            (25, 3)
        )

        connected = cv2.morphologyEx(
            binary,
            cv2.MORPH_CLOSE,
            horizontal_kernel
        )

        # Small cleanup
        connected = cv2.morphologyEx(
            connected,
            cv2.MORPH_OPEN,
            cv2.getStructuringElement(
                cv2.MORPH_RECT,
                (3, 3)
            )
        )

        contours, _ = cv2.findContours(
            connected,
            cv2.RETR_EXTERNAL,
            cv2.CHAIN_APPROX_SIMPLE
        )

        image_height, image_width = gray.shape[:2]

        lines = []

        for contour in contours:

            x, y, width, height = cv2.boundingRect(
                contour
            )

            area = width * height

            # Ignore tiny regions
            if area < image_width * image_height * 0.0001:
                continue

            # Ignore extremely small text fragments
            if width < 30 or height < 5:
                continue

            # Ignore extremely tall regions
            if height > image_height * 0.20:
                continue

            padding_x = 5
            padding_y = 5

            x1 = max(
                0,
                x - padding_x
            )

            y1 = max(
                0,
                y - padding_y
            )

            x2 = min(
                image_width,
                x + width + padding_x
            )

            y2 = min(
                image_height,
                y + height + padding_y
            )

            lines.append(
                {
                    "x": x1,
                    "y": y1,
                    "width": x2 - x1,
                    "height": y2 - y1
                }
            )

        # Sort top → bottom
        lines.sort(
            key=lambda item: (
                item["y"],
                item["x"]
            )
        )

        return lines

    # =========================================================
    # SAVE IMAGE
    # =========================================================

    def save_image(self, image, output_path):
        """
        Save processed image.
        """

        if image is None:
            raise ValueError(
                "Cannot save an empty image."
            )

        success = cv2.imwrite(
            output_path,
            image
        )

        if not success:
            raise ValueError(
                f"Unable to save processed image: "
                f"{output_path}"
            )

        return output_path

    # =========================================================
    # COMPLETE PIPELINE
    # =========================================================

    def process_image(
        self,
        input_path,
        output_path
    ):
        """
        Execute the complete processing pipeline.
        """

        image = self.load_image(
            input_path
        )

        image = self.validate_image(
            image
        )

        if self._enabled(
            "auto_brightness"
        ):
            image = self.auto_brightness(
                image
            )

        if self._enabled(
            "auto_contrast"
        ):
            image = self.auto_contrast(
                image
            )

        if self._enabled(
            "perspective"
        ):
            image = self.perspective_correction(
                image
            )

        if self._enabled(
            "deskew"
        ):
            image = self.deskew(
                image
            )

        if self._enabled(
            "denoise"
        ):
            image = self.noise_removal(
                image
            )

        if self._enabled(
            "shadow_removal"
        ):
            image = self.shadow_removal(
                image
            )

        if self._enabled(
            "background_cleaning"
        ):
            image = self.background_cleaning(
                image
            )

        if self._enabled(
            "sharpen"
        ):
            image = self.sharpen(
                image
            )

        if self._enabled(
            "threshold"
        ):
            image = self.threshold(
                image
            )

        self.save_image(
            image,
            output_path
        )

        return output_path

    # =========================================================
    # PROCESSING OPTION HELPER
    # =========================================================

    def _enabled(self, option_name):
        """
        Check whether a processing option is enabled.

        Supports Pydantic models and dictionaries.
        """

        if self.options is None:
            return True

        if hasattr(
            self.options,
            option_name
        ):

            value = getattr(
                self.options,
                option_name
            )

            if value is None:
                return True

            return bool(value)

        if isinstance(
            self.options,
            dict
        ):
            value = self.options.get(
                option_name
            )

            if value is None:
                return True

            return bool(value)

        return True