const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://127.0.0.1:8000";

/*
 * ============================================================
 * HELPERS
 * ============================================================
 */

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

/*
 * ============================================================
 * PHASE 6 DOCUMENT
 * ============================================================
 *
 * The Assignment Generator must consume the complete
 * structured Phase 6 document.
 *
 * IMPORTANT:
 * Do not convert this to plain text.
 *
 * The following structures are preserved:
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

  const content =
    document.content ||
    document.content_json ||
    document.document_content ||
    document.data ||
    null;

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
   * TipTap document
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
   * If the backend already returned blocks,
   * preserve them.
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
      ...assignment,
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

export default {
  normalizePhase6Document,
  getPhase6Document,
  createAssignmentDocument,
  createHandwritingAssignmentPayload,
};

// ============================================================
// STEP 17 / 18 — PAGINATE ASSIGNMENT FOR LIVE PREVIEW
// ============================================================

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

        assignment: assignment || {},

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