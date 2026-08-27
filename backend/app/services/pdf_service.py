import os
import uuid
import fitz


BASE_DIR = os.path.dirname(
    os.path.dirname(
        os.path.dirname(__file__)
    )
)


PROCESSED_FOLDER = os.path.join(
    BASE_DIR,
    "uploads",
    "processed"
)


def extract_pdf_pages(
    pdf_path,
    file_id
):

    os.makedirs(
        PROCESSED_FOLDER,
        exist_ok=True
    )

    document = fitz.open(pdf_path)

    pages = []

    for page_number in range(
        len(document)
    ):

        page = document.load_page(
            page_number
        )

        pixmap = page.get_pixmap(
            matrix=fitz.Matrix(2, 2),
            alpha=False
        )

        page_id = str(
            uuid.uuid4()
        )

        filename = (
            f"{file_id}_page_"
            f"{page_number + 1}_"
            f"{page_id}.png"
        )

        filepath = os.path.join(
            PROCESSED_FOLDER,
            filename
        )

        pixmap.save(
            filepath
        )

        pages.append({

            "page": page_number + 1,

            "filename": filename,

            "size": os.path.getsize(
                filepath
            )

        })

    document.close()

    return pages