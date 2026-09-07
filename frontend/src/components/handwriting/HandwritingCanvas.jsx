import React, { useEffect, useState } from "react";

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
 * INK VARIATION HELPERS
 * =========================================================
 *
 * Step 18
 *
 * These functions intentionally use deterministic values.
 * Preview and re-render therefore remain stable.
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

  for (let index = 0; index < input.length; index++) {
    hash ^= input.charCodeAt(index);

    hash =
      Math.imul(
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
  /*
   * Variation disabled
   */
  if (!naturalVariation) {
    return {
      opacityMultiplier: 1,
      darknessMultiplier: 1,
      textureStrength: 0,
    };
  }

  /*
   * =======================================================
   * PENCIL
   * =======================================================
   */

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
      /*
       * 88% – 98%
       */
      opacityMultiplier:
        0.88 +
        opacityRandom * 0.10,

      /*
       * 82% – 94%
       */
      darknessMultiplier:
        0.82 +
        darknessRandom * 0.12,

      /*
       * 2% – 10%
       */
      textureStrength:
        0.02 +
        textureRandom * 0.08,
    };
  }

  /*
   * =======================================================
   * NORMAL INK
   * =======================================================
   */

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
    /*
     * 94% – 104%
     */
    opacityMultiplier:
      0.94 +
      opacityRandom * 0.10,

    /*
     * 94% – 104%
     */
    darknessMultiplier:
      0.94 +
      darknessRandom * 0.10,

    /*
     * 0% – 8%
     */
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

  /*
   * Convert #RRGGBB into RGB.
   */

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

  /*
   * Darkness multiplier:
   *
   * < 1 = lighter
   * > 1 = darker
   */

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

function drawPaperBackground(context, paperStyle) {
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

  context.fillRect(
    0,
    0,
    A4_WIDTH,
    A4_HEIGHT
  );

  if (paperStyle === "plain") {
    context.restore();
    return;
  }

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

function drawRuledPaper(context, paperStyle) {
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

    context.moveTo(105, 45);

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

/*
 * =========================================================
 * REALISTIC PAPER TEXTURE
 * =========================================================
 *
 * Step 20
 *
 * The texture is intentionally extremely subtle.
 *
 * Layers:
 *
 * 1. Micro grain
 * 2. Very faint paper fibers
 * 3. Slight tonal variation
 *
 * The goal is:
 *
 *     real paper
 *
 * NOT:
 *
 *     Photoshop/noise filter
 * =========================================================
 */

function drawPaperTexture(context) {
  context.save();

  /*
   * ---------------------------------------------------------
   * 1. VERY SUBTLE MICRO GRAIN
   * ---------------------------------------------------------
   *
   * Small low-opacity points create microscopic
   * paper irregularity.
   */

  for (let y = 0; y < A4_HEIGHT; y += 6) {
    for (let x = 0; x < A4_WIDTH; x += 6) {
      const value =
        Math.sin(
          x * 12.9898 +
          y * 78.233
        ) * 43758.5453;

      const normalized =
        value - Math.floor(value);

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
   * ---------------------------------------------------------
   * 2. VERY FAINT PAPER FIBERS
   * ---------------------------------------------------------
   *
   * Fibers are longer than grain and should be
   * barely visible.
   */

  for (let index = 0; index < 180; index++) {
    const seed =
      Math.sin(
        index * 91.731
      ) * 43758.5453;

    const normalized =
      seed - Math.floor(seed);

    const x =
      normalized * A4_WIDTH;

    const secondSeed =
      Math.sin(
        index * 47.173
      ) * 43758.5453;

    const secondNormalized =
      secondSeed -
      Math.floor(secondSeed);

    const y =
      secondNormalized * A4_HEIGHT;

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
   * ---------------------------------------------------------
   * 3. EXTREMELY SUBTLE PAPER TONALITY
   * ---------------------------------------------------------
   *
   * Adds warmth without making the paper visibly beige.
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
 * DETERMINISTIC VARIATION
 * =========================================================
 *
 * Generates repeatable pseudo-random values.
 *
 * IMPORTANT:
 * The variation is intentionally subtle.
 *
 * Rotation:
 * -2° to +2°
 *
 * Scale:
 * 97% to 103%
 *
 * Vertical offset:
 * -1px to +1px
 *
 * Horizontal offset:
 * approximately -0.3px to +0.3px
 *
 * This keeps the handwriting natural instead
 * of making every character look randomly distorted.
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
 * MEASURE TEXT WITH SPACING
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

    if (character === " ") {
      width += wordSpacing;
    } else {
      width += letterSpacing;
    }
  }

  return width;
}

/*
 * =========================================================
 * WIDTH-AWARE TEXT WRAPPING
 * =========================================================
 *
 * STEP 22
 *
 * Wrap text using actual rendered glyph widths.
 *
 * Important:
 * We measure the text using the currently loaded
 * handwriting font rather than estimating width from
 * character count.
 * =========================================================
 */

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

  /*
   * Make absolutely sure measurement uses the
   * selected handwriting font.
   */

  context.font =
    `${fontSize}px "${fontFamily}"`;

  /*
   * -------------------------------------------------------
   * Measure a string using actual Canvas glyph metrics.
   * -------------------------------------------------------
   */

  const getWidth = (value) => {
    return measureTextWithSpacing(
      context,
      value,
      letterSpacing,
      wordSpacing
    );
  };

  const lines = [];

  let currentLine = "";

  /*
   * Keep normal spaces between words.
   */

  const words = text.split(/\s+/);

  for (const word of words) {
    if (!word) {
      continue;
    }

    const candidate =
      currentLine
        ? `${currentLine} ${word}`
        : word;

    /*
     * Entire candidate fits.
     */

    if (getWidth(candidate) <= maxWidth) {
      currentLine = candidate;
      continue;
    }

    /*
     * Push the current line if it contains text.
     */

    if (currentLine) {
      lines.push(currentLine);
      currentLine = "";
    }

    /*
     * -----------------------------------------------------
     * LONG WORD HANDLING
     * -----------------------------------------------------
     *
     * A single word may itself be wider than the page.
     *
     * Break it using actual glyph widths.
     */

    if (getWidth(word) <= maxWidth) {
      currentLine = word;
      continue;
    }

    let partialWord = "";

    for (const character of word) {
      const candidateCharacter =
        partialWord + character;

      /*
       * No word spacing inside a word.
       */

      const characterWidth =
        measureTextWithSpacing(
          context,
          candidateCharacter,
          letterSpacing,
          0
        );

      if (
        characterWidth <= maxWidth
      ) {
        partialWord =
          candidateCharacter;
      } else {
        if (partialWord) {
          lines.push(partialWord);
        }

        partialWord = character;
      }
    }

    currentLine = partialWord;
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines.length
    ? lines
    : [""];
}

/*
 * =========================================================
 * DRAW INDIVIDUAL CHARACTERS
 * =========================================================
 *
 * STEP 11 + STEP 12
 *
 * Each character receives very small
 * independent transformations.
 *
 * The goal is NOT obvious randomness.
 *
 * The goal is subtle human-like inconsistency.
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
    documentId = "inkai-preview-document",
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
     * =======================================================
     * SPACE
     * =======================================================
     */

    if (character === " ") {
      context.font =
        `${baseFontSize}px "${fontFamily}"`;

      currentX +=
        context.measureText(" ").width +
        wordSpacing;

      continue;
    }

    /*
     * =======================================================
     * DEFAULT VALUES
     * =======================================================
     */

    let rotation = 0;
    let sizeMultiplier = 1;
    let verticalOffset = 0;
    let horizontalOffset = 0;
    let spacingVariation = 0;

    /*
     * =======================================================
     * NATURAL VARIATION
     * =======================================================
     *
     * STEP 12
     *
     * Keep every value deliberately small.
     * =======================================================
     */

    if (naturalVariation) {
      /*
       * Rotation:
       *
       * -2° to +2°
       */

      rotation =
        deterministicVariation(
          characterIndex * 3 + 1,
          4
        );

      /*
       * Scale:
       *
       * 97% to 103%
       */

      sizeMultiplier =
        1 +
        deterministicVariation(
          characterIndex * 5 + 7,
          0.06
        );

      /*
       * Vertical offset:
       *
       * -1px to +1px
       */

      verticalOffset =
        deterministicVariation(
          characterIndex * 7 + 11,
          2
        );

      /*
       * Horizontal offset:
       *
       * approximately
       * -0.3px to +0.3px
       */

      horizontalOffset =
        deterministicVariation(
          characterIndex * 11 + 17,
          0.6
        );

      /*
       * Letter spacing variation:
       *
       * approximately
       * -0.2px to +0.2px
       *
       * This is intentionally tiny.
       */

      spacingVariation =
        deterministicVariation(
          characterIndex * 13 + 29,
          0.4
        );
    }

    /*
     * =======================================================
     * CHARACTER SIZE
     * =======================================================
     */

    const characterSize =
      baseFontSize *
      sizeMultiplier;

    /*
     * =======================================================
     * INK VARIATION
     * =======================================================
     *
     * Only subtle color changes are used.
     */

    /*
    * =======================================================
    * STEP 18 — INK VARIATION
    * =======================================================
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

    /*
    * Existing color variation.
    *
    * Keep this because it gives the ink
    * very subtle color differences.
    */

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

    /*
    * Step 18:
    * Slight stroke darkness variation.
    */

    characterInk =
      adjustInkColor(
        characterInk,
        inkVariation.darknessMultiplier
      );

    /*
     * =======================================================
     * DRAW CHARACTER
     * =======================================================
     */

    /*
    * =======================================================
    * STEP 18 — PER CHARACTER OPACITY
    * =======================================================
    */

    const characterOpacity =
      Math.max(
        0,
        Math.min(
          1,
          (context.__inkaiBaseOpacity || 1) *
          inkVariation.opacityMultiplier
        )
      );

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
    * =======================================================
    * STEP 18 — SUBTLE INK TEXTURE
    * =======================================================
    *
    * A very faint secondary pass makes the stroke
    * feel less perfectly digital.
    *
    * The effect is intentionally tiny.
    */

    if (
      naturalVariation &&
      inkVariation.textureStrength > 0
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
     * =======================================================
     * ADVANCE CHARACTER POSITION
     * =======================================================
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
 * COMPONENT
 * =========================================================
 */

function HandwritingCanvas({
  text = "",

  documentId = "inkai-preview-document",

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

    /*
     * Use the primary font.
     *
     * Natural variation is created through
     * subtle character-level transformations.
     */

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
      }
    }

    /*
     * =======================================================
     * CREATE PAGES
     * =======================================================
     */

    function createPages(loadedFontFamily) {
      const pageCanvases = [];

      const size =
        fontSize ||
        style.default_size ||
        22;

      const lineHeight =
        size * lineSpacing;

      /*
      * =====================================================
      * MEASUREMENT CANVAS
      * =====================================================
      *
      * IMPORTANT:
      * The handwriting font has already been loaded before
      * this function is called.
      *
      * Canvas measureText() therefore gives us the actual
      * rendered width of the selected handwriting font.
      */

      const measurementCanvas =
        document.createElement("canvas");

      measurementCanvas.width = A4_WIDTH;
      measurementCanvas.height = A4_HEIGHT;

      const measurementContext =
        measurementCanvas.getContext("2d");

      if (!measurementContext) {
        return;
      }

      measurementContext.font =
        `${size}px "${loadedFontFamily}"`;

      /*
      * =====================================================
      * AVAILABLE TEXT WIDTH
      * =====================================================
      */

      const availableWidth =
        A4_WIDTH -
        margins.left -
        margins.right -
        6;

      /*
      * =====================================================
      * STEP 22
      * WIDTH-AWARE TEXT WRAPPING
      * =====================================================
      *
      * Uses the actual rendered width of each glyph.
      *
      * We deliberately use the same font that will be used
      * for final rendering.
      */

      const lines = [];

      const paragraphs =
        String(text ?? "").split("\n");

      paragraphs.forEach((paragraph) => {
        /*
        * Preserve completely blank lines.
        */
        if (!paragraph.trim()) {
          lines.push("");
          return;
        }

        const wrappedLines =
          wrapTextByRenderedWidth(
            measurementContext,
            paragraph,
            availableWidth,
            {
              letterSpacing,
              wordSpacing,
              fontSize: size,
              fontFamily: loadedFontFamily,
            }
          );

        lines.push(...wrappedLines);
      });

      /*
      * =====================================================
      * EMPTY DOCUMENT
      * =====================================================
      */

      if (lines.length === 0) {
        lines.push("");
      }

      /*
      * =====================================================
      * STEP 23
      * PAGE CREATION
      * =====================================================
      */

      let currentPage =
        document.createElement("canvas");

      currentPage.width = A4_WIDTH;
      currentPage.height = A4_HEIGHT;

      let pageContext =
        currentPage.getContext("2d");

      if (!pageContext) {
        return;
      }

      /*
      * Page number starts at 1.
      *
      * This is also used by deterministic ink variation.
      */

      let pageNumber = 1;

      setupPage(
        pageContext,
        loadedFontFamily,
        size
      );

      let y = margins.top;

      /*
      * Global character index.
      *
      * Keeping this continuous prevents the same character
      * from receiving the same variation merely because it
      * moved to another line.
      */

      let characterIndex = 0;

      /*
      * =====================================================
      * DRAW / PAGINATE
      * =====================================================
      */

      for (const line of lines) {
        /*
        * -----------------------------------------------------
        * STEP 23 — AUTOMATIC PAGE BREAK
        * -----------------------------------------------------
        */

        if (
          y + lineHeight >
          A4_HEIGHT - margins.bottom
        ) {
          /*
          * Store completed page.
          */

          pageCanvases.push(currentPage);

          /*
          * Create next A4 page.
          */

          currentPage =
            document.createElement("canvas");

          currentPage.width = A4_WIDTH;
          currentPage.height = A4_HEIGHT;

          pageContext =
            currentPage.getContext("2d");

          if (!pageContext) {
            break;
          }

          /*
          * Increment page number BEFORE rendering
          * the new page.
          */

          pageNumber += 1;

          setupPage(
            pageContext,
            loadedFontFamily,
            size
          );

          y = margins.top;
        }

        /*
        * -----------------------------------------------------
        * DRAW CURRENT LINE
        * -----------------------------------------------------
        */

        if (line) {
          const ink =
            getInkConfiguration(inkStyle);

          drawTextWithVariation(
            pageContext,
            line,
            margins.left,
            y,
            {
              letterSpacing,
              wordSpacing,
              naturalVariation,
              startIndex: characterIndex,
              baseFontSize: size,
              fontFamily: loadedFontFamily,
              inkVariations: ink.variations,

              /*
              * Step 18 deterministic ink variation.
              */

              documentId,
              pageNumber,
              inkStyle,
            }
          );
        }

        /*
        * Move character index forward.
        *
        * +1 represents the logical separator between
        * rendered lines.
        */

        characterIndex +=
          line.length + 1;

        /*
        * Move down to next handwriting line.
        */

        y += lineHeight;
      }

      /*
      * =====================================================
      * FINAL PAGE
      * =====================================================
      */

      pageCanvases.push(currentPage);

      /*
      * Only update React state if the effect has not
      * been cancelled.
      */

      if (!cancelled) {
        setPages(pageCanvases);
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
      /*
       * Paper
       */

      drawPaperBackground(
        context,
        paperStyle
      );

      /*
       * Ink configuration
       */

      const ink =
        getInkConfiguration(
          inkStyle
        );

      /*
       * Store base ink color
       * for the character renderer.
       */

      context.__inkaiFontFamily =
        loadedFontFamily;

      context.__inkaiBaseInkColor =
        inkColor ||
        ink.base;

      /*
       * Base font
       */

      context.font =
        `${size}px "${loadedFontFamily}"`;

      /*
       * Ink opacity
       */

      context.__inkaiBaseOpacity =
        inkOpacity;

      context.globalAlpha =
        inkOpacity;

      /*
       * Text configuration
       */

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
    text,
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
            disabled={zoom <= 0.5}
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
            disabled={zoom >= 1.5}
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
            (page, index) => (
              <div
                key={index}
                className="relative shrink-0"
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
                  alt={`Handwriting page ${
                    index + 1
                  }`}
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