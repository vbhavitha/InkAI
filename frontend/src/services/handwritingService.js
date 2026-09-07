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
 * Convert an API error response into a useful JavaScript Error.
 */
async function handleResponse(response) {
  if (response.ok) {
    return response.json();
  }

  let message = `Request failed with status ${response.status}`;

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
 * Render a handwriting document using the backend renderer.
 *
 * Expected backend request:
 *
 * {
 *   document_id: "...",
 *   style: "school_notebook",
 *   ink: "blue",
 *   paper: "ruled",
 *   font_size: 22,
 *   naturalness: 0.65,
 *   seed: 12345
 * }
 *
 * Expected response:
 *
 * {
 *   document_id: "...",
 *   pages: 4,
 *   preview_url: "...",
 *   status: "completed"
 * }
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

        // Backend expects naturalness between 0 and 1.
        naturalness:
          naturalness > 1
            ? naturalness / 100
            : naturalness,

        seed,
      }),
    }
  );

  return handleResponse(response);
}

/**
 * Get the rendered handwriting preview.
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
 * Generate the final handwriting PDF.
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
          naturalness > 1
            ? naturalness / 100
            : naturalness,
        seed,
        page_numbers: pageNumbers,
        quality,
      }),
    }
  );

  return handleResponse(response);
}

/**
 * Download the generated handwriting PDF.
 *
 * The backend may return either:
 * - a JSON object containing `download_url`
 * - or the PDF directly.
 */
export async function downloadHandwritingPDF(
  options
) {
  const result =
    await generateHandwritingPDF(options);

  if (result?.download_url) {
    window.open(
      result.download_url,
      "_blank",
      "noopener,noreferrer"
    );

    return result;
  }

  if (result?.url) {
    window.open(
      result.url,
      "_blank",
      "noopener,noreferrer"
    );

    return result;
  }

  return result;
}

/**
 * Get the URL for a generated handwriting file.
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
 * Convert a naturalness percentage from the UI
 * into the 0–1 value expected by the backend.
 */
export function normalizeNaturalness(
  naturalness
) {
  const value = Number(naturalness);

  if (!Number.isFinite(value)) {
    return 0.5;
  }

  if (value > 1) {
    return Math.max(
      0,
      Math.min(100, value)
    ) / 100;
  }

  return Math.max(
    0,
    Math.min(1, value)
  );
}

export default {
  renderHandwriting,
  getHandwritingPreview,
  generateHandwritingPDF,
  downloadHandwritingPDF,
  getHandwritingFileUrl,
  normalizeNaturalness,
};