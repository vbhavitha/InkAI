/*
 * ============================================================
 * PHASE 6 STRUCTURED DOCUMENT HELPERS
 * ============================================================
 */

export function getDocumentBlocks(document) {
  if (!document) {
    return [];
  }

  const content =
    document.content ||
    document.content_json ||
    document.data ||
    null;

  if (!content) {
    return [];
  }

  if (Array.isArray(content)) {
    return content;
  }

  if (
    content.type === "doc" &&
    Array.isArray(content.content)
  ) {
    return content.content;
  }

  if (Array.isArray(document.blocks)) {
    return document.blocks;
  }

  return [];
}

/*
 * ============================================================
 * NODE TYPE
 * ============================================================
 */

export function getNodeType(node) {
  return node?.type || "paragraph";
}

/*
 * ============================================================
 * TEXT EXTRACTION
 * ============================================================
 *
 * Used ONLY for preview/search purposes.
 *
 * The actual document is never flattened.
 */

export function getNodeText(node) {
  if (!node) {
    return "";
  }

  if (typeof node.text === "string") {
    return node.text;
  }

  if (Array.isArray(node.content)) {
    return node.content
      .map(getNodeText)
      .join("");
  }

  return "";
}

/*
 * ============================================================
 * DOCUMENT HAS CONTENT
 * ============================================================
 */

export function hasStructuredContent(document) {
  return (
    getDocumentBlocks(document)
      .length > 0
  );
}