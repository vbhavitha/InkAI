/*
 * =========================================================
 * INKAI HANDWRITING DOCUMENT PARSER
 * =========================================================
 *
 * STEP 24
 *
 * Converts TipTap JSON into a renderer-friendly
 * structured document.
 *
 * IMPORTANT:
 *
 * We DO NOT flatten the document into plain text.
 *
 * Heading  → heading
 * Paragraph → paragraph
 * Bullet list → bulletList
 * Ordered list → orderedList
 * Table → table
 * Image → image
 * Page break → pageBreak
 *
 * This preserves Phase 6 document structure.
 * =========================================================
 */


/*
 * =========================================================
 * HELPERS
 * =========================================================
 */


/**
 * Extract plain text from a TipTap node.
 *
 * This is only used INSIDE a structured block.
 *
 * It does NOT flatten the whole document.
 */
function extractNodeText(node) {
  if (!node) {
    return "";
  }

  if (node.type === "text") {
    return node.text || "";
  }

  if (!Array.isArray(node.content)) {
    return "";
  }

  return node.content
    .map((child) => extractNodeText(child))
    .join("");
}


/**
 * Extract inline formatting marks.
 *
 * Phase 6 formatting such as:
 *
 * bold
 * italic
 * underline
 *
 * is retained.
 */
function extractMarks(node) {
  if (!node || !Array.isArray(node.marks)) {
    return [];
  }

  return node.marks.map((mark) => ({
    type: mark.type,
    attrs: mark.attrs || {},
  }));
}


/**
 * Extract inline content while preserving marks.
 */
function extractInlineContent(node) {
  if (!node || !Array.isArray(node.content)) {
    return [];
  }

  return node.content
    .map((child) => {
      if (child.type === "text") {
        return {
          type: "text",
          text: child.text || "",
          marks: extractMarks(child),
        };
      }

      if (child.type === "hardBreak") {
        return {
          type: "hardBreak",
        };
      }

      if (child.type === "image") {
        return {
          type: "image",
          attrs: child.attrs || {},
        };
      }

      return {
        type: child.type,
        attrs: child.attrs || {},
        text: extractNodeText(child),
        marks: extractMarks(child),
      };
    })
    .filter(Boolean);
}


/*
 * =========================================================
 * PARSE LIST ITEM
 * =========================================================
 */

function parseListItem(node) {
  if (!node) {
    return {
      type: "listItem",
      content: [],
    };
  }

  return {
    type: "listItem",

    content: Array.isArray(node.content)
      ? node.content
          .map((child) =>
            parseBlockNode(child)
          )
          .filter(Boolean)
      : [],
  };
}


/*
 * =========================================================
 * PARSE LIST
 * =========================================================
 */

function parseList(node, listType) {
  const items = Array.isArray(node.content)
    ? node.content
        .map(parseListItem)
        .filter(Boolean)
    : [];

  return {
    type: listType,
    items,
  };
}


/*
 * =========================================================
 * PARSE TABLE
 * =========================================================
 */

function parseTable(node) {
  const rows = [];

  if (!Array.isArray(node.content)) {
    return {
      type: "table",
      rows,
    };
  }

  node.content.forEach((row) => {
    if (!row || row.type !== "tableRow") {
      return;
    }

    const cells = [];

    if (Array.isArray(row.content)) {
      row.content.forEach((cell) => {
        if (
          cell.type !== "tableCell" &&
          cell.type !== "tableHeader"
        ) {
          return;
        }

        cells.push({
          type:
            cell.type === "tableHeader"
              ? "header"
              : "cell",

          attrs: cell.attrs || {},

          content:
            extractInlineContent(cell),

          text:
            extractNodeText(cell),
        });
      });
    }

    rows.push({
      type: "tableRow",
      cells,
    });
  });

  return {
    type: "table",
    rows,
  };
}


/*
 * =========================================================
 * PARSE BLOCK NODE
 * =========================================================
 */

function parseBlockNode(node) {
  if (!node || !node.type) {
    return null;
  }

  switch (node.type) {
    /*
     * -----------------------------------------------------
     * DOCUMENT
     * -----------------------------------------------------
     */

    case "doc":
      return {
        type: "document",
        content: Array.isArray(node.content)
          ? node.content
              .map(parseBlockNode)
              .filter(Boolean)
          : [],
      };


    /*
     * -----------------------------------------------------
     * PARAGRAPH
     * -----------------------------------------------------
     */

    case "paragraph":
      return {
        type: "paragraph",

        attrs: node.attrs || {},

        text: extractNodeText(node),

        content:
          extractInlineContent(node),
      };


    /*
     * -----------------------------------------------------
     * HEADING
     * -----------------------------------------------------
     */

    case "heading":
      return {
        type: "heading",

        level:
          Number(node.attrs?.level) || 1,

        attrs: node.attrs || {},

        text: extractNodeText(node),

        content:
          extractInlineContent(node),
      };


    /*
     * -----------------------------------------------------
     * BULLET LIST
     * -----------------------------------------------------
     */

    case "bulletList":
      return parseList(
        node,
        "bulletList"
      );


    /*
     * -----------------------------------------------------
     * ORDERED LIST
     * -----------------------------------------------------
     */

    case "orderedList":
      return {
        ...parseList(
          node,
          "orderedList"
        ),

        start:
          Number(node.attrs?.start) || 1,
      };


    /*
     * -----------------------------------------------------
     * LIST ITEM
     * -----------------------------------------------------
     */

    case "listItem":
      return parseListItem(node);


    /*
     * -----------------------------------------------------
     * TABLE
     * -----------------------------------------------------
 */

    case "table":
      return parseTable(node);


    /*
     * -----------------------------------------------------
     * TABLE ROW
     * -----------------------------------------------------
 */

    case "tableRow":
      return {
        type: "tableRow",

        cells:
          Array.isArray(node.content)
            ? node.content.map(
                (cell) => ({
                  type:
                    cell.type ===
                    "tableHeader"
                      ? "header"
                      : "cell",

                  text:
                    extractNodeText(
                      cell
                    ),

                  content:
                    extractInlineContent(
                      cell
                    ),

                  attrs:
                    cell.attrs || {},
                })
              )
            : [],
      };


    /*
     * -----------------------------------------------------
     * IMAGE
     * -----------------------------------------------------
 */

    case "image":
      return {
        type: "image",

        attrs: node.attrs || {},

        src:
          node.attrs?.src || "",

        alt:
          node.attrs?.alt || "",
      };


    /*
     * -----------------------------------------------------
     * PAGE BREAK
     * -----------------------------------------------------
 */

    case "pageBreak":
      return {
        type: "pageBreak",
      };


    /*
     * -----------------------------------------------------
     * HARD BREAK
     * -----------------------------------------------------
 */

    case "hardBreak":
      return {
        type: "hardBreak",
      };


    /*
     * -----------------------------------------------------
     * UNKNOWN NODE
     * -----------------------------------------------------
     *
     * We don't silently turn unknown structures into
     * paragraphs.
     *
     * This prevents accidental formatting loss.
     * -----------------------------------------------------
 */

    default:
      return {
        type: "unsupported",

        originalType:
          node.type,

        text:
          extractNodeText(node),

        attrs:
          node.attrs || {},
      };
  }
}


/*
 * =========================================================
 * PUBLIC API
 * =========================================================
 */


/**
 * Parse a complete TipTap document.
 */
export function parseTiptapDocument(
  documentJSON
) {
  if (
    !documentJSON ||
    typeof documentJSON !== "object"
  ) {
    return {
      type: "document",
      content: [],
    };
  }

  const parsed =
    parseBlockNode(
      documentJSON
    );

  if (
    !parsed ||
    parsed.type !== "document"
  ) {
    return {
      type: "document",
      content: [],
    };
  }

  return parsed;
}


/**
 * Convert TipTap editor instance directly.
 */
export function parseTiptapEditor(
  editor
) {
  if (!editor) {
    return {
      type: "document",
      content: [],
    };
  }

  return parseTiptapDocument(
    editor.getJSON()
  );
}


/**
 * Extract only textual content from a structured
 * handwriting document.
 *
 * IMPORTANT:
 *
 * This is NOT used as the primary renderer input.
 *
 * It is only useful for compatibility/debugging.
 */
export function structuredDocumentToText(
  document
) {
  if (
    !document ||
    document.type !== "document"
  ) {
    return "";
  }

  const output = [];

  for (const block of document.content || []) {
    if (!block) {
      continue;
    }

    if (
      block.type === "paragraph" ||
      block.type === "heading"
    ) {
      output.push(
        block.text || ""
      );

      continue;
    }

    if (
      block.type === "bulletList" ||
      block.type === "orderedList"
    ) {
      for (
        const item of block.items || []
      ) {
        for (
          const child of item.content || []
        ) {
          if (
            child.type === "paragraph" ||
            child.type === "heading"
          ) {
            output.push(
              child.text || ""
            );
          }
        }
      }

      continue;
    }

    if (block.type === "table") {
      for (
        const row of block.rows || []
      ) {
        output.push(
          (row.cells || [])
            .map(
              (cell) =>
                cell.text || ""
            )
            .join(" | ")
        );
      }

      continue;
    }

    if (
      block.type === "pageBreak"
    ) {
      output.push("\f");
    }
  }

  return output.join("\n");
}