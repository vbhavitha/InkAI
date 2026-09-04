const SUPPORTED_NODES = {
  paragraph: "paragraph",
  heading: "heading",
  bulletList: "bulletList",
  orderedList: "orderedList",
  listItem: "listItem",
  image: "image",
  table: "table",
  tableRow: "tableRow",
  tableCell: "tableCell",
  tableHeader: "tableHeader",
  pageBreak: "pageBreak",
};

function extractText(node) {
  if (!node) return "";

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

function convertNode(node, context = {}) {
  if (!node) return null;

  switch (node.type) {
    case SUPPORTED_NODES.paragraph:
      return {
        type: "paragraph",
        text: extractText(node),
        marks: collectMarks(node),
      };

    case SUPPORTED_NODES.heading:
      return {
        type: "heading",
        level: node.attrs?.level || 1,
        text: extractText(node),
        marks: collectMarks(node),
      };

    case SUPPORTED_NODES.bulletList:
      return {
        type: "bulletList",
        items: (node.content || []).map((item) =>
          convertNode(item, {
            ...context,
            listType: "bullet",
          })
        ),
      };

    case SUPPORTED_NODES.orderedList:
      return {
        type: "orderedList",
        items: (node.content || []).map((item) =>
          convertNode(item, {
            ...context,
            listType: "ordered",
          })
        ),
      };

    case SUPPORTED_NODES.listItem:
      return {
        type: "listItem",
        text: extractText(node),
      };

    case SUPPORTED_NODES.image:
      return {
        type: "image",
        src: node.attrs?.src || "",
        alt: node.attrs?.alt || "",
        title: node.attrs?.title || "",
        alignment: node.attrs?.alignment || "left",
        width: node.attrs?.width || null,
        height: node.attrs?.height || null,
      };

    case SUPPORTED_NODES.table:
      return {
        type: "table",
        rows: (node.content || []).map((row) =>
          convertNode(row, context)
        ),
      };

    case SUPPORTED_NODES.tableRow:
      return {
        type: "tableRow",
        cells: (node.content || []).map((cell) =>
          convertNode(cell, context)
        ),
      };

    case SUPPORTED_NODES.tableCell:
    case SUPPORTED_NODES.tableHeader:
      return {
        type: node.type,
        text: extractText(node),
      };

    case SUPPORTED_NODES.pageBreak:
      return {
        type: "pageBreak",
      };

    default:
      return {
        type: node.type,
        text: extractText(node),
      };
  }
}

function collectMarks(node) {
  const marks = [];

  if (!node?.content) {
    return marks;
  }

  node.content.forEach((child) => {
    if (child.marks) {
      child.marks.forEach((mark) => {
        if (!marks.includes(mark.type)) {
          marks.push(mark.type);
        }
      });
    }
  });

  return marks;
}

export function convertDocumentToHandwritingDocument(
  document
) {
  if (!document) {
    throw new Error("Document is required.");
  }

  const content =
    document.content?.content || document.content || [];

  return {
    documentId: document.id,
    title: document.title || "Untitled Document",
    blocks: content
      .map((node) => convertNode(node))
      .filter(Boolean),
    wordCount: document.word_count || 0,
    characterCount: document.character_count || 0,
  };
}