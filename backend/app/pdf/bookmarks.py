from reportlab.pdfgen.canvas import Canvas


class PDFBookmarks:
    """
    Small helper for reusable PDF bookmarks.
    """

    def __init__(
        self,
        canvas: Canvas,
    ):
        self.canvas = canvas

    def add_page(
        self,
        title: str,
        page_number: int,
    ):
        """
        Create a bookmark for a page.
        """

        if not title:
            title = f"Page {page_number}"

        key = (
            f"page-{page_number}"
        )

        self.canvas.bookmarkPage(
            key
        )

        self.canvas.addOutlineEntry(
            title,
            key,
            level=0,
            closed=False,
        )