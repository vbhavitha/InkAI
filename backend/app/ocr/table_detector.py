from typing import List, Dict, Any, Optional, Tuple

import cv2
import numpy as np


class OCRTableDetector:
    """
    Detect simple ruled tables using horizontal and vertical
    lines detected with OpenCV.

    This is intentionally designed for the InkAI MVP.
    It is not intended to detect complex borderless tables.
    """

    def __init__(self):
        self.min_horizontal_line_ratio = 0.15
        self.min_vertical_line_ratio = 0.15

    # ---------------------------------------------------------
    # Image preparation
    # ---------------------------------------------------------

    def _prepare_image(self, image: np.ndarray) -> np.ndarray:
        """
        Convert image to a binary representation suitable
        for detecting table lines.
        """

        if image is None:
            raise ValueError("Invalid image supplied.")

        if len(image.shape) == 3:
            gray = cv2.cvtColor(
                image,
                cv2.COLOR_BGR2GRAY
            )
        else:
            gray = image.copy()

        # Invert threshold so dark lines become white.
        binary = cv2.adaptiveThreshold(
            gray,
            255,
            cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY_INV,
            15,
            8
        )

        return binary

    # ---------------------------------------------------------
    # Horizontal lines
    # ---------------------------------------------------------

    def _detect_horizontal_lines(
        self,
        binary: np.ndarray
    ) -> np.ndarray:
        """
        Detect horizontal ruled lines.
        """

        height, width = binary.shape

        kernel_width = max(
            10,
            width // 20
        )

        kernel = cv2.getStructuringElement(
            cv2.MORPH_RECT,
            (kernel_width, 1)
        )

        horizontal = cv2.morphologyEx(
            binary,
            cv2.MORPH_OPEN,
            kernel
        )

        return horizontal

    # ---------------------------------------------------------
    # Vertical lines
    # ---------------------------------------------------------

    def _detect_vertical_lines(
        self,
        binary: np.ndarray
    ) -> np.ndarray:
        """
        Detect vertical ruled lines.
        """

        height, width = binary.shape

        kernel_height = max(
            10,
            height // 20
        )

        kernel = cv2.getStructuringElement(
            cv2.MORPH_RECT,
            (1, kernel_height)
        )

        vertical = cv2.morphologyEx(
            binary,
            cv2.MORPH_OPEN,
            kernel
        )

        return vertical

    # ---------------------------------------------------------
    # Line coordinates
    # ---------------------------------------------------------

    @staticmethod
    def _extract_horizontal_positions(
        horizontal: np.ndarray
    ) -> List[int]:
        """
        Extract Y coordinates of horizontal lines.
        """

        projection = np.sum(
            horizontal > 0,
            axis=1
        )

        positions = []

        threshold = max(
            5,
            horizontal.shape[1] * 0.15
        )

        active = False
        start = 0

        for y, value in enumerate(projection):

            if value >= threshold and not active:
                active = True
                start = y

            elif value < threshold and active:
                active = False

                center = (start + y - 1) // 2
                positions.append(center)

        if active:
            center = (
                start + len(projection) - 1
            ) // 2
            positions.append(center)

        return positions

    @staticmethod
    def _extract_vertical_positions(
        vertical: np.ndarray
    ) -> List[int]:
        """
        Extract X coordinates of vertical lines.
        """

        projection = np.sum(
            vertical > 0,
            axis=0
        )

        positions = []

        threshold = max(
            5,
            vertical.shape[0] * 0.15
        )

        active = False
        start = 0

        for x, value in enumerate(projection):

            if value >= threshold and not active:
                active = True
                start = x

            elif value < threshold and active:
                active = False

                center = (start + x - 1) // 2
                positions.append(center)

        if active:
            center = (
                start + len(projection) - 1
            ) // 2
            positions.append(center)

        return positions

    # ---------------------------------------------------------
    # Remove duplicate coordinates
    # ---------------------------------------------------------

    @staticmethod
    def _merge_close_positions(
        positions: List[int],
        tolerance: int = 8
    ) -> List[int]:
        """
        Merge line coordinates that are very close together.
        """

        if not positions:
            return []

        positions = sorted(positions)

        merged = []
        current_group = [positions[0]]

        for position in positions[1:]:

            if abs(
                position - current_group[-1]
            ) <= tolerance:
                current_group.append(position)

            else:
                merged.append(
                    int(
                        sum(current_group)
                        / len(current_group)
                    )
                )

                current_group = [position]

        merged.append(
            int(
                sum(current_group)
                / len(current_group)
            )
        )

        return merged

    # ---------------------------------------------------------
    # Find cells
    # ---------------------------------------------------------

    def _find_cells(
        self,
        horizontal_positions: List[int],
        vertical_positions: List[int],
        image_width: int,
        image_height: int
    ) -> List[Dict[str, Any]]:
        """
        Build cell rectangles from adjacent horizontal
        and vertical lines.
        """

        if (
            len(horizontal_positions) < 2
            or len(vertical_positions) < 2
        ):
            return []

        cells = []

        rows = len(horizontal_positions) - 1
        columns = len(vertical_positions) - 1

        for row in range(rows):

            y1 = horizontal_positions[row]
            y2 = horizontal_positions[row + 1]

            if y2 <= y1:
                continue

            for column in range(columns):

                x1 = vertical_positions[column]
                x2 = vertical_positions[column + 1]

                if x2 <= x1:
                    continue

                cell_width = x2 - x1
                cell_height = y2 - y1

                # Ignore tiny regions.
                if cell_width < 20:
                    continue

                if cell_height < 15:
                    continue

                # Ignore cells that are basically the whole page.
                if cell_width > image_width * 0.95:
                    continue

                if cell_height > image_height * 0.95:
                    continue

                cells.append({
                    "row": row,
                    "column": column,
                    "x": x1,
                    "y": y1,
                    "width": cell_width,
                    "height": cell_height,
                    "bounding_box": [
                        [x1, y1],
                        [x2, y1],
                        [x2, y2],
                        [x1, y2],
                    ],
                })

        return cells

    # ---------------------------------------------------------
    # Table detection
    # ---------------------------------------------------------

    def detect_tables(
        self,
        image: np.ndarray
    ) -> List[Dict[str, Any]]:
        """
        Detect simple ruled tables in an image.

        Returns table geometry and cell geometry.
        """

        if image is None:
            return []

        height, width = image.shape[:2]

        binary = self._prepare_image(image)

        horizontal = self._detect_horizontal_lines(
            binary
        )

        vertical = self._detect_vertical_lines(
            binary
        )

        horizontal_positions = (
            self._extract_horizontal_positions(
                horizontal
            )
        )

        vertical_positions = (
            self._extract_vertical_positions(
                vertical
            )
        )

        horizontal_positions = (
            self._merge_close_positions(
                horizontal_positions
            )
        )

        vertical_positions = (
            self._merge_close_positions(
                vertical_positions
            )
        )

        # A simple table needs at least:
        #
        # 2 horizontal lines
        # 2 vertical lines
        #
        if (
            len(horizontal_positions) < 2
            or len(vertical_positions) < 2
        ):
            return []

        cells = self._find_cells(
            horizontal_positions,
            vertical_positions,
            width,
            height,
        )

        if not cells:
            return []

        rows = max(
            cell["row"]
            for cell in cells
        ) + 1

        columns = max(
            cell["column"]
            for cell in cells
        ) + 1

        return [{
            "rows": rows,
            "columns": columns,
            "bounding_box": [
                [
                    vertical_positions[0],
                    horizontal_positions[0]
                ],
                [
                    vertical_positions[-1],
                    horizontal_positions[0]
                ],
                [
                    vertical_positions[-1],
                    horizontal_positions[-1]
                ],
                [
                    vertical_positions[0],
                    horizontal_positions[-1]
                ],
            ],
            "cells": cells,
        }]

    def crop_cell(
        self,
        image: np.ndarray,
        cell: Dict[str, Any],
        padding: int = 4
    ) -> np.ndarray:
        """
        Crop a table cell from the image.
        """

        height, width = image.shape[:2]

        x = max(
            0,
            cell["x"] + padding
        )

        y = max(
            0,
            cell["y"] + padding
        )

        x2 = min(
            width,
            cell["x"] + cell["width"] - padding
        )

        y2 = min(
            height,
            cell["y"] + cell["height"] - padding
        )

        if x2 <= x or y2 <= y:
            return np.empty((0, 0), dtype=np.uint8)

        return image[y:y2, x:x2]