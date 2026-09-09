const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://127.0.0.1:8000";

/*
 * ============================================================
 * HELPERS
 * ============================================================
 */

function buildUrl(path) {
  if (!path) {
    return API_BASE_URL.replace(/\/$/, "");
  }

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  return `${API_BASE_URL.replace(/\/$/, "")}${
    path.startsWith("/") ? path : `/${path}`
  }`;
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
        : typeof data === "string" && data
          ? data
          : `Request failed with status ${response.status}`;

    throw new Error(message);
  }

  return data;
}

/*
 * ============================================================
 * PHASE 6 DOCUMENT
 * ============================================================
 *
 * The Assignment Generator consumes the complete structured
 * Phase 6 document.
 *
 * IMPORTANT:
 * Do not convert this to plain text.
 *
 * Preserved structures:
 *
 * - paragraph
 * - heading
 * - bulletList
 * - orderedList
 * - table
 * - image
 * - pageBreak
 * - formatting marks
 */

export function normalizePhase6Document(document) {
  if (!document) {
    return null;
  }

  let content =
    document.content ??
    document.content_json ??
    document.document_content ??
    document.data ??
    null;

  /*
   * Some backend responses may store TipTap JSON as a string.
   */
  if (typeof content === "string") {
    try {
      content = JSON.parse(content);
    } catch {
      throw new Error(
        "The saved Phase 6 document contains invalid JSON."
      );
    }
  }

  if (!content) {
    return null;
  }

  /*
   * TipTap document:
   *
   * {
   *   type: "doc",
   *   content: [...]
   * }
   */
  if (content.type === "doc") {
    return {
      ...document,
      content,
      blocks: content.content || [],
    };
  }

  /*
   * If the backend returned an array of blocks,
   * wrap it in a TipTap document.
   */
  if (Array.isArray(content)) {
    return {
      ...document,
      content: {
        type: "doc",
        content,
      },
      blocks: content,
    };
  }

  /*
   * Fallback for a structured object that already contains
   * its own content/blocks representation.
   */
  return {
    ...document,
    content,
    blocks:
      document.blocks ||
      content?.content ||
      [],
  };
}

/*
 * ============================================================
 * FETCH PHASE 6 DOCUMENT
 * ============================================================
 */

export async function getPhase6Document(documentId) {
  if (!documentId) {
    throw new Error(
      "Document ID is required."
    );
  }

  const response = await fetch(
    buildUrl(`/api/documents/${documentId}`)
  );

  return handleResponse(response);
}

/*
 * ============================================================
 * ASSIGNMENT DOCUMENT
 * ============================================================
 *
 * Combines:
 *
 * Phase 6 structured content
 * +
 * Phase 8 assignment configuration
 */

export function createAssignmentDocument({
  phase6Document,
  assignment,
}) {
  const normalizedDocument =
    normalizePhase6Document(
      phase6Document
    );

  if (!normalizedDocument) {
    throw new Error(
      "Phase 6 document is not available."
    );
  }

  return {
    documentId:
      normalizedDocument.id ||
      normalizedDocument.document_id ||
      null,

    title:
      assignment?.title ||
      normalizedDocument.title ||
      "Untitled Assignment",

    content:
      normalizedDocument.content,

    blocks:
      normalizedDocument.blocks,

    assignment: {
      ...(assignment || {}),
    },
  };
}

/*
 * ============================================================
 * HANDWRITING PAYLOAD
 * ============================================================
 *
 * Phase 8 -> Phase 7
 */

export function createHandwritingAssignmentPayload({
  phase6Document,
  assignment,
  handwriting,
}) {
  const assignmentDocument =
    createAssignmentDocument({
      phase6Document,
      assignment,
    });

  return {
    document: {
      id: assignmentDocument.documentId,
      title: assignmentDocument.title,
      content: assignmentDocument.content,
      blocks: assignmentDocument.blocks,
    },

    assignment:
      assignmentDocument.assignment,

    handwriting: {
      style:
        handwriting?.style ||
        "school_notebook",

      font:
        handwriting?.font ||
        "school_notebook",

      ink:
        handwriting?.ink ||
        "blue",

      paper:
        handwriting?.paper ||
        "ruled",

      fontSize:
        handwriting?.fontSize ??
        22,

      lineSpacing:
        handwriting?.lineSpacing ??
        1.5,

      letterSpacing:
        handwriting?.letterSpacing ??
        0.5,

      wordSpacing:
        handwriting?.wordSpacing ??
        5,

      naturalness:
        handwriting?.naturalness ??
        65,

      seed:
        handwriting?.seed ??
        12345,
    },
  };
}

/*
 * ============================================================
 * STEP 17 / 18 — PAGINATE ASSIGNMENT
 * ============================================================
 */

export async function paginateAssignment({
  document,
  assignment,
}) {
  if (!document) {
    return {
      pages: [
        {
          pageNumber: 1,
          nodes: [],
        },
      ],
      pageCount: 1,
    };
  }

  const response = await fetch(
    buildUrl("/api/assignments/paginate"),
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        document,

        assignment:
          assignment || {},

        page: {
          paperSize:
            assignment?.paperSize ||
            "A4",

          orientation:
            assignment?.orientation ||
            "portrait",

          marginPreset:
            assignment?.marginPreset ||
            "normal",

          customMargins:
            assignment?.customMargins || {
              top: 56,
              right: 50,
              bottom: 56,
              left: 50,
            },
        },
      }),
    }
  );

  return handleResponse(response);
}

/*
 * ============================================================
 * GENERATE ASSIGNMENT PDF
 * ============================================================
 */

export async function generateAssignmentPDF({
  documentId,
  draftId,
  template,
  paper,
  handwritingStyle,
  ink,
  pageNumbers,
  assignment,
  handwriting,
}) {
  if (!documentId) {
    throw new Error(
      "Document ID is required."
    );
  }

  const response = await fetch(
    buildUrl(
      "/api/assignments/generate"
    ),
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      body: JSON.stringify({
        document_id:
          String(documentId),

        draft_id:
          draftId || null,

        template:
          template ||
          "college_assignment",

        paper:
          paper ||
          "ruled",

        handwriting_style:
          handwritingStyle ||
          "school_notebook",

        ink:
          ink ||
          "blue",

        page_numbers:
          pageNumbers !== false,

        assignment:
          assignment || {},

        handwriting:
          handwriting || {},
      }),
    }
  );

  const result =
    await handleResponse(response);

  /*
   * Convert relative backend download URLs
   * into complete URLs.
   */
  if (result?.download_url) {
    return {
      ...result,
      download_url:
        buildUrl(result.download_url),
    };
  }

  return result;
}

/*
 * ============================================================
 * STEP 25 — REGENERATE ASSIGNMENT
 * ============================================================
 */

export async function regenerateAssignment({
  assignmentId,
  paper,
  handwritingStyle,
  ink,
  pageNumbers,
  assignment,
  handwriting,
}) {
  if (!assignmentId) {
    throw new Error(
      "Assignment ID is required."
    );
  }

  const response = await fetch(
    buildUrl(
      `/api/assignments/${assignmentId}/regenerate`
    ),
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      body: JSON.stringify({
        paper:
          paper || undefined,

        handwriting_style:
          handwritingStyle ||
          undefined,

        ink:
          ink || undefined,

        page_numbers:
          pageNumbers !== undefined
            ? pageNumbers
            : true,

        assignment:
          assignment || {},

        handwriting:
          handwriting || {},
      }),
    }
  );

  const result =
    await handleResponse(response);

  if (result?.download_url) {
    return {
      ...result,
      download_url:
        buildUrl(result.download_url),
    };
  }

  return result;
}

/*
 * ============================================================
 * STEP 26 — DUPLICATE ASSIGNMENT
 * ============================================================
 */

export async function duplicateAssignment(
  assignmentId,
  title
) {
  if (!assignmentId) {
    throw new Error(
      "Assignment ID is required."
    );
  }

  const response = await fetch(
    buildUrl(
      `/api/assignments/${assignmentId}/duplicate`
    ),
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      body: JSON.stringify({
        title:
          title || undefined,
      }),
    }
  );

  const result =
    await handleResponse(response);

  if (result?.download_url) {
    return {
      ...result,
      download_url:
        buildUrl(result.download_url),
    };
  }

  return result;
}

/*
 * ============================================================
 * STEP 31 — SAVE ASSIGNMENT DRAFT
 * ============================================================
 *
 * If draftId exists:
 *     update existing draft
 *
 * If draftId does not exist:
 *     create a new draft
 */

export async function saveAssignmentDraft({
  draftId,
  documentId,
  template,
  paper,
  handwritingStyle,
  ink,
  pageNumbers,
  assignment,
  handwriting,
}) {
  if (!documentId) {
    throw new Error(
      "Document ID is required to save a draft."
    );
  }

  const response = await fetch(
    buildUrl("/api/assignments/draft"),
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      body: JSON.stringify({
        draft_id:
          draftId || null,

        document_id:
          String(documentId),

        template:
          template ||
          "college_assignment",

        paper:
          paper ||
          "ruled",

        handwriting_style:
          handwritingStyle ||
          "school_notebook",

        ink:
          ink ||
          "blue",

        page_numbers:
          pageNumbers !== false,

        assignment:
          assignment || {},

        handwriting:
          handwriting || {},
      }),
    }
  );

  return handleResponse(response);
}

/*
 * ============================================================
 * STEP 31 — GET ASSIGNMENT DRAFT
 * ============================================================
 *
 * Used by AssignmentHistoryPage when
 * "Continue Editing" is clicked.
 */

export async function getAssignmentDraft(
  assignmentId
) {
  if (!assignmentId) {
    throw new Error(
      "Assignment ID is required."
    );
  }

  const response = await fetch(
    buildUrl(
      `/api/assignments/${assignmentId}/draft`
    )
  );

  return handleResponse(response);
}

/*
 * ============================================================
 * DEFAULT EXPORT
 * ============================================================
 */

export default {
  normalizePhase6Document,
  getPhase6Document,
  createAssignmentDocument,
  createHandwritingAssignmentPayload,
  paginateAssignment,
  generateAssignmentPDF,
  regenerateAssignment,
  duplicateAssignment,
  saveAssignmentDraft,
  getAssignmentDraft,
};