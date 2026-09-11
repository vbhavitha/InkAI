from dataclasses import dataclass
from typing import Tuple

from reportlab.lib import pagesizes
from reportlab.lib.pagesizes import landscape


# ============================================================
# PAGE SIZE
# ============================================================

PAGE_SIZES = {
    "A4": pagesizes.A4,
    "A5": pagesizes.A5,
    "LETTER": pagesizes.LETTER,
}


@dataclass
class PDFPageConfig:
    """
    Generic PDF page configuration.

    Units are ReportLab points.
    """

    page_size: str = "A4"
    orientation: str = "portrait"

    margin_top: float = 56
    margin_right: float = 50
    margin_bottom: float = 56
    margin_left: float = 50

    @property
    def dimensions(
        self,
    ) -> Tuple[float, float]:

        size = PAGE_SIZES.get(
            self.page_size.upper(),
            pagesizes.A4,
        )

        if (
            self.orientation.lower()
            == "landscape"
        ):
            return landscape(size)

        return size

    @property
    def width(self) -> float:
        return self.dimensions[0]

    @property
    def height(self) -> float:
        return self.dimensions[1]

    @property
    def content_width(self) -> float:
        return max(
            1,
            self.width
            - self.margin_left
            - self.margin_right,
        )

    @property
    def content_height(self) -> float:
        return max(
            1,
            self.height
            - self.margin_top
            - self.margin_bottom,
        )


def build_page_config(
    config: dict | None = None,
) -> PDFPageConfig:
    """
    Convert a generic page configuration
    dictionary into PDFPageConfig.
    """

    config = config or {}

    margins = (
        config.get("margins")
        or config.get("customMargins")
        or {}
    )

    return PDFPageConfig(
        page_size=str(
            config.get(
                "paperSize",
                config.get(
                    "pageSize",
                    "A4",
                ),
            )
        ).upper(),

        orientation=str(
            config.get(
                "orientation",
                "portrait",
            )
        ).lower(),

        margin_top=float(
            margins.get(
                "top",
                config.get(
                    "marginTop",
                    56,
                ),
            )
        ),

        margin_right=float(
            margins.get(
                "right",
                config.get(
                    "marginRight",
                    50,
                ),
            )
        ),

        margin_bottom=float(
            margins.get(
                "bottom",
                config.get(
                    "marginBottom",
                    56,
                ),
            )
        ),

        margin_left=float(
            margins.get(
                "left",
                config.get(
                    "marginLeft",
                    50,
                ),
            )
        ),
    )