const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://127.0.0.1:8000";

function buildUrl(path) {
  return `${API_BASE_URL.replace(/\/$/, "")}${path}`;
}


async function handleResponse(response) {
  const contentType =
    response.headers.get("content-type") || "";

  const data = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message =
      typeof data === "object" && data?.detail
        ? data.detail
        : `Request failed with status ${response.status}`;

    throw new Error(message);
  }

  return data;
}


// ============================================================
// CREATE
// ============================================================


export async function createHandwritingDocument({
  documentId,
  userId,
  style,
  font,
  inkColor,
  paperStyle,
  fontSize,
  lineSpacing,
  letterSpacing,
  naturalness,
  randomSeed,
}) {
  const response = await fetch(
    buildUrl("/api/handwriting/documents"),
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        document_id: Number(documentId),
        user_id: Number(userId),
        style,
        font,
        ink_color: inkColor,
        paper_style: paperStyle,
        font_size: fontSize,
        line_spacing: lineSpacing,
        letter_spacing: letterSpacing,
        naturalness:
          naturalness > 1
            ? naturalness / 100
            : naturalness,
        random_seed: randomSeed,
      }),
    }
  );

  return handleResponse(response);
}


// ============================================================
// GET
// ============================================================


export async function getHandwritingDocument(
  documentId,
  userId
) {
  const response = await fetch(
    buildUrl(
      `/api/handwriting/documents/${documentId}?user_id=${userId}`
    )
  );

  return handleResponse(response);
}


// ============================================================
// UPDATE
// ============================================================


export async function updateHandwritingDocument({
  documentId,
  userId,
  style,
  font,
  inkColor,
  paperStyle,
  fontSize,
  lineSpacing,
  letterSpacing,
  naturalness,
  randomSeed,
}) {
  const response = await fetch(
    buildUrl(
      `/api/handwriting/documents/${documentId}?user_id=${userId}`
    ),
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...(style !== undefined && {
          style,
        }),

        ...(font !== undefined && {
          font,
        }),

        ...(inkColor !== undefined && {
          ink_color: inkColor,
        }),

        ...(paperStyle !== undefined && {
          paper_style: paperStyle,
        }),

        ...(fontSize !== undefined && {
          font_size: fontSize,
        }),

        ...(lineSpacing !== undefined && {
          line_spacing: lineSpacing,
        }),

        ...(letterSpacing !== undefined && {
          letter_spacing: letterSpacing,
        }),

        ...(naturalness !== undefined && {
          naturalness:
            naturalness > 1
              ? naturalness / 100
              : naturalness,
        }),

        ...(randomSeed !== undefined && {
          random_seed: randomSeed,
        }),
      }),
    }
  );

  return handleResponse(response);
}


// ============================================================
// DELETE
// ============================================================


export async function deleteHandwritingDocument(
  documentId,
  userId
) {
  const response = await fetch(
    buildUrl(
      `/api/handwriting/documents/${documentId}?user_id=${userId}`
    ),
    {
      method: "DELETE",
    }
  );

  return handleResponse(response);
}

// ============================================================
// CONVERT DOCUMENT TO HANDWRITING DOCUMENT
// ============================================================

export function convertDocumentToHandwritingDocument(document) {
  if (!document) {
    return null;
  }

  const content =
    document.content ||
    document.content_json ||
    document.data ||
    document.document_content ||
    null;

  return {
    documentId:
      document.id ||
      document.document_id ||
      document._id ||
      "inkai-preview-document",

    title:
      document.title ||
      "Untitled Document",

    content,

    blocks:
      document.blocks ||
      content?.content ||
      [],

    metadata: {
      ...(
        document.metadata &&
        typeof document.metadata === "object"
          ? document.metadata
          : {}
      ),
    },
  };
}


export default {
  createHandwritingDocument,
  getHandwritingDocument,
  updateHandwritingDocument,
  deleteHandwritingDocument,
  convertDocumentToHandwritingDocument,
};