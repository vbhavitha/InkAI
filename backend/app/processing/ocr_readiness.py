import cv2
import numpy as np


class OCRReadinessAnalyzer:
    """
    Analyze an image and estimate how suitable it is
    for OCR processing.

    The score is heuristic-based and is intended to
    provide useful preprocessing feedback before the
    actual OCR stage.
    """

    def analyze(self, image):
        """
        Analyze the supplied image and return an OCR
        readiness report.
        """

        if image is None:
            raise ValueError(
                "Unable to analyze an empty image."
            )

        # -----------------------------------------------
        # Convert to grayscale
        # -----------------------------------------------

        if len(image.shape) == 3:
            gray = cv2.cvtColor(
                image,
                cv2.COLOR_BGR2GRAY
            )
        else:
            gray = image.copy()

        # -----------------------------------------------
        # Calculate individual metrics
        # -----------------------------------------------

        brightness_score, brightness_message = (
            self._analyze_brightness(gray)
        )

        contrast_score, contrast_message = (
            self._analyze_contrast(gray)
        )

        sharpness_score, sharpness_message = (
            self._analyze_sharpness(gray)
        )

        text_score, text_message = (
            self._analyze_text_visibility(gray)
        )

        page_score, page_message = (
            self._analyze_page_detection(image)
        )

        # -----------------------------------------------
        # Weighted overall score
        # -----------------------------------------------

        overall_score = (
            brightness_score * 0.20
            + contrast_score * 0.25
            + sharpness_score * 0.25
            + text_score * 0.20
            + page_score * 0.10
        )

        overall_score = int(
            max(
                0,
                min(100, overall_score)
            )
        )

        # -----------------------------------------------
        # Determine overall status
        # -----------------------------------------------

        status = self._get_status(
            overall_score
        )

        # -----------------------------------------------
        # Build checks for the frontend
        # -----------------------------------------------

        checks = [
            brightness_message,
            contrast_message,
            sharpness_message,
            text_message,
            page_message
        ]

        # -----------------------------------------------
        # Recommend Auto Enhance
        # -----------------------------------------------

        recommend_auto_enhance = (
            overall_score < 75
        )

        return {
            "score": overall_score,
            "status": status,
            "checks": checks,
            "recommend_auto_enhance": (
                recommend_auto_enhance
            ),
            "metrics": {
                "brightness": brightness_score,
                "contrast": contrast_score,
                "sharpness": sharpness_score,
                "text_visibility": text_score,
                "page_detection": page_score
            }
        }

    # =====================================================
    # BRIGHTNESS
    # =====================================================

    def _analyze_brightness(self, gray):
        """
        Evaluate whether the image is too dark or too
        bright based on mean pixel intensity.
        """

        mean_brightness = float(
            np.mean(gray)
        )

        # Ideal document brightness is roughly around
        # the middle-to-bright range.

        if 100 <= mean_brightness <= 220:
            return 100, {
                "name": "Good lighting",
                "status": "good",
                "message": "Image brightness is suitable."
            }

        if mean_brightness < 70:
            return 35, {
                "name": "Low lighting",
                "status": "warning",
                "message": "The image appears too dark."
            }

        if mean_brightness < 100:
            return 65, {
                "name": "Slightly dark",
                "status": "warning",
                "message": "Increasing brightness may help."
            }

        if mean_brightness > 245:
            return 60, {
                "name": "Very bright image",
                "status": "warning",
                "message": "Some handwriting may be difficult to see."
            }

        return 80, {
            "name": "Bright image",
            "status": "good",
            "message": "Lighting is generally acceptable."
        }

    # =====================================================
    # CONTRAST
    # =====================================================

    def _analyze_contrast(self, gray):
        """
        Estimate contrast using pixel intensity standard
        deviation.
        """

        contrast = float(
            np.std(gray)
        )

        if contrast >= 50:
            return 100, {
                "name": "Strong text contrast",
                "status": "good",
                "message": "Good separation between ink and paper."
            }

        if contrast >= 30:
            return 80, {
                "name": "Good contrast",
                "status": "good",
                "message": "Text should be reasonably visible."
            }

        if contrast >= 15:
            return 55, {
                "name": "Low contrast",
                "status": "warning",
                "message": "Contrast enhancement may improve OCR."
            }

        return 30, {
            "name": "Very low contrast",
            "status": "warning",
            "message": "Handwriting may be difficult to recognize."
        }

    # =====================================================
    # SHARPNESS / BLUR
    # =====================================================

    def _analyze_sharpness(self, gray):
        """
        Estimate sharpness using variance of the Laplacian.

        Lower values generally indicate blur.
        """

        laplacian_variance = float(
            cv2.Laplacian(
                gray,
                cv2.CV_64F
            ).var()
        )

        if laplacian_variance >= 150:
            return 100, {
                "name": "Low blur",
                "status": "good",
                "message": "The handwriting appears reasonably sharp."
            }

        if laplacian_variance >= 80:
            return 75, {
                "name": "Slight blur",
                "status": "warning",
                "message": "The image is slightly soft."
            }

        if laplacian_variance >= 40:
            return 50, {
                "name": "Blurry image",
                "status": "warning",
                "message": "Sharper input may improve OCR accuracy."
            }

        return 25, {
            "name": "High blur",
            "status": "warning",
            "message": "The image may be too blurry for reliable OCR."
        }

    # =====================================================
    # TEXT VISIBILITY
    # =====================================================

    def _analyze_text_visibility(self, gray):
        """
        Estimate whether there is sufficient dark ink
        information relative to the image.
        """

        # Otsu threshold gives us a rough separation
        # between darker content and background.
        _, binary = cv2.threshold(
            gray,
            0,
            255,
            cv2.THRESH_BINARY_INV
            + cv2.THRESH_OTSU
        )

        dark_pixel_ratio = float(
            np.count_nonzero(binary)
            / binary.size
        )

        # Handwritten pages normally contain a modest
        # percentage of dark pixels.

        if 0.01 <= dark_pixel_ratio <= 0.35:
            return 100, {
                "name": "Text is visible",
                "status": "good",
                "message": "A reasonable amount of ink detail was detected."
            }

        if dark_pixel_ratio < 0.01:
            return 40, {
                "name": "Very little visible text",
                "status": "warning",
                "message": "Handwriting may be too faint."
            }

        if dark_pixel_ratio > 0.60:
            return 45, {
                "name": "Heavy dark content",
                "status": "warning",
                "message": "Shadows or background noise may affect OCR."
            }

        return 70, {
            "name": "Text detected",
            "status": "good",
            "message": "Handwriting is visible but may need enhancement."
        }

    # =====================================================
    # PAGE DETECTION
    # =====================================================

    def _analyze_page_detection(self, image):
        """
        Perform a lightweight page-boundary check.

        This is only an OCR readiness indicator. It does
        not modify the image.
        """

        if image is None:
            return 0, {
                "name": "Page detection unavailable",
                "status": "warning",
                "message": "Unable to analyze page boundaries."
            }

        if len(image.shape) == 3:
            gray = cv2.cvtColor(
                image,
                cv2.COLOR_BGR2GRAY
            )
        else:
            gray = image.copy()

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

        contours, _ = cv2.findContours(
            edges,
            cv2.RETR_EXTERNAL,
            cv2.CHAIN_APPROX_SIMPLE
        )

        image_area = (
            image.shape[0]
            * image.shape[1]
        )

        for contour in contours:

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
                return 100, {
                    "name": "Page detected",
                    "status": "good",
                    "message": "A document boundary was detected."
                }

        return 60, {
            "name": "Page boundary unclear",
            "status": "warning",
            "message": "Perspective detection may be less reliable."
        }

    # =====================================================
    # STATUS
    # =====================================================

    def _get_status(
        self,
        score: int
    ):
        """
        Convert a numeric score into a user-friendly
        readiness status.
        """

        if score >= 85:
            return "Excellent"

        if score >= 70:
            return "Good"

        if score >= 50:
            return "Needs improvement"

        return "Poor"