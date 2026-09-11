import {
  useMemo,
  useState,
} from "react";

import {
  getPDFPreviewUrl,
} from "../../services/pdfService";


function PDFPreview({
  filename,
  totalPages = 1,
}) {
  const [page, setPage] =
    useState(1);

  const [zoom, setZoom] =
    useState(100);

  const previewUrl =
    useMemo(() => {
      if (!filename) {
        return "";
      }

      return getPDFPreviewUrl(
        filename,
        {
          page,
          zoom,
        }
      );
    }, [
      filename,
      page,
      zoom,
    ]);

  const goPrevious = () => {
    setPage(
      (current) =>
        Math.max(
          1,
          current - 1
        )
    );
  };

  const goNext = () => {
    setPage(
      (current) =>
        Math.min(
          totalPages,
          current + 1
        )
    );
  };

  const zoomOut = () => {
    setZoom(
      (current) =>
        Math.max(
          50,
          current - 10
        )
    );
  };

  const zoomIn = () => {
    setZoom(
      (current) =>
        Math.min(
          200,
          current + 10
        )
    );
  };

  if (!filename) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-gray-500">
          No PDF available for preview.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-[700px] flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      {/* ================================================= */}
      {/* TOOLBAR */}
      {/* ================================================= */}

      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-4 py-3">
        {/* Page controls */}

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={goPrevious}
            disabled={page <= 1}
            className="rounded-lg border px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
          >
            ← Previous
          </button>

          <span className="min-w-[90px] text-center text-sm font-medium">
            Page {page} / {totalPages}
          </span>

          <button
            type="button"
            onClick={goNext}
            disabled={
              page >= totalPages
            }
            className="rounded-lg border px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next →
          </button>
        </div>

        {/* Zoom */}

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={zoomOut}
            disabled={zoom <= 50}
            className="rounded-lg border px-3 py-2 text-sm disabled:opacity-40"
          >
            −
          </button>

          <span className="min-w-[55px] text-center text-sm">
            {zoom}%
          </span>

          <button
            type="button"
            onClick={zoomIn}
            disabled={zoom >= 200}
            className="rounded-lg border px-3 py-2 text-sm disabled:opacity-40"
          >
            +
          </button>
        </div>
      </div>

      {/* ================================================= */}
      {/* PDF VIEWER */}
      {/* ================================================= */}

      <div className="min-h-0 flex-1 bg-gray-100">
        <iframe
          title="InkAI PDF Preview"
          src={previewUrl}
          className="h-full min-h-[620px] w-full border-0"
        />
      </div>
    </div>
  );
}

export default PDFPreview;