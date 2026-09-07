const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://127.0.0.1:8000";

/**
 * Build the API URL safely.
 */
function buildUrl(path) {
  return `${API_BASE_URL.replace(/\/$/, "")}${path}`;
}

/**
 * Convert an API error response into a useful
 * JavaScript Error.
 */
async function handleResponse(response) {
  if (response.ok) {
    return response.json();
  }

  let message =
    `Request failed with status ${response.status}`;

  try {
    const errorData = await response.json();

    if (typeof errorData?.detail === "string") {
      message = errorData.detail;
    } else if (errorData?.message) {
      message = errorData.message;
    }
  } catch {
    // Keep the default error message.
  }

  throw new Error(message);
}


/**
 * Convert naturalness from UI percentage
 * into backend 0–1 representation.
 */
export function normalizeNaturalness(
  naturalness
) {
  const value = Number(naturalness);

  if (!Number.isFinite(value)) {
    return 0.5;
  }

  if (value > 1) {
    return (
      Math.max(
        0,
        Math.min(100, value)
      ) / 100
    );
  }

  return Math.max(
    0,
    Math.min(1, value)
  );
}


/**
 * Render a handwriting document using
 * the backend renderer.
 */
export async function renderHandwriting({
  documentId,
  style = "neat_student",
  ink = "blue",
  paper = "ruled",
  fontSize = 22,
  naturalness = 0.5,
  seed = 12345,
}) {
  if (!documentId) {
    throw new Error(
      "A document ID is required to render handwriting."
    );
  }

  const response = await fetch(
    buildUrl("/api/handwriting/render"),
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        document_id: documentId,
        style,
        ink,
        paper,
        font_size: fontSize,
        naturalness:
          normalizeNaturalness(naturalness),
        seed,
      }),
    }
  );

  return handleResponse(response);
}


/**
 * Get handwriting preview information.
 */
export async function getHandwritingPreview(
  documentId
) {
  if (!documentId) {
    throw new Error(
      "A document ID is required."
    );
  }

  const response = await fetch(
    buildUrl(
      `/api/handwriting/preview/${encodeURIComponent(
        documentId
      )}`
    )
  );

  return handleResponse(response);
}


/**
 * Upload a generated handwriting preview page.
 *
 * Expected input:
 *
 * {
 *   documentId,
 *   pageNumber,
 *   blob
 * }
 */
export async function saveHandwritingPreview({
  documentId,
  pageNumber,
  blob,
}) {
  if (!documentId) {
    throw new Error(
      "A document ID is required."
    );
  }

  if (!pageNumber || pageNumber < 1) {
    throw new Error(
      "A valid page number is required."
    );
  }

  if (!blob) {
    throw new Error(
      "A preview image is required."
    );
  }

  const formData = new FormData();

  formData.append(
    "document_id",
    String(documentId)
  );

  formData.append(
    "page_number",
    String(pageNumber)
  );

  formData.append(
    "file",
    blob,
    `page-${pageNumber}.png`
  );

  const response = await fetch(
    buildUrl("/api/handwriting/preview"),
    {
      method: "POST",
      body: formData,
    }
  );

  return handleResponse(response);
}


/**
 * Upload the final generated handwriting PNG.
 */
export async function exportHandwritingPNG({
  documentId,
  blob,
}) {
  if (!documentId) {
    throw new Error(
      "A document ID is required."
    );
  }

  if (!blob) {
    throw new Error(
      "A handwriting image is required."
    );
  }

  const formData = new FormData();

  formData.append(
    "document_id",
    String(documentId)
  );

  formData.append(
    "file",
    blob,
    "handwriting.png"
  );

  const response = await fetch(
    buildUrl("/api/handwriting/export/png"),
    {
      method: "POST",
      body: formData,
    }
  );

  return handleResponse(response);
}


/**
 * Generate the final handwriting PDF.
 *
 * The backend PDF renderer is currently
 * a Phase 7 placeholder.
 */
export async function generateHandwritingPDF({
  documentId,
  style = "neat_student",
  ink = "blue",
  paper = "ruled",
  fontSize = 22,
  naturalness = 0.5,
  seed = 12345,
  pageNumbers = true,
  quality = "high",
}) {
  if (!documentId) {
    throw new Error(
      "A document ID is required to generate the PDF."
    );
  }

  const response = await fetch(
    buildUrl("/api/handwriting/pdf"),
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        document_id: documentId,
        style,
        ink,
        paper,
        font_size: fontSize,
        naturalness:
          normalizeNaturalness(naturalness),
        seed,
        page_numbers: pageNumbers,
        quality,
      }),
    }
  );

  return handleResponse(response);
}


/**
 * Generate and open the final handwriting PDF.
 *
 * The current backend returns metadata only.
 * This function is ready for the future
 * PDF renderer.
 */
export async function downloadHandwritingPDF(
  options
) {
  const result =
    await generateHandwritingPDF(options);

  if (result?.download_url) {
    const url = getHandwritingFileUrl(
      result.download_url
    );

    window.open(
      url,
      "_blank",
      "noopener,noreferrer"
    );

    return result;
  }

  if (result?.url) {
    const url = getHandwritingFileUrl(
      result.url
    );

    window.open(
      url,
      "_blank",
      "noopener,noreferrer"
    );

    return result;
  }

  return result;
}


/**
 * Convert a generated handwriting file path
 * into a complete backend URL.
 */
export function getHandwritingFileUrl(
  filePath
) {
  if (!filePath) {
    return "";
  }

  if (
    filePath.startsWith("http://") ||
    filePath.startsWith("https://") ||
    filePath.startsWith("data:")
  ) {
    return filePath;
  }

  return buildUrl(
    filePath.startsWith("/")
      ? filePath
      : `/${filePath}`
  );
}


/**
 * Default export.
 */
export default {
  renderHandwriting,
  getHandwritingPreview,
  saveHandwritingPreview,
  exportHandwritingPNG,
  generateHandwritingPDF,
  downloadHandwritingPDF,
  getHandwritingFileUrl,
  normalizeNaturalness,
};