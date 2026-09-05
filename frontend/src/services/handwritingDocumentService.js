/*
 * =========================================================
 * PHASE 7 HANDWRITING DOCUMENT MODEL
 * =========================================================
 *
 * Converts the structured Phase 6 document into a
 * format that the handwriting renderer can consume.
 *
 * IMPORTANT:
 *
 * We preserve structure.
 *
 * We do NOT convert the document into plain text.
 * =========================================================
 */

function extractText(node) {
  if (!node) {
    return "";
  }

  if (node.type === "text") {
    return node.text || "";
  }

  if (!node.content) {
    return "";
  }

  return node.content
    .map((child) => extractText(child))
    .join("");
}


function extractMarks(node) {
  if (!node?.content) {
    return [];
  }

  const marks = [];

  node.content.forEach((child) => {
    if (!child.marks) {
      return;
    }

    child.marks.forEach((mark) => {
      if (!marks.includes(mark.type)) {
        marks.push(mark.type);
      }
    });
  });

  return marks;
}


function convertNode(node) {
  if (!node) {
    return null;
  }

  switch (node.type) {

    /*
     * Paragraph
     */

    case "paragraph":
      return {
        type: "paragraph",
        text: extractText(node),
        marks: extractMarks(node),
      };


    /*
     * Heading
     */

    case "heading":
      return {
        type: "heading",
        level: node.attrs?.level || 1,
        text: extractText(node),
        marks: extractMarks(node),
      };


    /*
     * Bullet list
     */

    case "bulletList":
      return {
        type: "bulletList",

        items: (node.content || [])
          .map(convertNode)
          .filter(Boolean),
      };


    /*
     * Ordered list
     */

    case "orderedList":
      return {
        type: "orderedList",

        items: (node.content || [])
          .map(convertNode)
          .filter(Boolean),
      };


    /*
     * List item
     */

    case "listItem":
      return {
        type: "listItem",

        content: (node.content || [])
          .map(convertNode)
          .filter(Boolean),
      };


    /*
     * Image
     */

    case "image":
      return {
        type: "image",

        src: node.attrs?.src || "",

        alt:
          node.attrs?.alt || "",

        title:
          node.attrs?.title || "",

        alignment:
          node.attrs?.alignment || "left",

        width:
          node.attrs?.width || null,

        height:
          node.attrs?.height || null,
      };


    /*
     * Table
     */

    case "table":
      return {
        type: "table",

        rows: (node.content || [])
          .map(convertNode)
          .filter(Boolean),
      };


    /*
     * Table row
     */

    case "tableRow":
      return {
        type: "tableRow",

        cells: (node.content || [])
          .map(convertNode)
          .filter(Boolean),
      };


    /*
     * Table cell
     */

    case "tableCell":

    case "tableHeader":
      return {
        type: node.type,

        text: extractText(node),
      };


    /*
     * Page break
     */

    case "pageBreak":
      return {
        type: "pageBreak",
      };


    /*
     * Unknown node
     */

    default:
      return {
        type: node.type,

        text: extractText(node),
      };
  }
}


/*
 * =========================================================
 * MAIN CONVERTER
 * =========================================================
 */

export function convertDocumentToHandwritingDocument(
  document
) {
  if (!document) {
    throw new Error(
      "A document is required."
    );
  }

  const tiptapDocument =
    document.content?.type === "doc"
      ? document.content
      : document.content?.content
        ? document.content
        : {
            type: "doc",
            content: [],
          };

  const nodes =
    tiptapDocument.content || [];

  return {
    documentId: document.id,

    title:
      document.title ||
      "Untitled Document",

    blocks: nodes
      .map(convertNode)
      .filter(Boolean),

    wordCount:
      document.word_count || 0,

    characterCount:
      document.character_count || 0,
  };
}