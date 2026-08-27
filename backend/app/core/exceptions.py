class ImageProcessingError(Exception):
    """
    Base exception for image-processing errors.
    """


class InvalidImageError(ImageProcessingError):
    """
    Raised when an image is invalid or cannot be processed.
    """


class CorruptedImageError(ImageProcessingError):
    """
    Raised when an image cannot be decoded correctly.
    """


class ImageTooLargeError(ImageProcessingError):
    """
    Raised when an image resolution exceeds the allowed limit.
    """