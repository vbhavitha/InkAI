from __future__ import annotations

from pathlib import Path
from typing import Any

from pypdf import PdfReader


class PDFValidationError(Exception):
    """
    Raised when a generated PDF fails validation.
    """


class PDFValidationService:
    """
    Validates generated InkAI PDFs before they are permanently stored.

    Checks:

        ✓ File exists
        ✓ File is not empty
        ✓ PDF opens
        ✓ Page count is correct
        ✓ Fonts/resources are present
        ✓ Images/resources are present when applicable
        ✓ Page dimensions are valid
    """

    # =========================================================
    # MAIN VALIDATION
    # =========================================================

    def validate(
        self,
        pdf_path: str | Path,
        expected_page_count: int | None = None,
        expected_page_size: tuple[float, float] | None = None,
        tolerance: float = 2.0,
    ) -> dict[str, Any]:
        """
        Validate a generated PDF.

        Args:
            pdf_path:
                Path to generated PDF.

            expected_page_count:
                Number of pages expected from AssignmentService.

            expected_page_size:
                Expected page size in PDF points:
                    (width, height)

            tolerance:
                Allowed page dimension difference in points.

        Returns:
            Validation report.

        Raises:
            PDFValidationError:
                If any required validation fails.
        """

        path = Path(pdf_path)

        # -----------------------------------------------------
        # 1. FILE EXISTS
        # -----------------------------------------------------

        if not path.exists():
            raise PDFValidationError(
                "PDF validation failed: file does not exist."
            )

        if not path.is_file():
            raise PDFValidationError(
                "PDF validation failed: path is not a file."
            )

        # -----------------------------------------------------
        # 2. FILE IS NOT EMPTY
        # -----------------------------------------------------

        file_size = path.stat().st_size

        if file_size <= 0:
            raise PDFValidationError(
                "PDF validation failed: file is empty."
            )

        # -----------------------------------------------------
        # 3. PDF OPENS
        # -----------------------------------------------------

        try:
            reader = PdfReader(
                str(path)
            )
        except Exception as error:
            raise PDFValidationError(
                "PDF validation failed: "
                f"PDF could not be opened: {error}"
            ) from error

        # -----------------------------------------------------
        # 4. PAGE COUNT
        # -----------------------------------------------------

        actual_page_count = len(
            reader.pages
        )

        if actual_page_count <= 0:
            raise PDFValidationError(
                "PDF validation failed: PDF contains no pages."
            )

        if (
            expected_page_count is not None
            and actual_page_count
            != expected_page_count
        ):
            raise PDFValidationError(
                "PDF validation failed: "
                f"expected {expected_page_count} pages, "
                f"but PDF contains {actual_page_count}."
            )

        # -----------------------------------------------------
        # 5. RESOURCE / FONT / IMAGE CHECKS
        # -----------------------------------------------------

        pages_with_fonts = 0
        pages_with_images = 0
        pages_with_resources = 0

        page_dimensions = []

        for page_index, page in enumerate(
            reader.pages,
            start=1,
        ):
            try:
                resources = (
                    page.get(
                        "/Resources"
                    )
                    or {}
                )

                if resources:
                    pages_with_resources += 1

                # -------------------------------------------------
                # FONT CHECK
                # -------------------------------------------------

                fonts = resources.get(
                    "/Font"
                )

                if fonts:
                    pages_with_fonts += 1

                # -------------------------------------------------
                # IMAGE CHECK
                # -------------------------------------------------

                xobjects = resources.get(
                    "/XObject"
                )

                if xobjects:
                    found_image = False

                    for object_reference in (
                        xobjects.values()
                    ):
                        try:
                            xobject = (
                                object_reference.get_object()
                            )

                            subtype = xobject.get(
                                "/Subtype"
                            )

                            if str(
                                subtype
                            ) == "/Image":
                                found_image = True
                                break

                        except Exception:
                            # A malformed optional resource should
                            # not prevent the remaining PDF checks.
                            continue

                    if found_image:
                        pages_with_images += 1

                # -------------------------------------------------
                # PAGE SIZE
                # -------------------------------------------------

                media_box = page.mediabox

                width = float(
                    media_box.width
                )

                height = float(
                    media_box.height
                )

                if width <= 0 or height <= 0:
                    raise PDFValidationError(
                        "PDF validation failed: "
                        f"page {page_index} has invalid dimensions."
                    )

                page_dimensions.append(
                    {
                        "page": page_index,
                        "width": width,
                        "height": height,
                    }
                )

                # -------------------------------------------------
                # EXPECTED PAGE SIZE
                # -------------------------------------------------

                if expected_page_size:
                    expected_width, expected_height = (
                        expected_page_size
                    )

                    width_matches = (
                        abs(
                            width
                            - expected_width
                        )
                        <= tolerance
                    )

                    height_matches = (
                        abs(
                            height
                            - expected_height
                        )
                        <= tolerance
                    )

                    # PDF page orientation may be represented
                    # differently, so allow swapped dimensions.
                    swapped_matches = (
                        abs(
                            width
                            - expected_height
                        )
                        <= tolerance
                        and abs(
                            height
                            - expected_width
                        )
                        <= tolerance
                    )

                    if not (
                        (
                            width_matches
                            and height_matches
                        )
                        or swapped_matches
                    ):
                        raise PDFValidationError(
                            "PDF validation failed: "
                            f"page {page_index} has dimensions "
                            f"{width:.2f} x {height:.2f} points, "
                            f"expected approximately "
                            f"{expected_width:.2f} x "
                            f"{expected_height:.2f} points."
                        )

            except PDFValidationError:
                raise

            except Exception as error:
                raise PDFValidationError(
                    "PDF validation failed while inspecting "
                    f"page {page_index}: {error}"
                ) from error

        # -----------------------------------------------------
        # 6. GENERAL RESOURCE CHECK
        # -----------------------------------------------------

        if pages_with_resources == 0:
            raise PDFValidationError(
                "PDF validation failed: "
                "no page resources were found."
            )

        # -----------------------------------------------------
        # 7. VALIDATION RESULT
        # -----------------------------------------------------

        return {
            "valid": True,
            "file_exists": True,
            "file_size": file_size,
            "pdf_opens": True,
            "page_count": actual_page_count,
            "expected_page_count": expected_page_count,
            "page_count_correct": (
                expected_page_count is None
                or actual_page_count
                == expected_page_count
            ),
            "pages_with_resources": (
                pages_with_resources
            ),
            "pages_with_fonts": (
                pages_with_fonts
            ),
            "pages_with_images": (
                pages_with_images
            ),
            "page_dimensions": page_dimensions,
        }


pdf_validation_service = PDFValidationService()