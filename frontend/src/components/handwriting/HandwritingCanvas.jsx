import React, {
  useEffect,
  useMemo,
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

  gray: {
    base: "#5A5A5A",
    variations: [
      "#515151",
      "#5A5A5A",
      "#636363",
      "#6B6B6B",
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
 * DETERMINISTIC RANDOMNESS
 * =========================================================
 *
 * Same:
 *
 * documentId
 * + style
 * + seed
 * + page
 * + character
 *
 * produces the same handwriting.
 * =========================================================
 */

function hashString(value) {
  const input = String(
    value ?? ""
  );

  let hash = 2166136261;

  for (
    let index = 0;
    index < input.length;
    index += 1
  ) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(
      hash,
      16777619
    );
  }

  return hash >>> 0;
}


function deterministicRandom(
  ...values
) {
  const hash = hashString(
    values.join(":")
  );

  return (
    hash / 4294967295
  );
}


function deterministicVariation(
  documentId,
  styleId,
  seed,
  pageNumber,
  characterIndex,
  channel,
  amount = 1
) {
  const random =
    deterministicRandom(
      documentId,
      styleId,
      seed,
      pageNumber,
      characterIndex,
      channel
    );

  return (
    (random - 0.5) *
    amount
  );
}


/*
 * =========================================================
 * NATURALNESS
 * =========================================================
 *
 * 0   = perfectly uniform
 * 25  = subtle
 * 50  = natural
 * 75  = strong
 * 100 = maximum controlled variation
 * =========================================================
 */

function clampNaturalness(
  value
) {
  const numeric =
    Number(value);

  if (
    !Number.isFinite(
      numeric
    )
  ) {
    return 0.5;
  }

  if (numeric > 1) {
    return (
      Math.max(
        0,
        Math.min(
          100,
          numeric
        )
      ) / 100
    );
  }

  return Math.max(
    0,
    Math.min(
      1,
      numeric
    )
  );
}


/*
 * =========================================================
 * INK VARIATION
 * =========================================================
 */

function getInkVariation(
  documentId,
  styleId,
  seed,
  pageNumber,
  characterIndex,
  inkStyle,
  naturalVariation,
  naturalness
) {
  if (
    !naturalVariation ||
    naturalness <= 0
  ) {
    return {
      opacityMultiplier: 1,
      darknessMultiplier: 1,
      textureStrength: 0,
    };
  }

  const opacityRandom =
    deterministicRandom(
      documentId,
      styleId,
      seed,
      pageNumber,
      characterIndex,
      "opacity"
    );

  const darknessRandom =
    deterministicRandom(
      documentId,
      styleId,
      seed,
      pageNumber,
      characterIndex,
      "darkness"
    );

  const textureRandom =
    deterministicRandom(
      documentId,
      styleId,
      seed,
      pageNumber,
      characterIndex,
      "texture"
    );

  if (
    inkStyle === "pencil"
  ) {
    return {
      opacityMultiplier:
        1 -
        naturalness * 0.12 +
        opacityRandom *
          naturalness *
          0.08,

      darknessMultiplier:
        1 -
        naturalness * 0.15 +
        darknessRandom *
          naturalness *
          0.10,

      textureStrength:
        naturalness *
        (0.02 +
          textureRandom *
            0.08),
    };
  }

  return {
    opacityMultiplier:
      1 -
      naturalness * 0.06 +
      opacityRandom *
        naturalness *
        0.08,

    darknessMultiplier:
      1 -
      naturalness * 0.04 +
      darknessRandom *
        naturalness *
        0.08,

    textureStrength:
      naturalness *
      textureRandom *
      0.08,
  };
}


/*
 * =========================================================
 * COLOR HELPERS
 * =========================================================
 */

function adjustInkColor(
  color,
  darknessMultiplier
) {
  if (
    !color ||
    typeof color !== "string"
  ) {
    return color;
  }

  const normalized =
    color.replace(
      "#",
      ""
    );

  if (
    normalized.length !== 6
  ) {
    return color;
  }

  const red = parseInt(
    normalized.slice(0, 2),
    16
  );

  const green = parseInt(
    normalized.slice(2, 4),
    16
  );

  const blue = parseInt(
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
 * PAPER
 * =========================================================
 */

function drawPaperBackground(
  context,
  paperStyle
) {
  context.save();

  context.fillStyle =
    paperStyle ===
    "notebook"
      ? "#fdfcf8"
      : "#fffef9";

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

  if (
    paperStyle === "graph"
  ) {
    drawGraphPaper(
      context
    );
  }

  drawPaperTexture(
    context,
    paperStyle
  );

  context.restore();
}


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

    context.moveTo(
      45,
      y
    );

    context.lineTo(
      A4_WIDTH - 45,
      y
    );

    context.stroke();
  }

  if (
    paperStyle ===
    "notebook"
  ) {
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
  }

  context.restore();
}


function drawGraphPaper(
  context
) {
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

    context.moveTo(
      x,
      0
    );

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

    context.moveTo(
      0,
      y
    );

    context.lineTo(
      A4_WIDTH,
      y
    );

    context.stroke();
  }

  context.restore();
}


function drawPaperTexture(
  context,
  paperStyle
) {
  if (
    paperStyle !==
      "notebook" &&
    paperStyle !==
      "plain"
  ) {
    return;
  }

  context.save();

  /*
   * Micro grain.
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
        ) *
        43758.5453;

      const normalized =
        value -
        Math.floor(
          value
        );

      if (
        normalized > 0.68
      ) {
        context.fillStyle =
          `rgba(70,65,55,${
            0.008 +
            normalized *
              0.010
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
   * Paper fibers.
   */

  for (
    let index = 0;
    index < 180;
    index += 1
  ) {
    const seed =
      Math.sin(
        index * 91.731
      ) *
      43758.5453;

    const normalized =
      seed -
      Math.floor(seed);

    const x =
      normalized *
      A4_WIDTH;

    const secondSeed =
      Math.sin(
        index * 47.173
      ) *
      43758.5453;

    const secondNormalized =
      secondSeed -
      Math.floor(
        secondSeed
      );

    const y =
      secondNormalized *
      A4_HEIGHT;

    const length =
      8 +
      normalized * 20;

    const angle =
      (secondNormalized -
        0.5) *
      0.35;

    context.save();

    context.translate(
      x,
      y
    );

    context.rotate(
      angle
    );

    context.strokeStyle =
      "rgba(120,110,95,0.018)";

    context.lineWidth =
      0.45;

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
   * Paper tonality.
   */

  const gradient =
    context.createLinearGradient(
      0,
      0,
      A4_WIDTH,
      A4_HEIGHT
    );

  gradient.addColorStop(
    0,
    "rgba(255,252,244,0.018)"
  );

  gradient.addColorStop(
    0.5,
    "rgba(255,255,255,0)"
  );

  gradient.addColorStop(
    1,
    "rgba(245,240,228,0.018)"
  );

  context.fillStyle =
    gradient;

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
 * TEXT MEASUREMENT
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
    const character of String(
      text ?? ""
    )
  ) {
    width +=
      context.measureText(
        character
      ).width;

    if (
      character === " "
    ) {
      width +=
        wordSpacing;
    } else {
      width +=
        letterSpacing;
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
  const value = String(
    text ?? ""
  );

  if (!value) {
    return [""];
  }

  context.font =
    `${fontSize}px "${fontFamily}"`;

  const getWidth = (
    line,
    currentWordSpacing =
      wordSpacing
  ) =>
    measureTextWithSpacing(
      context,
      line,
      letterSpacing,
      currentWordSpacing
    );

  const lines = [];

  const words =
    value.split(/\s+/);

  let currentLine = "";

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
      getWidth(
        candidate
      ) <= maxWidth
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
     */

    if (
      getWidth(
        word,
        0
      ) <= maxWidth
    ) {
      currentLine =
        word;

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
        if (
          partialWord
        ) {
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
 * TEXT EXTRACTION
 * =========================================================
 */

function extractInlineText(
  content
) {
  if (
    !Array.isArray(content)
  ) {
    return "";
  }

  return content
    .map((node) => {
      if (!node) {
        return "";
      }

      if (
        typeof node.text ===
        "string"
      ) {
        return node.text;
      }

      if (
        Array.isArray(
          node.content
        )
      ) {
        return extractInlineText(
          node.content
        );
      }

      return "";
    })
    .join("");
}


function getBlockText(
  block
) {
  if (!block) {
    return "";
  }

  if (
    typeof block.text ===
    "string"
  ) {
    return block.text;
  }

  if (
    typeof block.content ===
    "string"
  ) {
    return block.content;
  }

  if (
    Array.isArray(
      block.content
    )
  ) {
    return extractInlineText(
      block.content
    );
  }

  return "";
}


function getListItemText(
  item
) {
  if (!item) {
    return "";
  }

  if (
    typeof item.text ===
    "string"
  ) {
    return item.text;
  }

  if (
    Array.isArray(
      item.content
    )
  ) {
    return extractInlineText(
      item.content
    );
  }

  return "";
}


function getCellText(
  cell
) {
  if (!cell) {
    return "";
  }

  if (
    typeof cell.text ===
    "string"
  ) {
    return cell.text;
  }

  if (
    Array.isArray(
      cell.content
    )
  ) {
    return extractInlineText(
      cell.content
    );
  }

  return "";
}


/*
 * =========================================================
 * DRAW TEXT
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
    naturalness = 0.5,
    startIndex = 0,
    baseFontSize = 22,
    fontFamily,
    inkVariations = [],
    documentId =
      "inkai-preview-document",
    styleId = "default",
    seed = 12345,
    pageNumber = 1,
    inkStyle = "blue",
  } = {}
) {
  let currentX = x;

  const effectiveNaturalness =
    clampNaturalness(
      naturalness
    );

  for (
    let index = 0;
    index < text.length;
    index += 1
  ) {
    const character =
      text[index];

    const characterIndex =
      startIndex + index;

    /*
     * Spaces.
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

    if (
      naturalVariation &&
      effectiveNaturalness > 0
    ) {
      rotation =
        deterministicVariation(
          documentId,
          styleId,
          seed,
          pageNumber,
          characterIndex,
          "rotation",
          0.5 +
            effectiveNaturalness *
              2.5
        );

      sizeMultiplier =
        1 +
        deterministicVariation(
          documentId,
          styleId,
          seed,
          pageNumber,
          characterIndex,
          "scale",
          0.008 +
            effectiveNaturalness *
              0.045
        );

      verticalOffset =
        deterministicVariation(
          documentId,
          styleId,
          seed,
          pageNumber,
          characterIndex,
          "baseline",
          0.5 +
            effectiveNaturalness *
              4
        );

      horizontalOffset =
        deterministicVariation(
          documentId,
          styleId,
          seed,
          pageNumber,
          characterIndex,
          "offset",
          0.15 +
            effectiveNaturalness *
              1.2
        );

      spacingVariation =
        deterministicVariation(
          documentId,
          styleId,
          seed,
          pageNumber,
          characterIndex,
          "spacing",
          0.15 +
            effectiveNaturalness *
              1.2
        );
    }

    const characterSize =
      baseFontSize *
      sizeMultiplier;

    const baseInkColor =
      context.__inkaiBaseInkColor ||
      "#19426F";

    const inkVariation =
      getInkVariation(
        documentId,
        styleId,
        seed,
        pageNumber,
        characterIndex,
        inkStyle,
        naturalVariation,
        effectiveNaturalness
      );

    let characterInk =
      baseInkColor;

    if (
      naturalVariation &&
      inkVariations.length > 0
    ) {
      const variationRandom =
        deterministicRandom(
          documentId,
          styleId,
          seed,
          pageNumber,
          characterIndex,
          "ink-color"
        );

      const variationIndex =
        Math.floor(
          variationRandom *
            inkVariations.length
        );

      characterInk =
        inkVariations[
          Math.min(
            variationIndex,
            inkVariations.length -
              1
          )
        ];
    }

    characterInk =
      adjustInkColor(
        characterInk,
        inkVariation.darknessMultiplier
      );

    const baseOpacity =
      context.__inkaiBaseOpacity ??
      1;

    const characterOpacity =
      Math.max(
        0,
        Math.min(
          1,
          baseOpacity *
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

    context.textBaseline =
      "top";

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
     * Pencil / ink texture.
     */

    if (
      inkVariation.textureStrength >
      0
    ) {
      context.globalAlpha =
        characterOpacity *
        inkVariation.textureStrength *
        0.12;

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
     * Advance using actual glyph width.
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
  /*
   * Structured TipTap document.
   */

  document:
    handwritingDocument = null,

  /*
   * Backwards-compatible plain text.
   */

  text = "",

  /*
   * Stable document identifier.
   */

  documentId =
    "inkai-preview-document",

  /*
   * Resolved handwriting font.
   */

  style,

  /*
   * Style/preset identifier.
   */

  handwritingStyle =
    "school_notebook",

  /*
   * Basic appearance.
   */

  fontSize = 22,

  inkColor,

  paperStyle = "plain",

  inkStyle = "blue",

  /*
   * Handwriting controls.
   */

  letterSpacing = 0,

  lineSpacing = 1.5,

  wordSpacing = 4,

  inkOpacity = 0.9,

  naturalVariation = true,

  /*
   * Naturalness accepts 0–1 or 0–100.
   */

  naturalness = 0.5,

  /*
   * Deterministic random seed.
   */

  seed = 12345,

  /*
   * Assignment mode.
   */

  assignmentMode = false,

  assignmentDetails = {},

  /*
   * =========================================================
   * CONTROLLED PAGE SELECTION
   * =========================================================
   *
   * selectedPage belongs to the parent.
   *
   * This component does NOT create a second selected-page
   * state.
   */

  selectedPage = 0,

  /*
   * Generated pages are sent to the parent.
   */

  onPagesChange,

  /*
   * Page selection is sent to the parent.
   */

  onPageSelect,
}) {
  /*
   * Zoom is local because zoom is purely a visual
   * canvas-preview setting.
   */

  const [zoom, setZoom] =
    useState(0.8);

  /*
   * This state contains generated page data only.
   *
   * It is NOT the selected page state.
   */

  const [pages, setPages] =
    useState([]);

  const margins =
    DEFAULT_MARGIN;

  const normalizedNaturalness =
    clampNaturalness(
      naturalness
    );

  const normalizedSeed =
    Number.isFinite(
      Number(seed)
    )
      ? Number(seed)
      : 12345;

  /*
   * =========================================================
   * NORMALIZED DOCUMENT
   * =========================================================
   */

  const normalizedDocument =
    useMemo(() => {
      if (
        handwritingDocument &&
        Array.isArray(
          handwritingDocument.blocks
        )
      ) {
        return handwritingDocument;
      }

      return {
        documentId,
        title:
          "Untitled Document",

        blocks: [
          {
            type: "paragraph",
            text: text || "",
          },
        ],
      };
    }, [
      handwritingDocument,
      documentId,
      text,
    ]);


  /*
   * =========================================================
   * PAGE GENERATION
   * =========================================================
   */

  useEffect(() => {
    if (!style) {
      setPages([]);

      if (
        typeof onPagesChange ===
        "function"
      ) {
        onPagesChange([]);
      }

      return undefined;
    }

    const fonts =
      Array.isArray(style.fonts)
        ? style.fonts
        : [];

    if (!fonts.length) {
      setPages([]);

      if (
        typeof onPagesChange ===
        "function"
      ) {
        onPagesChange([]);
      }

      return undefined;
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


    /*
     * =======================================================
     * PREPARE FONT
     * =======================================================
     */

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
          "InkAI: failed to load handwriting font",
          error
        );

        /*
         * Fallback rendering is still attempted.
         */

        if (!cancelled) {
          createPages(
            fontFamily
          );
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
      const pageCanvases =
        [];

      const size =
        Number(fontSize) ||
        Number(
          style.default_size
        ) ||
        22;


      /*
       * Measurement canvas.
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

      if (
        !measurementContext
      ) {
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

      let pageHasContent =
        false;


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

      function finishCurrentPage() {
        if (
          pageHasContent ||
          pageCanvases.length ===
            0
        ) {
          pageCanvases.push(
            currentPage
          );
        }
      }


      function startNewPage() {
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

        pageHasContent =
          false;

        setupPage(
          pageContext,
          loadedFontFamily,
          size
        );

        return true;
      }


      function ensureSpace(
        requiredHeight
      ) {
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
      }


      /*
       * =====================================================
       * TEXT BLOCK
       * =====================================================
       */

      function renderTextBlock(
        block
      ) {
        const isHeading =
          block.type ===
          "heading";

        const level =
          Number(
            block.level ||
              block.attrs?.level
          ) || 1;

        const headingScale = {
          1: 1.55,
          2: 1.35,
          3: 1.2,
          4: 1.1,
          5: 1.05,
          6: 1,
        };

        const blockFontSize =
          isHeading
            ? size *
              (
                headingScale[
                  level
                ] || 1.2
              )
            : Number(
                block.fontSize ||
                  block.attrs
                    ?.fontSize ||
                  size
              );

        const blockLineSpacing =
          isHeading
            ? Number(
                block.lineSpacing ||
                  block.attrs
                    ?.lineSpacing ||
                  1.25
              )
            : Number(
                block.lineSpacing ||
                  block.attrs
                    ?.lineSpacing ||
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

        if (!blockText) {
          if (
            !ensureSpace(
              blockLineHeight
            )
          ) {
            return;
          }

          y +=
            blockLineHeight +
            Number(
              block.paragraphSpacing ||
                0
            );

          pageHasContent =
            true;

          return;
        }


        measurementContext.font =
          `${blockFontSize}px "${loadedFontFamily}"`;

        const blockIndent =
          Number(
            block.leftIndent ||
              block.attrs
                ?.leftIndent ||
              0
          );

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
              naturalness:
                normalizedNaturalness,
              startIndex:
                characterIndex,
              baseFontSize:
                blockFontSize,
              fontFamily:
                loadedFontFamily,
              inkVariations:
                ink.variations,
              documentId,
              styleId:
                handwritingStyle,
              seed:
                normalizedSeed,
              pageNumber,
              inkStyle,
            }
          );

          characterIndex +=
            line.length + 1;

          y +=
            blockLineHeight;

          pageHasContent =
            true;
        }

        y +=
          Number(
            block.paragraphSpacing ||
              block.attrs
                ?.paragraphSpacing ||
              (
                isHeading
                  ? 12
                  : 6
              )
          );
      }


      /*
       * =====================================================
       * LIST
       * =====================================================
       */

      function renderListBlock(
        block
      ) {
        const isOrdered =
          block.type ===
          "orderedList";

        const items =
          Array.isArray(
            block.items
          )
            ? block.items
            : Array.isArray(
                block.content
              )
              ? block.content
              : [];

        const listIndent =
          Number(
            block.indent ||
              block.attrs?.indent ||
              28
          );

        const listFontSize =
          Number(
            block.fontSize ||
              block.attrs
                ?.fontSize ||
              size
          );

        const listLineHeight =
          listFontSize *
          Number(
            block.lineSpacing ||
              block.attrs
                ?.lineSpacing ||
              lineSpacing
          );

        const startNumber =
          Number(
            block.start ||
              block.attrs?.start ||
              1
          );


        items.forEach(
          (
            item,
            index
          ) => {
            const itemText =
              getListItemText(
                item
              );

            const marker =
              isOrdered
                ? `${startNumber + index}.`
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
                    naturalness:
                      normalizedNaturalness,
                    startIndex:
                      characterIndex,
                    baseFontSize:
                      listFontSize,
                    fontFamily:
                      loadedFontFamily,
                    inkVariations:
                      ink.variations,
                    documentId,
                    styleId:
                      handwritingStyle,
                    seed:
                      normalizedSeed,
                    pageNumber,
                    inkStyle,
                  }
                );

                characterIndex +=
                  line.length + 1;

                y +=
                  listLineHeight;

                pageHasContent =
                  true;
              }
            );

            y +=
              Number(
                block.paragraphSpacing ||
                  4
              );
          }
        );

        y += 4;
      }


      /*
       * =====================================================
       * TABLE
       * =====================================================
       */

      function renderTableBlock(
        block
      ) {
        const rows =
          Array.isArray(
            block.rows
          )
            ? block.rows
            : Array.isArray(
                block.content
              )
              ? block.content
              : [];

        if (!rows.length) {
          return;
        }

        const cellPadding =
          Number(
            block.cellPadding ||
              8
          );

        const tableFontSize =
          Number(
            block.fontSize ||
              block.attrs
                ?.fontSize ||
              size
          );

        const tableLineHeight =
          tableFontSize * 1.35;

        const columnCount =
          rows.reduce(
            (
              maximum,
              row
            ) =>
              Math.max(
                maximum,
                (
                  row?.cells ||
                  row?.content ||
                  []
                ).length
              ),
            0
          );

        if (!columnCount) {
          return;
        }


        /*
         * Calculate column widths.
         */

        const columnWidths =
          new Array(
            columnCount
          ).fill(0);

        rows.forEach(
          (row) => {
            const cells =
              row?.cells ||
              row?.content ||
              [];

            cells.forEach(
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
                      cellPadding *
                        2,
                    70
                  );
              }
            );
          }
        );


        /*
         * Fit table into page.
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

        if (
          totalWidth >
          availableWidth
        ) {
          const scale =
            availableWidth /
            totalWidth;

          for (
            let index = 0;
            index <
            columnWidths.length;
            index += 1
          ) {
            columnWidths[
              index
            ] *= scale;
          }
        }


        /*
         * Render rows.
         */

        rows.forEach(
          (row) => {
            const cells =
              row?.cells ||
              row?.content ||
              [];

            measurementContext.font =
              `${tableFontSize}px "${loadedFontFamily}"`;

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
                        ] || 80
                      ) -
                        cellPadding *
                          2
                    );

                  return {
                    cell,

                    lines:
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
                      ),
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

            const rowHeight =
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

                const cellType =
                  item.cell?.type;

                const isHeader =
                  cellType ===
                    "tableHeader" ||
                  item.cell?.header ===
                    true;


                /*
                 * Header background.
                 */

                if (isHeader) {
                  pageContext.save();

                  pageContext.fillStyle =
                    "rgba(235,235,235,0.35)";

                  pageContext.fillRect(
                    currentX,
                    y,
                    cellWidth,
                    rowHeight
                  );

                  pageContext.restore();
                }


                /*
                 * Border.
                 */

                pageContext.save();

                pageContext.strokeStyle =
                  "rgba(80,80,80,0.45)";

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
                 * Cell text.
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
                        naturalness:
                          normalizedNaturalness,
                        startIndex:
                          characterIndex,
                        baseFontSize:
                          tableFontSize,
                        fontFamily:
                          loadedFontFamily,
                        inkVariations:
                          ink.variations,
                        documentId,
                        styleId:
                          handwritingStyle,
                        seed:
                          normalizedSeed,
                        pageNumber,
                        inkStyle,
                      }
                    );

                    characterIndex +=
                      cellLine.length +
                      1;

                    pageHasContent =
                      true;
                  }
                );

                currentX +=
                  cellWidth;
              }
            );

            y += rowHeight;
          }
        );

        y += 12;
      }


      /*
       * =====================================================
       * IMAGE
       * =====================================================
       *
       * Preview reserves space and displays a clean
       * placeholder.
       */

      function renderImageBlock(
        block
      ) {
        const imageHeight =
          Math.min(
            240,
            Number(
              block.height ||
                block.attrs
                  ?.height ||
                180
            )
          );

        if (
          !ensureSpace(
            imageHeight
          )
        ) {
          return;
        }

        const imageWidth =
          Math.min(
            availableWidth,
            Number(
              block.width ||
                block.attrs
                  ?.width ||
                availableWidth
            )
          );

        pageContext.save();

        pageContext.strokeStyle =
          "rgba(120,120,120,0.35)";

        pageContext.setLineDash([
          5,
          4,
        ]);

        pageContext.strokeRect(
          margins.left,
          y,
          imageWidth,
          imageHeight
        );

        pageContext.setLineDash(
          []
        );

        pageContext.font =
          `14px "${loadedFontFamily}"`;

        pageContext.fillStyle =
          "rgba(90,90,90,0.7)";

        pageContext.textBaseline =
          "top";

        pageContext.fillText(
          block.alt ||
            block.attrs?.alt ||
            "Image",
          margins.left + 12,
          y + 12
        );

        pageContext.restore();

        y +=
          imageHeight + 12;

        pageHasContent =
          true;
      }


      /*
       * =====================================================
       * ASSIGNMENT HEADER
       * =====================================================
       */

      function renderAssignmentHeader() {
        if (!assignmentMode) {
          return;
        }

        const details =
          assignmentDetails ||
          {};

        const title =
          details.assignmentTitle ||
          details.title ||
          "Assignment";

        const headerHeight =
          145;

        if (
          !ensureSpace(
            headerHeight
          )
        ) {
          return;
        }


        /*
         * Assignment title.
         */

        pageContext.save();

        pageContext.textAlign =
          "center";

        pageContext.textBaseline =
          "top";

        pageContext.font =
          `bold ${Math.round(
            size * 1.35
          )}px "${loadedFontFamily}"`;

        pageContext.fillStyle =
          inkColor ||
          getInkConfiguration(
            inkStyle
          ).base;

        pageContext.fillText(
          title,
          A4_WIDTH / 2,
          y
        );

        pageContext.restore();

        y +=
          size * 1.8;


        /*
         * Details.
         */

        const detailRows = [
          [
            "Student Name",
            details.studentName,
          ],
          [
            "Roll Number",
            details.rollNumber,
          ],
          [
            "Subject",
            details.subject,
          ],
          [
            "Class",
            details.className ||
              details.class,
          ],
          [
            "Teacher",
            details.teacher,
          ],
        ];

        const visibleRows =
          detailRows.filter(
            ([, value]) =>
              value !==
                undefined &&
              value !== null &&
              String(
                value
              ).trim()
          );

        pageContext.save();

        pageContext.textAlign =
          "left";

        pageContext.textBaseline =
          "top";

        visibleRows.forEach(
          (
            [label, value]
          ) => {
            pageContext.font =
              `${Math.round(
                size * 0.72
              )}px "${loadedFontFamily}"`;

            pageContext.fillStyle =
              inkColor ||
              getInkConfiguration(
                inkStyle
              ).base;

            pageContext.fillText(
              `${label}: ${value}`,
              margins.left,
              y
            );

            y +=
              size * 0.95;
          }
        );

        pageContext.restore();

        y += 15;

        pageHasContent =
          true;
      }


      /*
       * =====================================================
       * STRUCTURED DOCUMENT
       * =====================================================
       */

      const blocks =
        Array.isArray(
          normalizedDocument.blocks
        )
          ? normalizedDocument.blocks
          : [];


      /*
       * Assignment header comes first.
       */

      renderAssignmentHeader();


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
          if (
            pageHasContent
          ) {
            finishCurrentPage();

            if (
              !startNewPage()
            ) {
              break;
            }
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
         * HARD BREAK
         * ---------------------------------------------------
         */

        if (
          block.type ===
          "hardBreak"
        ) {
          if (
            ensureSpace(
              size *
                lineSpacing
            )
          ) {
            y +=
              size *
              lineSpacing;

            pageHasContent =
              true;
          }

          continue;
        }


        /*
         * ---------------------------------------------------
         * UNKNOWN BLOCK
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
        pageHasContent ||
        pageCanvases.length ===
          0
      ) {
        pageCanvases.push(
          currentPage
        );
      }

      if (cancelled) {
        return;
      }


      /*
       * =====================================================
       * SERIALIZE PAGES
       * =====================================================
       *
       * Internal page objects contain the canvas.
       *
       * Parent receives only:
       *
       * {
       *   pageNumber,
       *   dataUrl
       * }
       */

      const renderedPages =
        pageCanvases.map(
          (
            canvas,
            index
          ) => ({
            pageNumber:
              index + 1,

            canvas,

            dataUrl:
              canvas.toDataURL(
                "image/png"
              ),
          })
        );


      /*
       * =====================================================
       * UPDATE INTERNAL GENERATED PAGES
       * =====================================================
       */

      setPages(
        renderedPages
      );


      /*
       * =====================================================
       * SEND PAGES TO PARENT
       * =====================================================
       */

      if (
        typeof onPagesChange ===
        "function"
      ) {
        onPagesChange(
          renderedPages.map(
            (page) => ({
              pageNumber:
                page.pageNumber,

              dataUrl:
                page.dataUrl,
            })
          )
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

      context.__inkaiBaseOpacity =
        inkOpacity;

      context.font =
        `${size}px "${loadedFontFamily}"`;

      context.globalAlpha =
        inkOpacity;

      context.textBaseline =
        "top";

      context.textAlign =
        "left";
    }


    /*
     * Start rendering.
     */

    prepareFont();


    return () => {
      cancelled = true;
    };

  }, [
    normalizedDocument,
    documentId,
    style,
    handwritingStyle,
    fontSize,
    inkColor,
    paperStyle,
    inkStyle,
    letterSpacing,
    lineSpacing,
    wordSpacing,
    inkOpacity,
    naturalVariation,
    normalizedNaturalness,
    normalizedSeed,
    assignmentMode,
    assignmentDetails,
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
              current +
              0.1
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
              current -
              0.1
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
   * CONTROLLED PAGE DISPLAY
   * =========================================================
   *
   * The parent owns selectedPage.
   *
   * Canvas only derives which generated page should be
   * displayed.
   */

  const safeSelectedPage =
    Math.max(
      0,
      Math.min(
        Number(selectedPage) ||
          0,
        Math.max(
          pages.length - 1,
          0
        )
      )
    );

  const currentPage =
    pages[
      safeSelectedPage
    ];


  /*
   * =========================================================
   * UI
   * =========================================================
   *
   * IMPORTANT:
   *
   * There is deliberately NO:
   *
   * - Previous page button
   * - Next page button
   * - Page counter
   * - Thumbnail strip
   *
   * Those responsibilities now belong exclusively to
   * PageNavigator.jsx.
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
          <p
            className="
              text-sm
              font-semibold
              text-gray-900
              dark:text-white
            "
          >
            Handwriting Preview
          </p>

          <p
            className="
              text-xs
              text-gray-500
              dark:text-gray-400
            "
          >
            Canvas preview
          </p>
        </div>


        {/* Zoom controls only */}

        <div
          className="
            flex
            items-center
            gap-1
          "
        >

          {/* Zoom out */}

          <button
            type="button"
            onClick={
              zoomOut
            }
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
            aria-label="Zoom out"
          >
            <ZoomOut
              size={18}
            />
          </button>


          {/* Zoom percentage */}

          <button
            type="button"
            onClick={
              resetZoom
            }
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


          {/* Zoom in */}

          <button
            type="button"
            onClick={
              zoomIn
            }
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
            aria-label="Zoom in"
          >
            <ZoomIn
              size={18}
            />
          </button>


          {/* Reset zoom */}

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
            onClick={
              resetZoom
            }
            className="
              rounded-lg
              p-2
              text-gray-600
              hover:bg-gray-100
              dark:text-gray-300
              dark:hover:bg-gray-800
            "
            title="Reset zoom"
            aria-label="Reset zoom"
          >
            <RotateCcw
              size={17}
            />
          </button>

        </div>
      </div>


      {/* ===================================================
          MAIN PAGE
          =================================================== */}

      <div
        className="
          flex-1
          overflow-auto
          p-6
        "
      >

        <div
          className="
            flex
            min-w-max
            justify-center
          "
        >

          {currentPage ? (
            <div
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

              {/* =================================================
                  RENDERED HANDWRITING PAGE
                  ================================================= */}

              <img
                src={
                  currentPage.dataUrl
                }
                alt={`Handwriting page ${
                  safeSelectedPage + 1
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


              {/* =================================================
                  MARGIN GUIDE
                  ================================================= */}

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


              {/* =================================================
                  PAGE LABEL
                  =================================================
                  
                  This is only a small visual label under the
                  displayed canvas. It is NOT navigation.
                  ================================================= */}

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
                {safeSelectedPage + 1}
              </div>

            </div>
          ) : (

            <div
              className="
                flex
                min-h-[500px]
                items-center
                justify-center
                text-sm
                text-gray-500
                dark:text-gray-400
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