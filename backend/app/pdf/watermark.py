from reportlab.pdfgen.canvas import Canvas


def draw_watermark(
    canvas: Canvas,
    text: str,
    width: float,
    height: float,
):
    """
    Draw a subtle centered watermark.
    """

    if not text:
        return

    canvas.saveState()

    canvas.setFillAlpha(0.08)

    canvas.translate(
        width / 2,
        height / 2,
    )

    canvas.rotate(45)

    canvas.setFont(
        "Helvetica",
        32,
    )

    text_width = (
        canvas.stringWidth(
            text,
            "Helvetica",
            32,
        )
    )

    canvas.drawString(
        -text_width / 2,
        0,
        text,
    )

    canvas.restoreState()