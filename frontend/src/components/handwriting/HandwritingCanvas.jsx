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

const A4_WIDTH = 794;
const A4_HEIGHT = 1123;

const DEFAULT_MARGIN = {
  top: 80,
  right: 70,
  bottom: 70,
  left: 70,
};

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
    base: "#5C5C5C",
    variations: [
      "#555555",
      "#5C5C5C",
      "#636363",
      "#696969",
    ],
  },
};

function getInkConfiguration(inkStyle) {
  return (
    INK_STYLES[inkStyle] ||
    INK_STYLES.blue
  );
}

function drawPaperBackground(
  context,
  paperStyle
) {
  // Base paper
  context.fillStyle = "#ffffff";

  context.fillRect(
    0,
    0,
    A4_WIDTH,
    A4_HEIGHT
  );

  if (paperStyle === "plain") {
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

    context.moveTo(45, y);

    context.lineTo(
      A4_WIDTH - 45,
      y
    );

    context.stroke();
  }

  // Notebook left margin
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

function drawPaperTexture(context) {
  /*
   * Very subtle deterministic paper texture.
   * This intentionally remains light so it does not
   * interfere with handwritten text.
   */

  context.save();

  for (
    let y = 0;
    y < A4_HEIGHT;
    y += 8
  ) {
    for (
      let x = 0;
      x < A4_WIDTH;
      x += 8
    ) {
      const value =
        Math.sin(
          x * 12.9898 +
          y * 78.233
        ) * 43758.5453;

      const fractional =
        value - Math.floor(value);

      if (fractional > 0.72) {
        context.fillStyle =
          "rgba(80, 80, 80, 0.025)";

        context.fillRect(
          x,
          y,
          1,
          1
        );
      }
    }
  }

  context.restore();
}

function HandwritingCanvas({
  text = "",
  style,
  fontSize,
  inkColor,
  paperStyle = "plain",
  inkStyle = "blue",
}) {
  const [zoom, setZoom] =
    useState(0.8);

  const [pages, setPages] =
    useState([]);

  const margins =
    DEFAULT_MARGIN;

  useEffect(() => {
    if (!style) {
      return;
    }

    const fonts =
      style.fonts || [];

    if (!fonts.length) {
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
      }
    }

    function createPages(
      fontFamily
    ) {
      const pageCanvases = [];

      const size =
        fontSize ||
        style.default_size ||
        22;

      const lineHeight =
        size *
        (style.line_spacing || 1.5);

      const availableWidth =
        A4_WIDTH -
        margins.left -
        margins.right;

      const availableHeight =
        A4_HEIGHT -
        margins.top -
        margins.bottom;

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

      measurementContext.font =
        `${size}px "${fontFamily}"`;

      const lines = [];

      const paragraphs =
        String(text).split("\n");

      paragraphs.forEach(
        (paragraph) => {
          if (!paragraph.trim()) {
            lines.push("");
            return;
          }

          const words =
            paragraph.split(/\s+/);

          let currentLine = "";

          words.forEach(
            (word) => {
              const testLine =
                currentLine
                  ? `${currentLine} ${word}`
                  : word;

              const measuredWidth =
                measurementContext.measureText(
                  testLine
                ).width;

              if (
                measuredWidth >
                  availableWidth &&
                currentLine
              ) {
                lines.push(
                  currentLine
                );

                currentLine = word;
              } else {
                currentLine =
                  testLine;
              }
            }
          );

          if (currentLine) {
            lines.push(
              currentLine
            );
          }
        }
      );

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

      setupPage(
        pageContext,
        fontFamily,
        size
      );

      let y =
        margins.top;

      lines.forEach(
        (line) => {
          if (
            y + lineHeight >
            A4_HEIGHT -
              margins.bottom
          ) {
            pageCanvases.push(
              currentPage
            );

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
              return;
            }

            setupPage(
              pageContext,
              fontFamily,
              size
            );

            y =
              margins.top;
          }

          if (line) {
            pageContext.fillText(
              line,
              margins.left,
              y
            );
          }

          y += lineHeight;
        }
      );

      pageCanvases.push(
        currentPage
      );

      if (!cancelled) {
        setPages(
          pageCanvases
        );
      }
    }

    function setupPage(
      context,
      fontFamily,
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

      context.font =
        `${size}px "${fontFamily}"`;

      context.fillStyle =
        inkColor || ink.base;

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
    style,
    fontSize,
    inkColor,
    paperStyle,
    inkStyle,
  ]);

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

  return (
    <div className="flex h-full min-h-[700px] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-gray-950">

      {/* Preview toolbar */}
      <div className="flex shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900">

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
            className="rounded-lg p-2 text-gray-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 dark:text-gray-300 dark:hover:bg-gray-800"
            title="Zoom out"
          >
            <ZoomOut size={18} />
          </button>

          <button
            type="button"
            onClick={resetZoom}
            className="min-w-[64px] rounded-lg px-2 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
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
            className="rounded-lg p-2 text-gray-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 dark:text-gray-300 dark:hover:bg-gray-800"
            title="Zoom in"
          >
            <ZoomIn size={18} />
          </button>

          <div className="mx-1 h-5 w-px bg-gray-200 dark:bg-gray-700" />

          <button
            type="button"
            onClick={resetZoom}
            className="rounded-lg p-2 text-gray-600 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
            title="Reset zoom"
          >
            <RotateCcw size={17} />
          </button>

        </div>
      </div>

      {/* Scrollable A4 pages */}
      <div className="flex-1 overflow-auto p-6">

        <div className="flex min-w-max flex-col items-center gap-8">

          {pages.map(
            (page, index) => (
              <div
                key={index}
                className="relative shrink-0"
                style={{
                  width: `${
                    A4_WIDTH *
                    zoom
                  }px`,
                  height: `${
                    A4_HEIGHT *
                    zoom
                  }px`,
                }}
              >

                <img
                  src={page.toDataURL(
                    "image/png"
                  )}
                  alt={`Handwriting page ${
                    index + 1
                  }`}
                  className="absolute left-0 top-0 block origin-top-left bg-white shadow-xl"
                  style={{
                    width: `${A4_WIDTH}px`,
                    height: `${A4_HEIGHT}px`,
                    transform: `scale(${zoom})`,
                  }}
                />

                {/* Margin guide */}
                <div
                  className="pointer-events-none absolute left-0 top-0"
                  style={{
                    width: `${A4_WIDTH}px`,
                    height: `${A4_HEIGHT}px`,
                    transform: `scale(${zoom})`,
                    transformOrigin:
                      "top left",
                  }}
                >
                  <div
                    className="absolute border border-dashed border-gray-300"
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

                {/* Page number */}
                <div
                  className="absolute left-1/2 -translate-x-1/2 text-[10px] text-gray-400"
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
            <div className="flex min-h-[500px] items-center justify-center text-sm text-gray-500">
              Preparing handwriting preview...
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default HandwritingCanvas;