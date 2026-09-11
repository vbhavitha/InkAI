const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://127.0.0.1:8000";

/**
 * Generate a PDF from an existing InkAI document.
 *
 * @param {Object} options
 * @returns {Promise<Object>}
 */
export async function generatePDF({
  documentId,
  pageSize = "A4",
  margins = "normal",
  orientation = "portrait",
  header = true,
  footer = true,
  pageNumbers = true,
  watermark = null,
  bookmarks = true,
  title = null,
  author = null,
  subject = null,
  keywords = null,
  customMargins = {},
  customWidthMm = null,
  customHeightMm = null,
}) {
  if (!documentId) {
    throw new Error(
      "documentId is required to generate the PDF."
    );
  }

  const response = await fetch(
    `${API_BASE_URL}/api/pdf/generate`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        document_id: Number(
          documentId
        ),

        page_size: pageSize,

        margins,

        orientation,

        header,

        footer,

        page_numbers: pageNumbers,

        watermark,

        bookmarks,

        title,

        author,

        subject,

        keywords,

        custom_margins: customMargins,

        custom_width_mm:
          customWidthMm,

        custom_height_mm:
          customHeightMm,
      }),
    }
  );

  const data =
    await response.json();

  if (!response.ok) {
    throw new Error(
      data?.detail ||
        "Failed to generate PDF."
    );
  }

  return data;
}


/**
 * Build the browser URL used to download a PDF.
 */
export function getPDFDownloadUrl(
  filename
) {
  if (!filename) {
    throw new Error(
      "PDF filename is required."
    );
  }

  return (
    `${API_BASE_URL}/api/pdf/download/` +
    encodeURIComponent(filename)
  );
}


/**
 * Build a browser preview URL.
 *
 * The browser's native PDF viewer handles:
 * - rendering
 * - page navigation
 * - zoom
 * - bookmarks
 */
export function getPDFPreviewUrl(
  filename,
  {
    page = 1,
    zoom = 100,
  } = {}
) {
  const baseUrl =
    getPDFDownloadUrl(
      filename
    );

  return (
    `${baseUrl}` +
    `#page=${page}` +
    `&zoom=${zoom}`
  );
}


export default {
  generatePDF,
  getPDFDownloadUrl,
  getPDFPreviewUrl,
};