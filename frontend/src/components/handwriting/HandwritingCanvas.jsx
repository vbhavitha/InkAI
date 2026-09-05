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

function HandwritingCanvas({
  text = "",
  style,
  fontSize,
  inkColor = "#202020",
}) {
  const [zoom, setZoom] = useState(0.8);

  const [pages, setPages] = useState([]);

  const margins = DEFAULT_MARGIN;

  useEffect(() => {
    if (!style) {
      return;
    }

    const fonts = style.fonts || [];

    if (!fonts.length) {
      return;
    }

    const selectedFontPath = fonts[0];
    const fontFamily = getStyleFontFamily(style.id);
    const fontUrl = getFontUrl(selectedFontPath);

    const fontFace = new FontFace(
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

        document.fonts.add(fontFace);

        createPages(fontFamily);
      } catch (error) {
        console.error(
          "Failed to load handwriting font:",
          error
        );
      }
    }

    function createPages(fontFamily) {
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

      const contextCanvas =
        document.createElement("canvas");

      contextCanvas.width = A4_WIDTH;
      contextCanvas.height = A4_HEIGHT;

      const context =
        contextCanvas.getContext("2d");

      if (!context) {
        return;
      }

      context.font =
        `${size}px "${fontFamily}"`;

      const lines = [];

      const paragraphs =
        String(text).split("\n");

      paragraphs.forEach((paragraph) => {
        if (!paragraph.trim()) {
          lines.push("");
          return;
        }

        const words =
          paragraph.split(/\s+/);

        let currentLine = "";

        words.forEach((word) => {
          const testLine = currentLine
            ? `${currentLine} ${word}`
            : word;

          const measuredWidth =
            context.measureText(
              testLine
            ).width;

          if (
            measuredWidth >
              availableWidth &&
            currentLine
          ) {
            lines.push(currentLine);

            currentLine = word;
          } else {
            currentLine = testLine;
          }
        });

        if (currentLine) {
          lines.push(currentLine);
        }
      });

      let currentPage =
        document.createElement("canvas");

      currentPage.width = A4_WIDTH;
      currentPage.height = A4_HEIGHT;

      let pageContext =
        currentPage.getContext("2d");

      if (!pageContext) {
        return;
      }

      setupPage(
        pageContext,
        fontFamily,
        size
      );

      let y = margins.top;

      lines.forEach((line) => {
        if (
          y + lineHeight >
          margins.top + availableHeight
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

          y = margins.top;
        }

        if (line) {
          pageContext.fillText(
            line,
            margins.left,
            y
          );
        }

        y += lineHeight;
      });

      pageCanvases.push(currentPage);

      if (!cancelled) {
        setPages(pageCanvases);
      }
    }

    function setupPage(
      context,
      fontFamily,
      size
    ) {
      // White A4 paper
      context.fillStyle = "#ffffff";

      context.fillRect(
        0,
        0,
        A4_WIDTH,
        A4_HEIGHT
      );

      // Handwriting
      context.font =
        `${size}px "${fontFamily}"`;

      context.fillStyle = inkColor;

      context.textBaseline = "top";

      context.textAlign = "left";
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
  ]);

  const zoomIn = () => {
    setZoom((current) =>
      Math.min(
        1.5,
        Number(
          (current + 0.1).toFixed(2)
        )
      )
    );
  };

  const zoomOut = () => {
    setZoom((current) =>
      Math.max(
        0.5,
        Number(
          (current - 0.1).toFixed(2)
        )
      )
    );
  };

  const resetZoom = () => {
    setZoom(0.8);
  };

  return (
    <div className="flex h-full min-h-[700px] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-gray-950">
      {/* Toolbar */}
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
            {Math.round(zoom * 100)}%
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

      {/* Scrollable page area */}
      <div className="flex-1 overflow-auto p-6">
        <div className="flex min-w-max flex-col items-center gap-8">
          {pages.map((page, index) => (
            <div
              key={index}
              className="relative shrink-0"
              style={{
                width: `${A4_WIDTH * zoom}px`,
                height: `${A4_HEIGHT * zoom}px`,
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
                {/* Page margin guide */}
                <div
                  className="absolute border border-dashed border-gray-300"
                  style={{
                    left: margins.left,
                    top: margins.top,
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

              <div
                className="absolute left-1/2 -translate-x-1/2 text-[10px] text-gray-400"
                style={{
                  bottom: -22,
                }}
              >
                Page {index + 1}
              </div>
            </div>
          ))}

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