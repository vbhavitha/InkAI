/*
 * =========================================================
 * INKAI HANDWRITING DOCUMENT RENDERER
 * =========================================================
 *
 * STEP 24
 *
 * Takes the structured document produced by
 * handwritingDocumentParser.js
 *
 * and converts it into renderer blocks.
 *
 * The renderer does NOT flatten headings, lists,
 * tables or page breaks into ordinary paragraphs.
 * =========================================================
 */

import {
  parseTiptapDocument,
} from "./handwritingDocumentParser";


/*
 * =========================================================
 * DEFAULT FORMATTING
 * =========================================================
 */

const DEFAULT_FORMATTING = {
  paragraph: {
    fontSizeMultiplier: 1,
    lineSpacing: 1.5,
    paragraphSpacing: 10,
    leftIndent: 0,
  },

  heading: {
    1: {
      fontSizeMultiplier: 1.55,
      lineSpacing: 1.25,
      paragraphSpacing: 16,
      leftIndent: 0,
    },

    2: {
      fontSizeMultiplier: 1.35,
      lineSpacing: 1.3,
      paragraphSpacing: 14,
      leftIndent: 0,
    },

    3: {
      fontSizeMultiplier: 1.2,
      lineSpacing: 1.35,
      paragraphSpacing: 12,
      leftIndent: 0,
    },
  },

  list: {
    indent: 28,
    bulletGap: 10,
    paragraphSpacing: 4,
  },

  table: {
    cellPadding: 8,
    rowSpacing: 0,
  },
};


/*
 * =========================================================
 * INLINE TEXT
 * =========================================================
 */

function createInlineRun(
  item
) {
  if (!item) {
    return null;
  }

  if (item.type !== "text") {
    return null;
  }

  return {
    type: "text",

    text:
      item.text || "",

    marks:
      item.marks || [],
  };
}


/*
 * =========================================================
 * PARAGRAPH BLOCK
 * =========================================================
 */

function createParagraphBlock(
  block,
  baseFontSize,
  options
) {
  const formatting =
    DEFAULT_FORMATTING.paragraph;

  return {
    type: "paragraph",

    text:
      block.text || "",

    content:
      (block.content || [])
        .map(createInlineRun)
        .filter(Boolean),

    fontSize:
      baseFontSize *
      formatting.fontSizeMultiplier,

    lineSpacing:
      options.lineSpacing ??
      formatting.lineSpacing,

    paragraphSpacing:
      formatting.paragraphSpacing,

    leftIndent:
      formatting.leftIndent,
  };
}


/*
 * =========================================================
 * HEADING BLOCK
 * =========================================================
 */

function createHeadingBlock(
  block,
  baseFontSize
) {
  const level =
    Math.min(
      3,
      Math.max(
        1,
        Number(block.level) || 1
      )
    );

  const formatting =
    DEFAULT_FORMATTING.heading[level];

  return {
    type: "heading",

    level,

    text:
      block.text || "",

    content:
      (block.content || [])
        .map(createInlineRun)
        .filter(Boolean),

    fontSize:
      baseFontSize *
      formatting.fontSizeMultiplier,

    lineSpacing:
      formatting.lineSpacing,

    paragraphSpacing:
      formatting.paragraphSpacing,

    leftIndent:
      formatting.leftIndent,
  };
}


/*
 * =========================================================
 * LIST ITEM CONTENT
 * =========================================================
 */

function getListItemText(
  item
) {
  if (!item) {
    return "";
  }

  return (item.content || [])
    .map((child) => {
      if (
        child.type === "paragraph" ||
        child.type === "heading"
      ) {
        return child.text || "";
      }

      return "";
    })
    .filter(Boolean)
    .join("\n");
}


/*
 * =========================================================
 * BULLET / ORDERED LIST
 * =========================================================
 */

function createListBlock(
  block,
  baseFontSize
) {
  const isOrdered =
    block.type ===
    "orderedList";

  const items =
    (block.items || []).map(
      (item, index) => ({
        type: "listItem",

        text:
          getListItemText(item),

        marker:
          isOrdered
            ? `${(
                Number(block.start) || 1
              ) + index}.`
            : "•",

        content:
          item.content || [],
      })
    );

  return {
    type:
      isOrdered
        ? "orderedList"
        : "bulletList",

    items,

    fontSize:
      baseFontSize,

    lineSpacing:
      DEFAULT_FORMATTING.paragraph
        .lineSpacing,

    indent:
      DEFAULT_FORMATTING.list.indent,

    bulletGap:
      DEFAULT_FORMATTING.list.bulletGap,

    paragraphSpacing:
      DEFAULT_FORMATTING.list.paragraphSpacing,
  };
}


/*
 * =========================================================
 * TABLE
 * =========================================================
 */

function createTableBlock(
  block,
  baseFontSize
) {
  return {
    type: "table",

    rows:
      (block.rows || []).map(
        (row) => ({
          type: "tableRow",

          cells:
            (row.cells || []).map(
              (cell) => ({
                type:
                  cell.type ||
                  "cell",

                text:
                  cell.text || "",

                content:
                  cell.content || [],

                attrs:
                  cell.attrs || {},
              })
            ),
        })
      ),

    fontSize:
      baseFontSize,

    cellPadding:
      DEFAULT_FORMATTING.table
        .cellPadding,

    rowSpacing:
      DEFAULT_FORMATTING.table
        .rowSpacing,
  };
}


/*
 * =========================================================
 * PAGE BREAK
 * =========================================================
 */

function createPageBreakBlock() {
  return {
    type: "pageBreak",
  };
}


/*
 * =========================================================
 * IMAGE
 * =========================================================
 */

function createImageBlock(
  block
) {
  return {
    type: "image",

    src:
      block.src || "",

    alt:
      block.alt || "",

    attrs:
      block.attrs || {},
  };
}


/*
 * =========================================================
 * MAIN CONVERTER
 * =========================================================
 */

export function createHandwritingDocument(
  tiptapJSON,
  {
    baseFontSize = 22,
    lineSpacing = 1.5,
  } = {}
) {
  const document =
    parseTiptapDocument(
      tiptapJSON
    );

  const blocks = [];

  for (
    const block of document.content || []
  ) {
    if (!block) {
      continue;
    }

    switch (block.type) {
      case "paragraph":
        blocks.push(
          createParagraphBlock(
            block,
            baseFontSize,
            {
              lineSpacing,
            }
          )
        );
        break;

      case "heading":
        blocks.push(
          createHeadingBlock(
            block,
            baseFontSize
          )
        );
        break;

      case "bulletList":
      case "orderedList":
        blocks.push(
          createListBlock(
            block,
            baseFontSize
          )
        );
        break;

      case "table":
        blocks.push(
          createTableBlock(
            block,
            baseFontSize
          )
        );
        break;

      case "pageBreak":
        blocks.push(
          createPageBreakBlock()
        );
        break;

      case "image":
        blocks.push(
          createImageBlock(
            block
          )
        );
        break;

      default:
        /*
         * Do not silently convert unsupported
         * structures into paragraphs.
         */

        blocks.push({
          type: "unsupported",

          originalType:
            block.originalType,

          text:
            block.text || "",
        });
    }
  }

  return {
    type: "handwritingDocument",

    blocks,
  };
}