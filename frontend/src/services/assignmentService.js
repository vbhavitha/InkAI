const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://127.0.0.1:8000";

/*
 * ============================================================
 * BASE API HELPERS
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
    let message =
      `Request failed with status ${response.status}`;

    if (
      typeof data === "object" &&
      data !== null
    ) {
      if (typeof data.detail === "string") {
        message = data.detail;
      } else if (Array.isArray(data.detail)) {
        message = data.detail
          .map((item) => {
            if (typeof item === "string") {
              return item;
            }

            return (
              item?.msg ||
              JSON.stringify(item)
            );
          })
          .join(", ");
      }
    } else if (
      typeof data === "string" &&
      data.trim()
    ) {
      message = data;
    }

    throw new Error(message);
  }

  return data;
}

/*
 * ============================================================
 * AI TOOLS — GRAMMAR CORRECTION
 * ============================================================
 *
 * Endpoint:
 *   POST /api/ai/grammar
 *
 * Request:
 *   {
 *     text: "..."
 *   }
 *
 * Response:
 *   {
 *     result: "..."
 *   }
 */

export async function correctGrammar(text) {
  if (!text || !text.trim()) {
    throw new Error("Text is required.");
  }

  const response = await fetch(
    buildUrl("/api/ai/grammar"),
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        text: text.trim(),
      }),
    }
  );

  return handleResponse(response);
}

/*
 * ============================================================
 * AI TOOLS — REWRITE NOTES
 * ============================================================
 *
 * Endpoint:
 *   POST /api/ai/rewrite
 *
 * Request:
 *   {
 *     text: "...",
 *     style: "exam_notes"
 *   }
 *
 * Response:
 *   {
 *     result: "..."
 *   }
 *
 * Supported styles:
 *
 *   simple
 *   professional
 *   academic
 *   exam_notes
 *   detailed
 *   concise
 */

export async function rewriteNotes(
  text,
  style = "simple"
) {
  if (!text || !text.trim()) {
    throw new Error("Text is required.");
  }

  const allowedStyles = [
    "simple",
    "professional",
    "academic",
    "exam_notes",
    "detailed",
    "concise",
  ];

  const normalizedStyle =
    allowedStyles.includes(style)
      ? style
      : "simple";

  const response = await fetch(
    buildUrl("/api/ai/rewrite"),
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        text: text.trim(),
        style: normalizedStyle,
      }),
    }
  );

  return handleResponse(response);
}

/*
 * ============================================================
 * AI TOOLS — SUMMARIZATION
 * ============================================================
 */

export async function summarizeNotes(
  text,
  length = "short"
) {
  if (!text || !text.trim()) {
    throw new Error("Text is required.");
  }

  const allowedLengths = [
    "one_sentence",
    "short",
    "medium",
    "detailed",
    "exam_revision",
  ];

  const normalizedLength =
    allowedLengths.includes(length)
      ? length
      : "short";

  const response = await fetch(
    buildUrl("/api/ai/summarize"),
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        text: text.trim(),
        length: normalizedLength,
      }),
    }
  );

  return handleResponse(response);
}


/*
 * ============================================================
 * AI TOOLS — FLASHCARDS
 * ============================================================
 */

export async function generateFlashcards(text) {
  if (!text || !text.trim()) {
    throw new Error("Text is required.");
  }

  const response = await fetch(
    buildUrl("/api/ai/flashcards"),
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        text: text.trim(),
      }),
    }
  );

  return handleResponse(response);
}

/*
 * ============================================================
 * AI TOOLS — GENERATE MCQs
 * ============================================================
 */

export async function generateMCQs(
  text,
  count = 10,
  difficulty = "medium"
) {
  if (!text || !text.trim()) {
    throw new Error("Text is required.");
  }

  const allowedDifficulties = [
    "easy",
    "medium",
    "hard",
  ];

  const normalizedDifficulty =
    allowedDifficulties.includes(difficulty)
      ? difficulty
      : "medium";

  const normalizedCount = Math.min(
    Math.max(Number(count) || 10, 1),
    50
  );

  const response = await fetch(
    buildUrl("/api/ai/mcqs"),
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        text: text.trim(),
        count: normalizedCount,
        difficulty: normalizedDifficulty,
      }),
    }
  );

  return handleResponse(response);
}

/*
 * ============================================================
 * AI TOOLS — QUESTION GENERATOR
 * ============================================================
 */

export async function generateQuestions(
  text,
  type = "exam",
  difficulty = "medium",
  count = 10
) {
  if (!text || !text.trim()) {
    throw new Error("Text is required.");
  }

  const allowedTypes = [
    "very_short",
    "short",
    "long",
    "important",
    "exam",
    "viva",
  ];

  const allowedDifficulties = [
    "easy",
    "medium",
    "hard",
  ];

  const normalizedType =
    allowedTypes.includes(type)
      ? type
      : "exam";

  const normalizedDifficulty =
    allowedDifficulties.includes(difficulty)
      ? difficulty
      : "medium";

  const normalizedCount = Math.min(
    Math.max(Number(count) || 10, 1),
    50
  );

  const response = await fetch(
    buildUrl("/api/ai/questions"),
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        text: text.trim(),
        type: normalizedType,
        difficulty: normalizedDifficulty,
        count: normalizedCount,
      }),
    }
  );

  return handleResponse(response);
}

/*
 * ============================================================
 * PHASE 6 DOCUMENT NORMALIZATION
 * ============================================================
 *
 * IMPORTANT:
 *
 * InkAI uses structured TipTap JSON.
 *
 * We DO NOT flatten the document into plain text.
 *
 * Structures preserved:
 *
 * - paragraph
 * - heading
 * - bulletList
 * - orderedList
 * - listItem
 * - table
 * - tableRow
 * - tableCell
 * - image
 * - pageBreak
 * - formatting marks
 *
 * Phase 7 handwriting processing can therefore continue
 * working with the original structured document.
 */

export function normalizePhase6Document(document) {
  if (!document) {
    return null;
  }

  let content =
    document.content ||
    document.content_json ||
    document.document_content ||
    document.data ||
    null;

  /*
   * Some backend responses store the JSON document
   * as a string.
   */

  if (typeof content === "string") {
    try {
      content = JSON.parse(content);
    } catch (error) {
      throw new Error(
        "The saved Phase 6 document contains invalid JSON."
      );
    }
  }

  /*
   * No content available.
   */

  if (!content) {
    return null;
  }

  /*
   * Standard TipTap document:
   *
   * {
   *   type: "doc",
   *   content: [...]
   * }
   */

  if (
    typeof content === "object" &&
    content.type === "doc"
  ) {
    return {
      ...document,

      content,

      blocks: Array.isArray(content.content)
        ? content.content
        : [],
    };
  }

  /*
   * Some versions of the backend may return the
   * document content directly as an array.
   */

  if (Array.isArray(content)) {
    const tiptapDocument = {
      type: "doc",
      content,
    };

    return {
      ...document,

      content: tiptapDocument,

      blocks: content,
    };
  }

  /*
   * If content is an object but does not explicitly
   * contain type="doc", preserve it rather than
   * destroying the structure.
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
    buildUrl(
      `/api/documents/${documentId}`
    )
  );

  const data =
    await handleResponse(response);

  return normalizePhase6Document(data);
}

/*
 * ============================================================
 * CREATE ASSIGNMENT DOCUMENT
 * ============================================================
 *
 * Combines:
 *
 * Phase 6 structured document
 * +
 * Phase 8 assignment configuration
 */

export function createAssignmentDocument({
  phase6Document,
  assignment = {},
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
      normalizedDocument.blocks || [],

    assignment: {
      ...assignment,
    },
  };
}

/*
 * ============================================================
 * HANDWRITING ASSIGNMENT PAYLOAD
 * ============================================================
 *
 * Phase 8 Assignment Generator
 *             ↓
 * Phase 7 Handwriting System
 *
 * The structured document remains intact.
 */

export function createHandwritingAssignmentPayload({
  phase6Document,
  assignment = {},
  handwriting = {},
}) {
  const assignmentDocument =
    createAssignmentDocument({
      phase6Document,
      assignment,
    });

  return {
    document: {
      id:
        assignmentDocument.documentId,

      title:
        assignmentDocument.title,

      content:
        assignmentDocument.content,

      blocks:
        assignmentDocument.blocks,
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
        handwriting?.fontSize ?? 22,

      lineSpacing:
        handwriting?.lineSpacing ?? 1.5,

      letterSpacing:
        handwriting?.letterSpacing ?? 0.5,

      wordSpacing:
        handwriting?.wordSpacing ?? 5,

      naturalness:
        handwriting?.naturalness ?? 65,

      seed:
        handwriting?.seed ?? 12345,
    },
  };
}

/*
 * ============================================================
 * PAGE CONFIGURATION HELPER
 * ============================================================
 *
 * Keeps frontend assignment settings in one predictable
 * structure before sending them to the backend.
 */

function buildAssignmentPageConfig(
  assignment = {}
) {
  return {
    paperSize:
      assignment?.paperSize ||
      "A4",

    orientation:
      assignment?.orientation ||
      "portrait",

    marginPreset:
      assignment?.marginPreset ||
      "normal",

    /*
     * Existing InkAI assignment UI historically stores
     * custom margins in points.
     *
     * Keep this for backward compatibility.
     */

    customMargins:
      assignment?.customMargins || {
        top: 56,
        right: 50,
        bottom: 56,
        left: 50,
      },

    customMarginsUnit:
      assignment?.customMarginsUnit ||
      "points",

    /*
     * Custom page dimensions are in millimetres.
     */

    customPageSize:
      assignment?.customPageSize || {
        widthMm: 210,
        heightMm: 297,
      },

    /*
     * Header
     */

    headerEnabled:
      assignment?.headerEnabled ?? false,

    headerText:
      assignment?.headerText || "",

    headerPosition:
      assignment?.headerPosition ||
      "center",

    headerFontSize:
      assignment?.headerFontSize ?? 10,

    headerBold:
      assignment?.headerBold ?? false,

    /*
     * Footer
     */

    showFooter:
      assignment?.showFooter ?? true,

    footerText:
      assignment?.footerText ||
      "InkAI — Assignment",

    footerPosition:
      assignment?.footerPosition ||
      "center",

    footerFontSize:
      assignment?.footerFontSize ?? 9,

    footerBold:
      assignment?.footerBold ?? false,

    /*
     * Page number
     */

    showPageNumber:
      assignment?.showPageNumber ?? true,

    pageNumberPosition:
      assignment?.pageNumberPosition ||
      "center",

    pageNumberShowTotal:
      assignment?.pageNumberShowTotal ??
      false,

    pageNumberPrefix:
      assignment?.pageNumberPrefix ||
      "Page",

    pageNumberFontSize:
      assignment?.pageNumberFontSize ?? 9,

    pageNumberBold:
      assignment?.pageNumberBold ?? false,
  };
}

/*
 * ============================================================
 * STEP 25 — FAST PREVIEW PAGINATION
 * ============================================================
 *
 * IMPORTANT:
 *
 * This function is ONLY for the live preview.
 *
 * It does NOT generate a PDF.
 * It does NOT invoke the high-quality renderer.
 *
 * Preview:
 *     settings change
 *          ↓
 *     /api/assignments/paginate
 *
 * Final PDF:
 *     Download
 *          ↓
 *     /api/assignments/generate
 *
 * An AbortSignal can be supplied so an outdated preview
 * request can be cancelled when the user changes settings again.
 */

export async function paginateAssignment({
  document,
  assignment = {},
  signal,
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

  const pageConfig =
    buildAssignmentPageConfig(
      assignment
    );

  const response = await fetch(
    buildUrl(
      "/api/assignments/paginate"
    ),
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      signal,

      body: JSON.stringify({
        document,
        assignment,
        page: pageConfig,
      }),
    }
  );

  return handleResponse(response);
}

/*
 * ============================================================
 * STEP 21+
 * GENERATE FINAL ASSIGNMENT PDF
 * ============================================================
 *
 * This is the FINAL high-resolution PDF.
 *
 * Preview pagination and final PDF generation are separate:
 *
 * Preview
 *   ↓
 * /paginate
 *
 * Final PDF
 *   ↓
 * /generate
 */

export async function generateAssignmentPDF({
  documentId,
  draftId = null,
  template,
  paper,
  handwritingStyle,
  ink,
  pageNumbers,
  assignment = {},
  handwriting = {},
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
          draftId
            ? String(draftId)
            : null,

        template:
          template ||
          assignment?.template ||
          "college_assignment",

        paper:
          paper ||
          assignment?.paper ||
          "ruled",

        handwriting_style:
          handwritingStyle ||
          handwriting?.style ||
          "school_notebook",

        ink:
          ink ||
          handwriting?.ink ||
          "blue",

        page_numbers:
          pageNumbers !== false,

        assignment: {
          ...assignment,

          page:
            assignment?.page ||
            buildAssignmentPageConfig(
              assignment
            ),
        },

        handwriting: {
          ...handwriting,

          style:
            handwriting?.style ||
            handwritingStyle ||
            "school_notebook",

          ink:
            handwriting?.ink ||
            ink ||
            "blue",

          paper:
            handwriting?.paper ||
            paper ||
            "ruled",
        },
      }),
    }
  );

  const result =
    await handleResponse(response);

  /*
   * If backend returns a relative download URL,
   * convert it to the complete API URL.
   */

  if (
    result &&
    typeof result.download_url ===
      "string"
  ) {
    if (
      result.download_url.startsWith(
        "/"
      )
    ) {
      result.download_url =
        buildUrl(
          result.download_url
        );
    }
  }

  return result;
}

/*
 * ============================================================
 * STEP 25
 * REGENERATE ASSIGNMENT
 * ============================================================
 */

export async function regenerateAssignment({
  assignmentId,
  paper,
  handwritingStyle,
  ink,
  pageNumbers,
  assignment = {},
  handwriting = {},
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
          handwriting?.style ||
          undefined,

        ink:
          ink ||
          handwriting?.ink ||
          undefined,

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

  if (
    result &&
    typeof result.download_url ===
      "string" &&
    result.download_url.startsWith(
      "/"
    )
  ) {
    result.download_url =
      buildUrl(
        result.download_url
      );
  }

  return result;
}

/*
 * ============================================================
 * STEP 26
 * DUPLICATE ASSIGNMENT
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

  return handleResponse(response);
}

/*
 * ============================================================
 * STEP 31
 * SAVE ASSIGNMENT DRAFT
 * ============================================================
 *
 * Drafts preserve the user's complete Phase 8 configuration.
 */

export async function saveAssignmentDraft({
  draftId = null,
  documentId,
  template,
  paper,
  handwritingStyle,
  ink,
  pageNumbers,
  assignment = {},
  handwriting = {},
}) {
  if (!documentId) {
    throw new Error(
      "Document ID is required to save a draft."
    );
  }

  const response = await fetch(
    buildUrl(
      "/api/assignments/draft"
    ),
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      body: JSON.stringify({
        draft_id:
          draftId
            ? String(draftId)
            : null,

        document_id:
          String(documentId),

        template:
          template ||
          assignment?.template ||
          "college_assignment",

        paper:
          paper ||
          assignment?.paper ||
          "ruled",

        handwriting_style:
          handwritingStyle ||
          handwriting?.style ||
          "school_notebook",

        ink:
          ink ||
          handwriting?.ink ||
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
 * STEP 31
 * GET ASSIGNMENT DRAFT
 * ============================================================
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
 * ASSIGNMENT HISTORY
 * ============================================================
 */

/*
 * GET ALL ASSIGNMENTS
 */

export async function getAssignments() {
  const response = await fetch(
    buildUrl(
      "/api/assignments"
    )
  );

  return handleResponse(response);
}

/*
 * DELETE ASSIGNMENT
 */

export async function deleteAssignment(
  assignmentId
) {
  if (!assignmentId) {
    throw new Error(
      "Assignment ID is required."
    );
  }

  const response = await fetch(
    buildUrl(
      `/api/assignments/${assignmentId}`
    ),
    {
      method: "DELETE",
    }
  );

  return handleResponse(response);
}

/*
 * ============================================================
 * DEFAULT EXPORT
 * ============================================================
 */

const assignmentService = {
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

  getAssignments,

  deleteAssignment,

  correctGrammar,

  rewriteNotes,

  summarizeNotes,

  generateFlashcards,

  generateMCQs,
  
  generateQuestions,
};

export default assignmentService;