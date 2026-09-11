import {
  useEffect,
  useState,
} from "react";

import {
  useSearchParams,
} from "react-router-dom";

import PDFPreview from "../components/pdf/PDFPreview";

import {
  generatePDF,
  getPDFDownloadUrl,
} from "../services/pdfService";


function PDFPreviewPage() {
  const [
    searchParams,
  ] = useSearchParams();

  const documentId =
    searchParams.get(
      "documentId"
    );

  const [pdf, setPdf] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    let cancelled = false;

    async function createPreview() {
      if (!documentId) {
        setError(
          "Document ID is missing."
        );

        setLoading(false);

        return;
      }

      try {
        setLoading(true);
        setError("");

        const result =
          await generatePDF({
            documentId,
            pageSize: "A4",
            margins: "normal",
            orientation: "portrait",
            header: true,
            footer: true,
            pageNumbers: true,
            bookmarks: true,
          });

        if (!cancelled) {
          setPdf(result);
        }
      } catch (generationError) {
        if (!cancelled) {
          setError(
            generationError?.message ||
              "Unable to generate PDF."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    createPreview();

    return () => {
      cancelled = true;
    };
  }, [
    documentId,
  ]);

  const downloadUrl =
    pdf?.filename
      ? getPDFDownloadUrl(
          pdf.filename
        )
      : "";

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-3 text-lg font-semibold">
            Generating PDF...
          </div>

          <p className="text-sm text-gray-500">
            InkAI is rendering the
            high-resolution document.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="max-w-lg rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <h1 className="mb-2 text-lg font-semibold text-red-700">
            PDF Generation Failed
          </h1>

          <p className="text-sm text-red-600">
            {error}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6">
      <div className="mx-auto max-w-7xl">
        {/* ================================================= */}
        {/* HEADER */}
        {/* ================================================= */}

        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              PDF Preview
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              {pdf?.pages || 1} page document
            </p>
          </div>

          {downloadUrl && (
            <a
              href={downloadUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              Download PDF
            </a>
          )}
        </div>

        {/* ================================================= */}
        {/* PREVIEW */}
        {/* ================================================= */}

        <PDFPreview
          filename={
            pdf?.filename
          }
          totalPages={
            pdf?.pages || 1
          }
        />
      </div>
    </div>
  );
}

export default PDFPreviewPage;