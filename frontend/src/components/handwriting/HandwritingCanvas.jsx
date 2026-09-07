import React, {
  useEffect,
  useState,
} from "react";

import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from "lucide-react";

import {
  getFontUrl,
  getStyleFontFamily,
} from "../../utils/handwritingUtils";


/*
 * =========================================================
 * A4 PAGE
 * =========================================================
 */

const A4_WIDTH = 794;
const A4_HEIGHT = 1123;

const DEFAULT_MARGIN = {
  top: 80,
  right: 70,
  bottom: 70,
  left: 70,
};


/*
 * =========================================================
 * INK STYLES
 * =========================================================
 */

const INK_STYLES = {
  blue: {
    base: "#19426F",
    variations: [
      "#163A63",
      "#19426F",
      "#1C4778",
      "#204C80",
    ],
  },

  black: {
    base: "#252525",
    variations: [
      "#202020",
      "#252525",
      "#2A2A2A",
      "#303030",
    ],
  },

  red: {
    base: "#972A2A",
    variations: [
      "#8E2525",
      "#972A2A",
      "#A02F2F",
      "#A93434",
    ],
  },

  pencil: {
    base: "#5A5A5A",
    variations: [
      "#4F4F4F",
      "#555555",
      "#5A5A5A",
      "#606060",
      "#666666",
    ],
  },
};


function getInkConfiguration(inkStyle) {
  return (
    INK_STYLES[inkStyle] ||
    INK_STYLES.blue
  );
}


/*
 * =========================================================
 * DETERMINISTIC INK VALUE
 * =========================================================
 */

function deterministicInkValue(
  documentId,
  pageNumber,
  characterIndex,
  channel
) {
  const input =
    `${documentId}:${pageNumber}:${characterIndex}:${channel}`;

  let hash = 2166136261;

  for (
    let index = 0;
    index < input.length;
    index++
  ) {
    hash ^= input.charCodeAt(index);

    hash = Math.imul(
      hash,
      16777619
    );
  }

  hash >>>= 0;

  return hash / 0xffffffff;
}


function getInkVariation(
  documentId,
  pageNumber,
  characterIndex,
  inkStyle,
  naturalVariation
) {
  if (!naturalVariation) {
    return {
      opacityMultiplier: 1,
      darknessMultiplier: 1,
      textureStrength: 0,
    };
  }

  if (inkStyle === "pencil") {
    const opacityRandom =
      deterministicInkValue(
        documentId,
        pageNumber,
        characterIndex,
        "pencil-opacity"
      );

    const darknessRandom =
      deterministicInkValue(
        documentId,
        pageNumber,
        characterIndex,
        "pencil-darkness"
      );

    const textureRandom =
      deterministicInkValue(
        documentId,
        pageNumber,
        characterIndex,
        "pencil-texture"
      );

    return {
      opacityMultiplier:
        0.88 +
        opacityRandom * 0.10,

      darknessMultiplier:
        0.82 +
        darknessRandom * 0.12,

      textureStrength:
        0.02 +
        textureRandom * 0.08,
    };
  }

  const opacityRandom =
    deterministicInkValue(
      documentId,
      pageNumber,
      characterIndex,
      "opacity"
    );

  const darknessRandom =
    deterministicInkValue(
      documentId,
      pageNumber,
      characterIndex,
      "darkness"
    );

  const textureRandom =
    deterministicInkValue(
      documentId,
      pageNumber,
      characterIndex,
      "texture"
    );

  return {
    opacityMultiplier:
      0.94 +
      opacityRandom * 0.10,

    darknessMultiplier:
      0.94 +
      darknessRandom * 0.10,

    textureStrength:
      textureRandom * 0.08,
  };
}


function adjustInkColor(
  color,
  darknessMultiplier
) {
  if (!color) {
    return color;
  }

  const normalized =
    color.replace("#", "");

  if (normalized.length !== 6) {
    return color;
  }

  const red =
    parseInt(
      normalized.slice(0, 2),
      16
    );

  const green =
    parseInt(
      normalized.slice(2, 4),
      16
    );

  const blue =
    parseInt(
      normalized.slice(4, 6),
      16
    );

  const adjustedRed =
    Math.max(
      0,
      Math.min(
        255,
        Math.round(
          red *
          darknessMultiplier
        )
      )
    );

  const adjustedGreen =
    Math.max(
      0,
      Math.min(
        255,
        Math.round(
          green *
          darknessMultiplier
        )
      )
    );

  const adjustedBlue =
    Math.max(
      0,
      Math.min(
        255,
        Math.round(
          blue *
          darknessMultiplier
        )
      )
    );

  return (
    "#" +
    adjustedRed
      .toString(16)
      .padStart(2, "0") +
    adjustedGreen
      .toString(16)
      .padStart(2, "0") +
    adjustedBlue
      .toString(16)
      .padStart(2, "0")
  );
}


/*
 * =========================================================
 * PAPER BACKGROUND
 * =========================================================
 */

function drawPaperBackground(
  context,
  paperStyle
) {
  context.save();

  if (paperStyle === "notebook") {
    context.fillStyle = "#fdfcf8";
  } else {
    context.fillStyle = "#ffffff";
  }

  context.fillRect(
    0,
    0,
    A4_WIDTH,
    A4_HEIGHT
  );

  if (
    paperStyle === "ruled" ||
    paperStyle === "notebook"
  ) {
    drawRuledPaper(
      context,
      paperStyle
    );
  }

  if (paperStyle === "graph") {
    drawGraphPaper(context);
  }

  context.restore();
}


/*
 * =========================================================
 * RULED / NOTEBOOK PAPER
 * =========================================================
 */

function drawRuledPaper(
  context,
  paperStyle
) {
  const lineSpacing = 36;
  const startY = 105;

  context.save();

  context.lineWidth = 1;

  context.strokeStyle =
    "rgba(100, 130, 170, 0.28)";

  for (
    let y = startY;
    y < A4_HEIGHT - 50;
    y += lineSpacing
  ) {
    context.beginPath();

    context.moveTo(45, y);

    context.lineTo(
      A4_WIDTH - 45,
      y
    );

    context.stroke();
  }

  if (paperStyle === "notebook") {
    context.strokeStyle =
      "rgba(190, 80, 80, 0.45)";

    context.lineWidth = 1.2;

    context.beginPath();

    context.moveTo(
      105,
      45
    );

    context.lineTo(
      105,
      A4_HEIGHT - 45
    );

    context.stroke();

    drawPaperTexture(context);
  }

  context.restore();
}


/*
 * =========================================================
 * GRAPH PAPER
 * =========================================================
 */

function drawGraphPaper(context) {
  const gridSize = 25;

  context.save();

  context.lineWidth = 0.7;

  context.strokeStyle =
    "rgba(100, 130, 170, 0.22)";

  for (
    let x = 25;
    x < A4_WIDTH;
    x += gridSize
  ) {
    context.beginPath();

    context.moveTo(x, 0);

    context.lineTo(
      x,
      A4_HEIGHT
    );

    context.stroke();
  }

  for (
    let y = 25;
    y < A4_HEIGHT;
    y += gridSize
  ) {
    context.beginPath();

    context.moveTo(0, y);

    context.lineTo(
      A4_WIDTH,
      y
    );

    context.stroke();
  }

  context.restore();
}


/*
 * =========================================================
 * PAPER TEXTURE
 * =========================================================
 */

function drawPaperTexture(context) {
  context.save();

  /*
   * Micro grain
   */

  for (
    let y = 0;
    y < A4_HEIGHT;
    y += 6
  ) {
    for (
      let x = 0;
      x < A4_WIDTH;
      x += 6
    ) {
      const value =
        Math.sin(
          x * 12.9898 +
          y * 78.233
        ) * 43758.5453;

      const normalized =
        value -
        Math.floor(value);

      if (normalized > 0.68) {
        context.fillStyle =
          `rgba(70, 65, 55, ${
            0.008 +
            normalized * 0.010
          })`;

        context.fillRect(
          x,
          y,
          1,
          1
        );
      }
    }
  }


  /*
   * Paper fibers
   */

  for (
    let index = 0;
    index < 180;
    index++
  ) {
    const seed =
      Math.sin(
        index * 91.731
      ) * 43758.5453;

    const normalized =
      seed -
      Math.floor(seed);

    const x =
      normalized *
      A4_WIDTH;

    const secondSeed =
      Math.sin(
        index * 47.173
      ) * 43758.5453;

    const secondNormalized =
      secondSeed -
      Math.floor(secondSeed);

    const y =
      secondNormalized *
      A4_HEIGHT;

    const length =
      8 +
      normalized * 20;

    const angle =
      (
        secondNormalized -
        0.5
      ) * 0.35;

    context.save();

    context.translate(
      x,
      y
    );

    context.rotate(angle);

    context.strokeStyle =
      "rgba(120, 110, 95, 0.018)";

    context.lineWidth = 0.45;

    context.beginPath();

    context.moveTo(
      0,
      0
    );

    context.lineTo(
      length,
      0
    );

    context.stroke();

    context.restore();
  }


  /*
   * Paper tonality
   */

  const paperGradient =
    context.createLinearGradient(
      0,
      0,
      A4_WIDTH,
      A4_HEIGHT
    );

  paperGradient.addColorStop(
    0,
    "rgba(255, 252, 244, 0.018)"
  );

  paperGradient.addColorStop(
    0.5,
    "rgba(255, 255, 255, 0)"
  );

  paperGradient.addColorStop(
    1,
    "rgba(245, 240, 228, 0.018)"
  );

  context.fillStyle =
    paperGradient;

  context.fillRect(
    0,
    0,
    A4_WIDTH,
    A4_HEIGHT
  );

  context.restore();
}


/*
 * =========================================================
 * CHARACTER VARIATION
 * =========================================================
 */

function deterministicVariation(
  index,
  amount = 1
) {
  const value =
    Math.sin(
      index * 12.9898
    ) * 43758.5453;

  const normalized =
    value -
    Math.floor(value);

  return (
    normalized - 0.5
  ) * amount;
}


/*
 * =========================================================
 * ACTUAL GLYPH WIDTH
 * =========================================================
 *
 * STEP 22
 *
 * Width is measured using Canvas measureText()
 * with the actual loaded handwriting font.
 * =========================================================
 */

function measureTextWithSpacing(
  context,
  text,
  letterSpacing = 0,
  wordSpacing = 4
) {
  let width = 0;

  for (
    const character of text
  ) {
    width +=
      context.measureText(
        character
      ).width;

    if (
      character === " "
    ) {
      width += wordSpacing;
    } else {
      width += letterSpacing;
    }
  }

  return width;
}


function wrapTextByRenderedWidth(
  context,
  text,
  maxWidth,
  {
    letterSpacing = 0,
    wordSpacing = 4,
    fontSize = 22,
    fontFamily,
  } = {}
) {
  if (!text) {
    return [""];
  }

  context.font =
    `${fontSize}px "${fontFamily}"`;

  const getWidth = (
    value,
    spacingForWords = wordSpacing
  ) =>
    measureTextWithSpacing(
      context,
      value,
      letterSpacing,
      spacingForWords
    );

  const lines = [];

  let currentLine = "";

  /*
   * Preserve normal word boundaries.
   */

  const words =
    text.split(/\s+/);

  for (
    const word of words
  ) {
    if (!word) {
      continue;
    }

    const candidate =
      currentLine
        ? `${currentLine} ${word}`
        : word;

    if (
      getWidth(candidate) <=
      maxWidth
    ) {
      currentLine =
        candidate;

      continue;
    }

    if (currentLine) {
      lines.push(
        currentLine
      );

      currentLine = "";
    }

    /*
     * Long word.
     *
     * Break using actual glyph widths.
     */

    if (
      getWidth(word, 0) <=
      maxWidth
    ) {
      currentLine = word;

      continue;
    }

    let partialWord = "";

    for (
      const character of word
    ) {
      const candidateCharacter =
        partialWord +
        character;

      const characterWidth =
        measureTextWithSpacing(
          context,
          candidateCharacter,
          letterSpacing,
          0
        );

      if (
        characterWidth <=
        maxWidth
      ) {
        partialWord =
          candidateCharacter;
      } else {
        if (partialWord) {
          lines.push(
            partialWord
          );
        }

        partialWord =
          character;
      }
    }

    currentLine =
      partialWord;
  }

  if (currentLine) {
    lines.push(
      currentLine
    );
  }

  return lines.length
    ? lines
    : [""];
}


/*
 * =========================================================
 * DRAW TEXT WITH NATURAL VARIATION
 * =========================================================
 */

function drawTextWithVariation(
  context,
  text,
  x,
  y,
  {
    letterSpacing = 0,
    wordSpacing = 4,
    naturalVariation = true,
    startIndex = 0,
    baseFontSize = 22,
    fontFamily,
    inkVariations = [],
    documentId =
      "inkai-preview-document",
    pageNumber = 1,
    inkStyle = "blue",
  } = {}
) {
  let currentX = x;

  for (
    let index = 0;
    index < text.length;
    index++
  ) {
    const character =
      text[index];

    const characterIndex =
      startIndex + index;

    /*
     * Space
     */

    if (
      character === " "
    ) {
      context.font =
        `${baseFontSize}px "${fontFamily}"`;

      currentX +=
        context.measureText(
          " "
        ).width +
        wordSpacing;

      continue;
    }


    let rotation = 0;
    let sizeMultiplier = 1;
    let verticalOffset = 0;
    let horizontalOffset = 0;
    let spacingVariation = 0;


    if (naturalVariation) {
      rotation =
        deterministicVariation(
          characterIndex * 3 + 1,
          4
        );

      sizeMultiplier =
        1 +
        deterministicVariation(
          characterIndex * 5 + 7,
          0.06
        );

      verticalOffset =
        deterministicVariation(
          characterIndex * 7 + 11,
          2
        );

      horizontalOffset =
        deterministicVariation(
          characterIndex * 11 + 17,
          0.6
        );

      spacingVariation =
        deterministicVariation(
          characterIndex * 13 + 29,
          0.4
        );
    }


    const characterSize =
      baseFontSize *
      sizeMultiplier;


    /*
     * Ink variation
     */

    const baseInkColor =
      context.__inkaiBaseInkColor;

    const inkVariation =
      getInkVariation(
        documentId,
        pageNumber,
        characterIndex,
        inkStyle,
        naturalVariation
      );


    let characterInk =
      baseInkColor;

    if (
      naturalVariation &&
      inkVariations.length > 0
    ) {
      const variationValue =
        Math.abs(
          deterministicVariation(
            characterIndex * 17 + 23,
            100
          )
        );

      const variationIndex =
        Math.floor(
          variationValue %
          inkVariations.length
        );

      characterInk =
        inkVariations[
          variationIndex
        ];
    }


    characterInk =
      adjustInkColor(
        characterInk,
        inkVariation.darknessMultiplier
      );


    const characterOpacity =
      Math.max(
        0,
        Math.min(
          1,
          (
            context.__inkaiBaseOpacity ||
            1
          ) *
          inkVariation.opacityMultiplier
        )
      );


    /*
     * Draw character
     */

    context.save();

    context.globalAlpha =
      characterOpacity;

    context.font =
      `${characterSize}px "${fontFamily}"`;

    context.fillStyle =
      characterInk;

    context.translate(
      currentX +
        horizontalOffset,
      y +
        verticalOffset
    );

    context.rotate(
      rotation *
      Math.PI /
      180
    );

    context.fillText(
      character,
      0,
      0
    );


    /*
     * Subtle texture
     */

    if (
      naturalVariation &&
      inkVariation.textureStrength >
        0
    ) {
      const textureAlpha =
        characterOpacity *
        inkVariation.textureStrength *
        0.12;

      context.globalAlpha =
        textureAlpha;

      context.translate(
        0.25,
        0.15
      );

      context.fillText(
        character,
        0,
        0
      );
    }

    context.restore();


    /*
     * Advance actual glyph width.
     */

    context.font =
      `${characterSize}px "${fontFamily}"`;

    const characterWidth =
      context.measureText(
        character
      ).width;

    currentX +=
      characterWidth +
      letterSpacing +
      spacingVariation;
  }

  return currentX;
}


/*
 * =========================================================
 * INLINE / BLOCK HELPERS
 * =========================================================
 */

function getBlockText(block) {
  if (!block) {
    return "";
  }

  if (
    typeof block.text ===
    "string"
  ) {
    return block.text;
  }

  return "";
}


function getListItemText(item) {
  if (!item) {
    return "";
  }

  if (
    typeof item.text ===
    "string"
  ) {
    return item.text;
  }

  for (
    const child of item.content ||
    []
  ) {
    if (
      child &&
      typeof child.text ===
      "string"
    ) {
      return child.text;
    }
  }

  return "";
}


/*
 * =========================================================
 * COMPONENT
 * =========================================================
 */

function HandwritingCanvas({
  document:
    handwritingDocument = null,

  /*
   * Backwards compatibility.
   *
   * Older callers may still provide text.
   */

  text = "",

  documentId =
    "inkai-preview-document",

  style,

  fontSize = 22,

  inkColor,

  paperStyle = "plain",

  inkStyle = "blue",

  letterSpacing = 0,

  lineSpacing = 1.5,

  wordSpacing = 4,

  inkOpacity = 0.9,

  naturalVariation = true,
}) {
  const [zoom, setZoom] =
    useState(0.8);

  const [pages, setPages] =
    useState([]);

  const margins =
    DEFAULT_MARGIN;


  /*
   * =========================================================
   * NORMALIZE DOCUMENT
   * =========================================================
   *
   * Step 24:
   *
   * Prefer the structured document.
   *
   * Only use plain text as a compatibility fallback.
   */

  const normalizedDocument =
    handwritingDocument &&
    Array.isArray(
      handwritingDocument.blocks
    )
      ? handwritingDocument
      : {
          documentId,
          title:
            "Untitled Document",

          blocks: [
            {
              type:
                "paragraph",

              text:
                text || "",
            },
          ],
        };


  /*
   * =========================================================
   * GENERATE PAGES
   * =========================================================
   */

  useEffect(() => {
    if (!style) {
      setPages([]);
      return;
    }

    const fonts =
      style.fonts || [];

    if (!fonts.length) {
      setPages([]);
      return;
    }

    const selectedFontPath =
      fonts[0];

    const fontFamily =
      getStyleFontFamily(
        style.id
      );

    const fontUrl =
      getFontUrl(
        selectedFontPath
      );

    const fontFace =
      new FontFace(
        fontFamily,
        `url("${fontUrl}")`
      );

    let cancelled = false;


    async function prepareFont() {
      try {
        await fontFace.load();

        if (cancelled) {
          return;
        }

        document.fonts.add(
          fontFace
        );

        createPages(
          fontFamily
        );
      } catch (error) {
        console.error(
          "Failed to load handwriting font:",
          error
        );

        if (!cancelled) {
          setPages([]);
        }
      }
    }


    /*
     * =======================================================
     * CREATE PAGES
     * =======================================================
     */

    function createPages(
      loadedFontFamily
    ) {
      const pageCanvases = [];

      const size =
        fontSize ||
        style.default_size ||
        22;


      /*
       * Measurement canvas
       *
       * The actual selected handwriting font is
       * already loaded at this point.
       */

      const measurementCanvas =
        document.createElement(
          "canvas"
        );

      measurementCanvas.width =
        A4_WIDTH;

      measurementCanvas.height =
        A4_HEIGHT;

      const measurementContext =
        measurementCanvas.getContext(
          "2d"
        );

      if (!measurementContext) {
        return;
      }


      const availableWidth =
        A4_WIDTH -
        margins.left -
        margins.right -
        6;


      /*
       * =====================================================
       * PAGE STATE
       * =====================================================
       */

      let currentPage =
        document.createElement(
          "canvas"
        );

      currentPage.width =
        A4_WIDTH;

      currentPage.height =
        A4_HEIGHT;

      let pageContext =
        currentPage.getContext(
          "2d"
        );

      if (!pageContext) {
        return;
      }


      let pageNumber = 1;

      let characterIndex = 0;

      let y =
        margins.top;


      setupPage(
        pageContext,
        loadedFontFamily,
        size
      );


      /*
       * =====================================================
       * PAGE HELPERS
       * =====================================================
       */

      const finishCurrentPage =
        () => {
          pageCanvases.push(
            currentPage
          );
        };


      const startNewPage =
        () => {
          currentPage =
            document.createElement(
              "canvas"
            );

          currentPage.width =
            A4_WIDTH;

          currentPage.height =
            A4_HEIGHT;

          pageContext =
            currentPage.getContext(
              "2d"
            );

          if (!pageContext) {
            return false;
          }

          pageNumber += 1;

          y =
            margins.top;

          setupPage(
            pageContext,
            loadedFontFamily,
            size
          );

          return true;
        };


      const ensureSpace =
        (requiredHeight) => {
          if (
            y +
              requiredHeight >
            A4_HEIGHT -
              margins.bottom
          ) {
            finishCurrentPage();

            return startNewPage();
          }

          return true;
        };


      /*
       * =====================================================
       * RENDER PARAGRAPH / HEADING
       * =====================================================
       */

      const renderTextBlock =
        (block) => {
          const isHeading =
            block.type ===
            "heading";

          const level =
            Number(
              block.level
            ) || 1;


          /*
           * Heading sizes
           */

          const headingScale = {
            1: 1.55,
            2: 1.35,
            3: 1.20,
          };

          const blockFontSize =
            isHeading
              ? size *
                (
                  headingScale[
                    level
                  ] || 1.2
                )
              : (
                  block.fontSize ||
                  size
                );


          const blockLineSpacing =
            isHeading
              ? (
                  block.lineSpacing ||
                  1.25
                )
              : (
                  block.lineSpacing ||
                  lineSpacing
                );


          const blockLineHeight =
            blockFontSize *
            blockLineSpacing;


          const blockText =
            getBlockText(
              block
            );


          /*
           * Empty paragraph.
           */

          if (
            !blockText
          ) {
            if (
              !ensureSpace(
                blockLineHeight
              )
            ) {
              return;
            }

            y +=
              blockLineHeight +
              (
                block.paragraphSpacing ||
                0
              );

            return;
          }


          measurementContext.font =
            `${blockFontSize}px "${loadedFontFamily}"`;


          const blockIndent =
            block.leftIndent ||
            0;


          const wrappedLines =
            wrapTextByRenderedWidth(
              measurementContext,
              blockText,
              Math.max(
                50,
                availableWidth -
                  blockIndent
              ),
              {
                letterSpacing,
                wordSpacing,
                fontSize:
                  blockFontSize,
                fontFamily:
                  loadedFontFamily,
              }
            );


          for (
            const line of wrappedLines
          ) {
            if (
              !ensureSpace(
                blockLineHeight
              )
            ) {
              return;
            }


            const ink =
              getInkConfiguration(
                inkStyle
              );


            /*
             * Heading and paragraph both use
             * the handwriting font.
             *
             * The size difference preserves
             * the semantic hierarchy.
             */

            drawTextWithVariation(
              pageContext,
              line,
              margins.left +
                blockIndent,
              y,
              {
                letterSpacing,
                wordSpacing,
                naturalVariation,

                startIndex:
                  characterIndex,

                baseFontSize:
                  blockFontSize,

                fontFamily:
                  loadedFontFamily,

                inkVariations:
                  ink.variations,

                documentId,

                pageNumber,

                inkStyle,
              }
            );


            characterIndex +=
              line.length + 1;

            y +=
              blockLineHeight;
          }


          /*
           * Paragraph / heading spacing.
           */

          y +=
            block.paragraphSpacing ||
            (isHeading ? 12 : 6);
        };


      /*
       * =====================================================
       * RENDER LIST
       * =====================================================
       */

      const renderListBlock =
        (block) => {
          const isOrdered =
            block.type ===
            "orderedList";

          const items =
            block.items || [];

          const listIndent =
            block.indent ||
            28;

          const listFontSize =
            block.fontSize ||
            size;

          const listLineHeight =
            listFontSize *
            (
              block.lineSpacing ||
              lineSpacing
            );


          items.forEach(
            (item, index) => {
              const itemText =
                getListItemText(
                  item
                );

              const marker =
                isOrdered
                  ? `${index + 1}.`
                  : "•";


              const combinedText =
                `${marker} ${itemText}`;


              measurementContext.font =
                `${listFontSize}px "${loadedFontFamily}"`;


              const wrappedLines =
                wrapTextByRenderedWidth(
                  measurementContext,
                  combinedText,
                  Math.max(
                    50,
                    availableWidth -
                      listIndent
                  ),
                  {
                    letterSpacing,
                    wordSpacing,
                    fontSize:
                      listFontSize,
                    fontFamily:
                      loadedFontFamily,
                  }
                );


              wrappedLines.forEach(
                (line) => {
                  if (
                    !ensureSpace(
                      listLineHeight
                    )
                  ) {
                    return;
                  }


                  const ink =
                    getInkConfiguration(
                      inkStyle
                    );


                  drawTextWithVariation(
                    pageContext,
                    line,
                    margins.left +
                      listIndent,
                    y,
                    {
                      letterSpacing,
                      wordSpacing,
                      naturalVariation,

                      startIndex:
                        characterIndex,

                      baseFontSize:
                        listFontSize,

                      fontFamily:
                        loadedFontFamily,

                      inkVariations:
                        ink.variations,

                      documentId,

                      pageNumber,

                      inkStyle,
                    }
                  );


                  characterIndex +=
                    line.length + 1;

                  y +=
                    listLineHeight;
                }
              );


              y +=
                block.paragraphSpacing ||
                4;
            }
          );

          y += 4;
        };


      /*
       * =====================================================
       * TABLE HELPERS
       * =====================================================
       */

      const getCellText =
        (cell) => {
          if (!cell) {
            return "";
          }

          if (
            typeof cell.text ===
            "string"
          ) {
            return cell.text;
          }

          return "";
        };


      const renderTableBlock =
        (block) => {
          const rows =
            block.rows || [];

          if (!rows.length) {
            return;
          }


          const cellPadding =
            block.cellPadding ||
            8;

          const tableFontSize =
            block.fontSize ||
            size;

          const tableLineHeight =
            tableFontSize *
            1.35;


          /*
           * Determine column count.
           */

          const columnCount =
            rows.reduce(
              (
                maximum,
                row
              ) =>
                Math.max(
                  maximum,
                  (
                    row.cells ||
                    []
                  ).length
                ),
              0
            );


          if (
            columnCount === 0
          ) {
            return;
          }


          /*
           * Measure the widest content
           * in each column.
           */

          const columnWidths =
            new Array(
              columnCount
            ).fill(0);


          rows.forEach(
            (row) => {
              (
                row.cells ||
                []
              ).forEach(
                (
                  cell,
                  columnIndex
                ) => {
                  const cellText =
                    getCellText(
                      cell
                    );

                  measurementContext.font =
                    `${tableFontSize}px "${loadedFontFamily}"`;

                  const measuredWidth =
                    measureTextWithSpacing(
                      measurementContext,
                      cellText,
                      letterSpacing,
                      wordSpacing
                    );

                  columnWidths[
                    columnIndex
                  ] =
                    Math.max(
                      columnWidths[
                        columnIndex
                      ],
                      measuredWidth +
                        cellPadding * 2
                    );
                }
              );
            }
          );


          /*
           * Fit table into available width.
           */

          const totalWidth =
            columnWidths.reduce(
              (
                total,
                width
              ) =>
                total + width,
              0
            );


          const tableMaxWidth =
            availableWidth;


          if (
            totalWidth >
            tableMaxWidth
          ) {
            const scale =
              tableMaxWidth /
              totalWidth;

            for (
              let index = 0;
              index <
              columnWidths.length;
              index++
            ) {
              columnWidths[
                index
              ] *= scale;
            }
          }


          const tableWidth =
            columnWidths.reduce(
              (
                total,
                width
              ) =>
                total + width,
              0
            );


          /*
           * Render each row.
           */

          rows.forEach(
            (row) => {
              const cells =
                row.cells || [];


              let rowHeight =
                tableLineHeight +
                cellPadding * 2;


              if (
                !ensureSpace(
                  rowHeight
                )
              ) {
                return;
              }


              /*
               * Calculate row height from
               * wrapped cell content.
               */

              const wrappedCells =
                cells.map(
                  (
                    cell,
                    columnIndex
                  ) => {
                    const cellText =
                      getCellText(
                        cell
                      );

                    const cellWidth =
                      Math.max(
                        30,
                        (
                          columnWidths[
                            columnIndex
                          ] ||
                          80
                        ) -
                        cellPadding * 2
                      );


                    measurementContext.font =
                      `${tableFontSize}px "${loadedFontFamily}"`;


                    const wrapped =
                      wrapTextByRenderedWidth(
                        measurementContext,
                        cellText,
                        cellWidth,
                        {
                          letterSpacing,
                          wordSpacing,
                          fontSize:
                            tableFontSize,
                          fontFamily:
                            loadedFontFamily,
                        }
                      );


                    return {
                      cell,
                      lines:
                        wrapped,
                    };
                  }
                );


              const maximumLines =
                wrappedCells.reduce(
                  (
                    maximum,
                    item
                  ) =>
                    Math.max(
                      maximum,
                      item.lines.length
                    ),
                  1
                );


              rowHeight =
                maximumLines *
                tableLineHeight +
                cellPadding * 2;


              if (
                !ensureSpace(
                  rowHeight
                )
              ) {
                return;
              }


              /*
               * Draw cells.
               */

              let currentX =
                margins.left;


              wrappedCells.forEach(
                (
                  item,
                  columnIndex
                ) => {
                  const cellWidth =
                    columnWidths[
                      columnIndex
                    ] || 80;


                  const isHeader =
                    item.cell?.type ===
                    "tableHeader";


                  /*
                   * Cell background.
                   */

                  if (isHeader) {
                    pageContext.save();

                    pageContext.fillStyle =
                      "rgba(235, 235, 235, 0.35)";

                    pageContext.fillRect(
                      currentX,
                      y,
                      cellWidth,
                      rowHeight
                    );

                    pageContext.restore();
                  }


                  /*
                   * Cell border.
                   */

                  pageContext.save();

                  pageContext.strokeStyle =
                    "rgba(80, 80, 80, 0.45)";

                  pageContext.lineWidth =
                    0.8;

                  pageContext.strokeRect(
                    currentX,
                    y,
                    cellWidth,
                    rowHeight
                  );

                  pageContext.restore();


                  /*
                   * Handwritten cell content.
                   */

                  item.lines.forEach(
                    (
                      cellLine,
                      lineIndex
                    ) => {
                      const ink =
                        getInkConfiguration(
                          inkStyle
                        );


                      drawTextWithVariation(
                        pageContext,
                        cellLine,
                        currentX +
                          cellPadding,
                        y +
                          cellPadding +
                          lineIndex *
                            tableLineHeight,
                        {
                          letterSpacing,
                          wordSpacing,
                          naturalVariation,

                          startIndex:
                            characterIndex,

                          baseFontSize:
                            tableFontSize,

                          fontFamily:
                            loadedFontFamily,

                          inkVariations:
                            ink.variations,

                          documentId,

                          pageNumber,

                          inkStyle,
                        }
                      );


                      characterIndex +=
                        cellLine.length +
                        1;
                    }
                  );


                  currentX +=
                    cellWidth;
                }
              );


              /*
               * Advance to next row.
               */

              y +=
                rowHeight;
            }
          );


          /*
           * Table bottom spacing.
           */

          y += 12;
        };


      /*
       * =====================================================
       * RENDER IMAGE
       * =====================================================
       *
       * Images remain structural.
       *
       * Actual image loading is intentionally asynchronous,
       * so we reserve a safe visual placeholder for preview.
       * PDF image embedding can be handled in Phase 9.
       */

      const renderImageBlock =
        (block) => {
          const imageHeight =
            Math.min(
              240,
              block.height ||
                180
            );

          if (
            !ensureSpace(
              imageHeight
            )
          ) {
            return;
          }


          pageContext.save();

          pageContext.strokeStyle =
            "rgba(120, 120, 120, 0.35)";

          pageContext.setLineDash([
            5,
            4,
          ]);

          pageContext.strokeRect(
            margins.left,
            y,
            Math.min(
              availableWidth,
              block.width ||
                availableWidth
            ),
            imageHeight
          );

          pageContext.setLineDash([]);

          pageContext.font =
            `14px "${loadedFontFamily}"`;

          pageContext.fillStyle =
            "rgba(90, 90, 90, 0.7)";

          pageContext.fillText(
            block.alt ||
              "Image",
            margins.left + 12,
            y + 12
          );

          pageContext.restore();

          y +=
            imageHeight + 12;
        };


      /*
       * =====================================================
       * STRUCTURED DOCUMENT RENDERING
       * =====================================================
       *
       * STEP 24
       *
       * We deliberately switch on block.type.
       *
       * No flattening.
       */

      const blocks =
        normalizedDocument.blocks ||
        [];


      for (
        const block of blocks
      ) {
        if (!block) {
          continue;
        }


        /*
         * ---------------------------------------------------
         * MANUAL PAGE BREAK
         * ---------------------------------------------------
         */

        if (
          block.type ===
          "pageBreak"
        ) {
          finishCurrentPage();

          if (
            !startNewPage()
          ) {
            break;
          }

          continue;
        }


        /*
         * ---------------------------------------------------
         * PARAGRAPH
         * ---------------------------------------------------
         */

        if (
          block.type ===
          "paragraph"
        ) {
          renderTextBlock(
            block
          );

          continue;
        }


        /*
         * ---------------------------------------------------
         * HEADING
         * ---------------------------------------------------
         */

        if (
          block.type ===
          "heading"
        ) {
          renderTextBlock(
            block
          );

          continue;
        }


        /*
         * ---------------------------------------------------
         * BULLET LIST
         * ---------------------------------------------------
         */

        if (
          block.type ===
          "bulletList"
        ) {
          renderListBlock(
            block
          );

          continue;
        }


        /*
         * ---------------------------------------------------
         * ORDERED LIST
         * ---------------------------------------------------
         */

        if (
          block.type ===
          "orderedList"
        ) {
          renderListBlock(
            block
          );

          continue;
        }


        /*
         * ---------------------------------------------------
         * TABLE
         * ---------------------------------------------------
         */

        if (
          block.type ===
          "table"
        ) {
          renderTableBlock(
            block
          );

          continue;
        }


        /*
         * ---------------------------------------------------
         * IMAGE
         * ---------------------------------------------------
         */

        if (
          block.type ===
          "image"
        ) {
          renderImageBlock(
            block
          );

          continue;
        }


        /*
         * ---------------------------------------------------
         * LIST ITEM
         *
         * Normally handled by its parent list.
         * ---------------------------------------------------
         */

        if (
          block.type ===
          "listItem"
        ) {
          renderTextBlock({
            type:
              "paragraph",

            text:
              getListItemText(
                block
              ),
          });

          continue;
        }


        /*
         * ---------------------------------------------------
         * UNKNOWN BLOCK
         * ---------------------------------------------------
         *
         * We do not silently flatten it.
         *
         * This makes future Phase 7 nodes easier to add.
         * ---------------------------------------------------
         */

        console.warn(
          "InkAI handwriting renderer: unsupported block",
          block.type
        );
      }


      /*
       * =====================================================
       * FINAL PAGE
       * =====================================================
       */

      if (
        pageCanvases.length === 0 ||
        pageCanvases[
          pageCanvases.length - 1
        ] !== currentPage
      ) {
        pageCanvases.push(
          currentPage
        );
      }


      if (!cancelled) {
        setPages(
          pageCanvases
        );
      }
    }


    /*
     * =======================================================
     * PAGE SETUP
     * =======================================================
     */

    function setupPage(
      context,
      loadedFontFamily,
      size
    ) {
      drawPaperBackground(
        context,
        paperStyle
      );


      const ink =
        getInkConfiguration(
          inkStyle
        );


      context.__inkaiFontFamily =
        loadedFontFamily;

      context.__inkaiBaseInkColor =
        inkColor ||
        ink.base;

      context.font =
        `${size}px "${loadedFontFamily}"`;

      context.__inkaiBaseOpacity =
        inkOpacity;

      context.globalAlpha =
        inkOpacity;

      context.textBaseline =
        "top";

      context.textAlign =
        "left";
    }


    prepareFont();


    return () => {
      cancelled = true;
    };
  }, [
    normalizedDocument,
    documentId,
    style,
    fontSize,
    inkColor,
    paperStyle,
    inkStyle,
    letterSpacing,
    lineSpacing,
    wordSpacing,
    inkOpacity,
    naturalVariation,
    text,
  ]);


  /*
   * =========================================================
   * ZOOM
   * =========================================================
   */

  const zoomIn = () => {
    setZoom(
      (current) =>
        Math.min(
          1.5,
          Number(
            (
              current + 0.1
            ).toFixed(2)
          )
        )
    );
  };


  const zoomOut = () => {
    setZoom(
      (current) =>
        Math.max(
          0.5,
          Number(
            (
              current - 0.1
            ).toFixed(2)
          )
        )
    );
  };


  const resetZoom = () => {
    setZoom(0.8);
  };


  /*
   * =========================================================
   * UI
   * =========================================================
   */

  return (
    <div
      className="
        flex
        h-full
        min-h-[700px]
        flex-col
        overflow-hidden
        rounded-2xl
        border
        border-gray-200
        bg-gray-100
        dark:border-gray-800
        dark:bg-gray-950
      "
    >

      {/* ===================================================
          TOOLBAR
          =================================================== */}

      <div
        className="
          flex
          shrink-0
          items-center
          justify-between
          border-b
          border-gray-200
          bg-white
          px-4
          py-3
          dark:border-gray-800
          dark:bg-gray-900
        "
      >

        <div>

          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            Handwriting Preview
          </p>

          <p className="text-xs text-gray-500 dark:text-gray-400">
            {pages.length}{" "}
            {pages.length === 1
              ? "page"
              : "pages"}
          </p>

        </div>


        <div className="flex items-center gap-1">

          <button
            type="button"
            onClick={zoomOut}
            disabled={
              zoom <= 0.5
            }
            className="
              rounded-lg
              p-2
              text-gray-600
              transition
              hover:bg-gray-100
              disabled:cursor-not-allowed
              disabled:opacity-40
              dark:text-gray-300
              dark:hover:bg-gray-800
            "
            title="Zoom out"
          >
            <ZoomOut size={18} />
          </button>


          <button
            type="button"
            onClick={resetZoom}
            className="
              min-w-[64px]
              rounded-lg
              px-2
              py-2
              text-xs
              font-medium
              text-gray-700
              hover:bg-gray-100
              dark:text-gray-300
              dark:hover:bg-gray-800
            "
            title="Reset zoom"
          >
            {Math.round(
              zoom * 100
            )}
            %
          </button>


          <button
            type="button"
            onClick={zoomIn}
            disabled={
              zoom >= 1.5
            }
            className="
              rounded-lg
              p-2
              text-gray-600
              transition
              hover:bg-gray-100
              disabled:cursor-not-allowed
              disabled:opacity-40
              dark:text-gray-300
              dark:hover:bg-gray-800
            "
            title="Zoom in"
          >
            <ZoomIn size={18} />
          </button>


          <div
            className="
              mx-1
              h-5
              w-px
              bg-gray-200
              dark:bg-gray-700
            "
          />


          <button
            type="button"
            onClick={resetZoom}
            className="
              rounded-lg
              p-2
              text-gray-600
              hover:bg-gray-100
              dark:text-gray-300
              dark:hover:bg-gray-800
            "
            title="Reset zoom"
          >
            <RotateCcw size={17} />
          </button>

        </div>

      </div>


      {/* ===================================================
          PAGES
          =================================================== */}

      <div className="flex-1 overflow-auto p-6">

        <div
          className="
            flex
            min-w-max
            flex-col
            items-center
            gap-8
          "
        >

          {pages.map(
            (
              page,
              index
            ) => (
              <div
                key={index}
                className="
                  relative
                  shrink-0
                "
                style={{
                  width:
                    `${A4_WIDTH * zoom}px`,

                  height:
                    `${A4_HEIGHT * zoom}px`,
                }}
              >

                <img
                  src={page.toDataURL(
                    "image/png"
                  )}
                  alt={
                    `Handwriting page ${
                      index + 1
                    }`
                  }
                  className="
                    absolute
                    left-0
                    top-0
                    block
                    origin-top-left
                    bg-white
                    shadow-xl
                  "
                  style={{
                    width:
                      `${A4_WIDTH}px`,

                    height:
                      `${A4_HEIGHT}px`,

                    transform:
                      `scale(${zoom})`,
                  }}
                />


                {/* MARGIN GUIDE */}

                <div
                  className="
                    pointer-events-none
                    absolute
                    left-0
                    top-0
                  "
                  style={{
                    width:
                      `${A4_WIDTH}px`,

                    height:
                      `${A4_HEIGHT}px`,

                    transform:
                      `scale(${zoom})`,

                    transformOrigin:
                      "top left",
                  }}
                >

                  <div
                    className="
                      absolute
                      border
                      border-dashed
                      border-gray-300
                    "
                    style={{
                      left:
                        margins.left,

                      top:
                        margins.top,

                      width:
                        A4_WIDTH -
                        margins.left -
                        margins.right,

                      height:
                        A4_HEIGHT -
                        margins.top -
                        margins.bottom,
                    }}
                  />

                </div>


                {/* PAGE NUMBER */}

                <div
                  className="
                    absolute
                    left-1/2
                    -translate-x-1/2
                    text-[10px]
                    text-gray-400
                  "
                  style={{
                    bottom: -22,
                  }}
                >
                  Page{" "}
                  {index + 1}
                </div>

              </div>
            )
          )}


          {pages.length === 0 && (
            <div
              className="
                flex
                min-h-[500px]
                items-center
                justify-center
                text-sm
                text-gray-500
              "
            >
              Preparing handwriting preview...
            </div>
          )}

        </div>

      </div>

    </div>
  );
}


export default HandwritingCanvas;