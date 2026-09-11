from reportlab.pdfgen.canvas import Canvas


def apply_metadata(
    canvas: Canvas,
    *,
    title: str | None = None,
    author: str | None = None,
    subject: str | None = None,
    keywords: str | None = None,
):
    """
    Apply reusable PDF metadata.
    """

    if title:
        canvas.setTitle(
            str(title)
        )

    if author:
        canvas.setAuthor(
            str(author)
        )

    if subject:
        canvas.setSubject(
            str(subject)
        )

    if keywords:
        canvas.setKeywords(
            str(keywords)
        )

    canvas.setCreator(
        "InkAI"
    )