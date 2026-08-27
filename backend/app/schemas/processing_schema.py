from typing import Dict, List, Optional

from pydantic import BaseModel


# =========================================================
# PROCESSING OPTIONS
# =========================================================

class ProcessingOptions(BaseModel):
    """
    Image-processing options for INK AI.

    None means the user did not explicitly specify
    the setting.
    """

    preset: Optional[str] = None

    auto_brightness: Optional[bool] = None

    auto_contrast: Optional[bool] = None

    perspective: Optional[bool] = None

    deskew: Optional[bool] = None

    denoise: Optional[bool] = None

    shadow_removal: Optional[bool] = None

    background_cleaning: Optional[bool] = None

    sharpen: Optional[bool] = None

    threshold: Optional[bool] = None


# =========================================================
# IMAGE INFORMATION
# =========================================================

class ImageInfo(BaseModel):
    filename: str
    path: str


# =========================================================
# LINE REGION
# =========================================================

class LineRegion(BaseModel):
    x: int
    y: int
    width: int
    height: int


# =========================================================
# LINE DETECTION RESPONSE
# =========================================================

class LineDetectionResponse(BaseModel):
    count: int
    regions: List[LineRegion]


# =========================================================
# PROCESSING STATUS
# =========================================================

class ProcessingStatus(BaseModel):
    status: str
    steps: Dict[str, str]

class ThumbnailInfo(BaseModel):
    filename: str
    path: str


# =========================================================
# PROCESSING RESPONSE
# =========================================================

class ProcessingResponse(BaseModel):
    success: bool

    file_id: str

    preset: Optional[str] = None

    original: ImageInfo

    processed: ImageInfo

    thumbnail: ThumbnailInfo

    processing: ProcessingStatus

    settings: Dict[str, bool]

    line_detection: LineDetectionResponse

    message: str