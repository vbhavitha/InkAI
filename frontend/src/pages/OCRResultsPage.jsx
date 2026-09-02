import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  Copy,
  Download,
  Edit3,
  FileText,
  Image as ImageIcon,
  Loader2,
  RefreshCw,
  Save,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";

const OCRResultsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [ocrResult, setOcrResult] = useState(
    location.state?.ocrResult || null
  );

  const [imageUrl, setImageUrl] = useState(
    location.state?.imageUrl || null
  );

  const [editableText, setEditableText] = useState(
    location.state?.ocrResult?.full_text || ""
  );

  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    if (location.state?.ocrResult) {
      setOcrResult(location.state.ocrResult);
      setEditableText(location.state.ocrResult.full_text || "");
    }

    if (location.state?.imageUrl) {
      setImageUrl(location.state.imageUrl);
    }
  }, [location.state]);

  /*
   * ----------------------------------------------------
   * Confidence
   * ----------------------------------------------------
   */

  const confidence =
    ocrResult?.overall_confidence != null
      ? Math.round(ocrResult.overall_confidence * 100)
      : 0;

  const confidenceLabel =
    ocrResult?.confidence_label ||
    (confidence >= 90
      ? "Excellent"
      : confidence >= 75
      ? "Good"
      : confidence >= 60
      ? "Needs Review"
      : "Low Confidence");

  /*
   * ----------------------------------------------------
   * Copy Text
   * ----------------------------------------------------
   */

  const handleCopyText = async () => {
    if (!editableText || !editableText.trim()) {
        return;
    }

    try {
        // Modern Clipboard API
        if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(editableText);
        } else {
        // Fallback for environments where Clipboard API
        // is unavailable
        const textArea = document.createElement("textarea");

        textArea.value = editableText;

        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";

        document.body.appendChild(textArea);

        textArea.focus();
        textArea.select();

        const successful = document.execCommand("copy");

        document.body.removeChild(textArea);

        if (!successful) {
            throw new Error("Clipboard copy failed");
        }
        }

        setCopied(true);

        setTimeout(() => {
        setCopied(false);
        }, 2000);
    } catch (error) {
        console.error("Failed to copy OCR text:", error);

        alert(
        "Unable to copy text. Please select the text manually and copy it."
        );
    }
    };

  /*
   * ----------------------------------------------------
   * Download Text
   * ----------------------------------------------------
   */

  const handleDownloadText = () => {
    const blob = new Blob([editableText], {
      type: "text/plain;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;
    link.download = "inkai-ocr-result.txt";

    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  /*
   * ----------------------------------------------------
   * Save
   * ----------------------------------------------------
   */

  const handleSave = async () => {
    if (!editableText || !editableText.trim()) {
        alert("There is no OCR text to save.");
        return;
    }

    try {
        const response = await fetch(
            "http://127.0.0.1:8000/api/ocr/results",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    file_id: location.state?.fileId || null,

                    full_text: editableText,

                    overall_confidence:
                        ocrResult?.overall_confidence ?? null,

                    language:
                        ocrResult?.detected_language || "en",

                    engine_used:
                        "EasyOCR + TrOCR",

                    processing_time:
                        ocrResult?.processing_time ?? null,
                }),
            }
        );

        if (!response.ok) {
            const errorData = await response.json().catch(() => null);

            throw new Error(
                errorData?.detail || "Failed to save OCR result."
            );
        }

        const savedResult = await response.json();

        console.log("OCR result saved:", savedResult);

        setSaved(true);

        setTimeout(() => {
            setSaved(false);
        }, 2000);
    } catch (error) {
        console.error("Save OCR result error:", error);

        alert(
            "Unable to save OCR result. Please try again."
        );
    }
  };

  /*
   * ----------------------------------------------------
   * Retry OCR
   * ----------------------------------------------------
   */

  const handleRetryOCR = async () => {
    if (!imageUrl) {
      alert("Original image is not available.");
      return;
    }

    setRetrying(true);

    try {
      /*
       * Connect your OCR API here.
       *
       * Example:
       *
       * const formData = new FormData();
       * formData.append("file", file);
       *
       * const response = await fetch(
       *   "http://127.0.0.1:8000/api/ocr/process",
       *   {
       *     method: "POST",
       *     body: formData,
       *   }
       * );
       *
       * const result = await response.json();
       *
       * setOcrResult(result);
       * setEditableText(result.full_text || "");
       */

      await new Promise((resolve) => setTimeout(resolve, 1000));

      alert("Retry OCR API connection will be added here.");
    } catch (error) {
      console.error("OCR retry failed:", error);
    } finally {
      setRetrying(false);
    }
  };

  /*
   * ----------------------------------------------------
   * Continue to Editor
   * ----------------------------------------------------
   */

  const handleContinueToEditor = () => {
    navigate("/editor", {
      state: {
        text: editableText,
        ocrResult,
        imageUrl,
      },
    });
  };

  /*
   * ----------------------------------------------------
   * No OCR result
   * ----------------------------------------------------
   */

  if (!ocrResult) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-slate-800 flex items-center justify-center">
            <FileText className="w-8 h-8 text-slate-400" />
          </div>

          <h1 className="text-2xl font-bold mb-3">
            No OCR Result Found
          </h1>

          <p className="text-slate-400 mb-6">
            Upload a handwritten document and run OCR first.
          </p>

          <button
            onClick={() => navigate("/upload")}
            className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 transition font-medium"
          >
            Go to Upload
          </button>
        </div>
      </div>
    );
  }

  /*
   * ----------------------------------------------------
   * Main UI
   * ----------------------------------------------------
   */

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* ================================================
          HEADER
      ================================================= */}

      <header className="border-b border-slate-800 bg-slate-950/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-lg hover:bg-slate-800 transition"
              title="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>

              <span className="text-xl font-bold tracking-tight">
                InkAI
              </span>
            </div>
          </div>

          {/* Confidence */}

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-xs text-slate-400">
                OCR Confidence
              </span>

              <span className="text-sm font-medium">
                {confidenceLabel}
              </span>
            </div>

            <div className="relative w-14 h-14">
              <svg
                className="w-14 h-14 -rotate-90"
                viewBox="0 0 56 56"
              >
                <circle
                  cx="28"
                  cy="28"
                  r="23"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="5"
                  className="text-slate-800"
                />

                <circle
                  cx="28"
                  cy="28"
                  r="23"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="5"
                  strokeLinecap="round"
                  className="text-indigo-500"
                  strokeDasharray={`${2 * Math.PI * 23}`}
                  strokeDashoffset={
                    2 * Math.PI * 23 -
                    (confidence / 100) * (2 * Math.PI * 23)
                  }
                />
              </svg>

              <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">
                {confidence}%
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* ================================================
          MAIN
      ================================================= */}

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Page title */}

        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold">
            OCR Results
          </h1>

          <p className="text-slate-400 mt-1">
            Review and edit the text extracted from your handwriting.
          </p>
        </div>

        {/* ============================================
            TWO COLUMN AREA
        ============================================= */}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ==========================================
              ORIGINAL IMAGE
          =========================================== */}

          <section className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-indigo-400" />

                <h2 className="font-semibold">
                  Original Image
                </h2>
              </div>

              <span className="text-xs text-slate-500">
                Source
              </span>
            </div>

            <div className="p-5 min-h-[500px] flex items-center justify-center bg-slate-950/50">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt="Original handwritten document"
                  className="max-w-full max-h-[600px] object-contain rounded-xl shadow-lg"
                />
              ) : (
                <div className="text-center text-slate-500">
                  <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />

                  <p>
                    Original image unavailable
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* ==========================================
              OCR TEXT
          =========================================== */}

          <section className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-400" />

                <h2 className="font-semibold">
                  Editable Text
                </h2>
              </div>

              <button
                onClick={() => setIsEditing(!isEditing)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition text-sm"
              >
                <Edit3 className="w-4 h-4" />

                {isEditing ? "Done Editing" : "Edit Text"}
              </button>
            </div>

            <div className="p-5">
              {isEditing ? (
                <textarea
                  value={editableText}
                  onChange={(event) =>
                    setEditableText(event.target.value)
                  }
                  className="w-full min-h-[500px] resize-none rounded-xl bg-slate-950 border border-slate-700 p-5 text-slate-200 leading-7 outline-none focus:border-indigo-500 transition"
                  placeholder="OCR text will appear here..."
                />
              ) : (
                <div className="min-h-[500px] rounded-xl bg-slate-950 border border-slate-800 p-5 overflow-auto">
                  {editableText ? (
                    <OCRText
                      text={editableText}
                      words={ocrResult.words || []}
                    />
                  ) : (
                    <p className="text-slate-500">
                      No text was detected.
                    </p>
                  )}
                </div>
              )}
            </div>
          </section>
        </div>

        {/* ============================================
            OCR INFORMATION
        ============================================= */}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          {/* Confidence */}

          <InfoCard
            title="Confidence"
            value={`${confidence}%`}
            description={confidenceLabel}
          />

          {/* Words */}

          <InfoCard
            title="Words Detected"
            value={ocrResult.words?.length || 0}
            description="OCR word regions"
          />

          {/* Language */}

          <InfoCard
            title="Language"
            value={ocrResult.detected_language || "English"}
            description="Detected document language"
          />
        </div>

        {/* ============================================
            LOW CONFIDENCE WARNING
        ============================================= */}

        {ocrResult.words?.some(
          (word) => word.needs_review
        ) && (
          <div className="mt-6 p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 flex gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />

            <div>
              <h3 className="font-medium text-amber-300">
                Some words may need review
              </h3>

              <p className="text-sm text-amber-200/70 mt-1">
                InkAI detected one or more low-confidence
                words. Review the highlighted text before
                continuing.
              </p>
            </div>
          </div>
        )}

        {/* ============================================
            ACTION BAR
        ============================================= */}

        <div className="mt-8 bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="flex flex-col lg:flex-row gap-3 justify-between">
            {/* Left actions */}

            <div className="flex flex-wrap gap-3">
              {/* Copy */}

              <button
                onClick={handleCopyText}
                disabled={!editableText.trim()}
                className="flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 transition text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {copied ? (
                    <Check className="w-4 h-4 text-green-400" />
                ) : (
                    <Copy className="w-4 h-4" />
                )}

                {copied ? "Copied" : "Copy Text"}
                </button>

              {/* Edit */}

              <button
                onClick={() => setIsEditing(!isEditing)}
                className="flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 transition text-sm font-medium"
              >
                <Edit3 className="w-4 h-4" />

                {isEditing ? "Done Editing" : "Edit Text"}
              </button>

              {/* Retry */}

              <button
                onClick={handleRetryOCR}
                disabled={retrying}
                className="flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 transition text-sm font-medium disabled:opacity-50"
              >
                {retrying ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}

                Retry OCR
              </button>

              {/* Download */}

              <button
                onClick={handleDownloadText}
                className="flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 transition text-sm font-medium"
              >
                <Download className="w-4 h-4" />

                Download Text
              </button>

              {/* Save */}

              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 transition text-sm font-medium"
              >
                {saved ? (
                  <Check className="w-4 h-4 text-green-400" />
                ) : (
                  <Save className="w-4 h-4" />
                )}

                {saved ? "Saved" : "Save"}
              </button>
            </div>

            {/* Continue */}

            <button
              onClick={handleContinueToEditor}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 transition font-medium"
            >
              Continue to Editor

              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

/*
 * ======================================================
 * OCR TEXT COMPONENT
 * ======================================================
 *
 * Displays the OCR text while highlighting words that
 * need review.
 */

const OCRText = ({ text, words }) => {
  if (!words || words.length === 0) {
    return (
      <p className="whitespace-pre-wrap text-slate-200 leading-7">
        {text}
      </p>
    );
  }

  const reviewWords = new Set(
    words
      .filter((word) => word.needs_review)
      .map((word) => word.text?.toLowerCase())
  );

  const parts = text.split(/(\s+)/);

  return (
    <p className="whitespace-pre-wrap text-slate-200 leading-7">
      {parts.map((part, index) => {
        const normalized = part
          .trim()
          .toLowerCase()
          .replace(/[.,!?;:"'()[\]{}]/g, "");

        if (
          normalized &&
          reviewWords.has(normalized)
        ) {
          return (
            <span
              key={index}
              className="mx-0.5 px-1 rounded bg-amber-500/20 text-amber-300 border-b border-dashed border-amber-400"
              title="Low confidence — please review"
            >
              {part}
            </span>
          );
        }

        return (
          <React.Fragment key={index}>
            {part}
          </React.Fragment>
        );
      })}
    </p>
  );
};

/*
 * ======================================================
 * INFO CARD
 * ======================================================
 */

const InfoCard = ({
  title,
  value,
  description,
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
      <p className="text-sm text-slate-400">
        {title}
      </p>

      <p className="text-2xl font-bold mt-1">
        {value}
      </p>

      <p className="text-xs text-slate-500 mt-1">
        {description}
      </p>
    </div>
  );
};

export default OCRResultsPage;