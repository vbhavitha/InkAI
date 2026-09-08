import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import AssignmentForm from "../components/assignment/AssignmentForm";
import AssignmentTemplates from "../components/assignment/AssignmentTemplates";
import PaperSelector from "../components/assignment/PaperSelector";
import PageSettings from "../components/assignment/PageSettings";
import AssignmentHeader from "../components/assignment/AssignmentHeader";
import TitleSettings from "../components/assignment/TitleSettings";
import AssignmentFooter from "../components/assignment/AssignmentFooter";
import HandwritingStyleSettings from "../components/assignment/HandwritingStyleSettings";

import {
  getPhase6Document,
  createHandwritingAssignmentPayload,
  paginateAssignment,
  saveAssignmentDraft,
} from "../services/assignmentService";

import {
  getPaperConfig,
  getEffectiveLeftMargin,
} from "../utils/paperLayout";

import {
  paginatePreviewDocument,
} from "../utils/assignmentUtils";

/* ============================================================
   DEFAULT ASSIGNMENT
============================================================ */

const DEFAULT_ASSIGNMENT = {
  /* ----------------------------------------------------------
     Student Information
  ---------------------------------------------------------- */

  studentName: "",
  rollNumber: "",
  className: "",
  section: "",

  /* ----------------------------------------------------------
     Assignment Information
  ---------------------------------------------------------- */

  subject: "",
  title: "",
  teacherName: "",
  date: new Date().toISOString().split("T")[0],

  /* ----------------------------------------------------------
     Template
  ---------------------------------------------------------- */

  template: "college-assignment",

  /* ----------------------------------------------------------
     Paper Style
  ---------------------------------------------------------- */

  paperStyle: "ruled",
  notebookMargin: "normal",

  /* ----------------------------------------------------------
     Page Settings
  ---------------------------------------------------------- */

  paperSize: "A4",
  orientation: "portrait",

  /* ----------------------------------------------------------
     Page Margins
  ---------------------------------------------------------- */

  marginPreset: "normal",

  customMargins: {
    top: 56,
    right: 50,
    bottom: 56,
    left: 50,
  },

  /* ----------------------------------------------------------
     Header Display Fields
  ---------------------------------------------------------- */

  showName: true,
  showRollNumber: true,
  showClass: true,
  showSection: true,
  showSubject: true,
  showDate: true,
  showTeacher: false,

  /* ----------------------------------------------------------
     Footer
  ---------------------------------------------------------- */

  showFooter: true,
  footerText: "InkAI",
  showPageNumber: true,
  pageNumberPosition: "center",

  /* ----------------------------------------------------------
     Font Sizes
  ---------------------------------------------------------- */

  headingFontSize: "large",
  titleFontSize: "medium",
  bodyFontSize: "medium",

  /* ----------------------------------------------------------
     Title Formatting
  ---------------------------------------------------------- */

  titleAlignment: "center",

  /* ----------------------------------------------------------
     Content
  ---------------------------------------------------------- */

  content: "",
};

/* ============================================================
   FONT SIZE OPTIONS
============================================================ */

const FONT_SIZES = [
  {
    id: "small",
    name: "Small",
  },
  {
    id: "medium",
    name: "Medium",
  },
  {
    id: "large",
    name: "Large",
  },
  {
    id: "xlarge",
    name: "Extra Large",
  },
];

/* ============================================================
   FONT SIZE CLASSES
============================================================ */

const FONT_SIZE_CLASSES = {
  heading: {
    small: "text-lg",
    medium: "text-xl",
    large: "text-2xl",
    xlarge: "text-3xl",
  },

  title: {
    small: "text-base",
    medium: "text-lg",
    large: "text-xl",
    xlarge: "text-2xl",
  },

  body: {
    small: "text-xs",
    medium: "text-sm",
    large: "text-base",
    xlarge: "text-lg",
  },
};

/* ============================================================
   TEMPLATE HEADINGS
============================================================ */

const TEMPLATE_HEADINGS = {
  "school-notebook": "ASSIGNMENT",
  "college-assignment": "ASSIGNMENT",
  "project-report": "PROJECT REPORT",
  "simple-homework": "HOMEWORK",
};

/* ============================================================
   PAGE MARGIN HELPERS
============================================================ */

function getPageMargins(data) {
  if (data.marginPreset === "custom") {
    return data.customMargins;
  }

  const presets = {
    normal: {
      top: 56,
      right: 50,
      bottom: 56,
      left: 50,
    },

    narrow: {
      top: 36,
      right: 36,
      bottom: 36,
      left: 36,
    },

    wide: {
      top: 72,
      right: 65,
      bottom: 72,
      left: 65,
    },
  };

  return presets[data.marginPreset] || presets.normal;
}

/* ============================================================
   ASSIGNMENT PAGE
============================================================ */

function AssignmentPage() {
  const [assignment, setAssignment] = useState(
    DEFAULT_ASSIGNMENT
  );

  const location = useLocation();
  const navigate = useNavigate();

  const [phase6Document, setPhase6Document] =
    useState(
      location.state?.document || null
    );

  const [
    isLoadingDocument,
    setIsLoadingDocument,
  ] = useState(false);

  const [
    documentError,
    setDocumentError,
  ] = useState("");

  const [
    handwriting,
    setHandwriting,
  ] = useState({
    style: "school_notebook",
    font: "school_notebook",
    ink: "blue",
    paper: "ruled",
    naturalness: 65,
    fontSize: 22,
    lineSpacing: 1.5,
    letterSpacing: 0.5,
    wordSpacing: 5,
    seed: 12345,
  });

    /* ==========================================================
      STEP 17 / STEP 18 — PREVIEW CONTROLS
    ========================================================== */

    const [previewZoom, setPreviewZoom] =
      useState(1);

    const [previewPage, setPreviewPage] =
      useState(1);

    const [previewTotalPages, setPreviewTotalPages] =
      useState(1);

      const [previewPages, setPreviewPages] =
        useState([
          {
            pageNumber: 1,
            nodes: [],
          },
        ]);

      const [
        isPaginatingPreview,
        setIsPaginatingPreview,
      ] = useState(false);

      const [generationResult, setGenerationResult] =
        useState(null);

      const [showReadyScreen, setShowReadyScreen] =
        useState(false);

      const [exportFormat, setExportFormat] = useState("pdf");

      const [draftId, setDraftId,] = useState(
        location.state?.draftId || null
      );

      const [draftSaveStatus, setDraftSaveStatus] = useState("idle");

      useEffect(() => {
        const result = location.state?.generationResult;
        if (result) {
          setGenerationResult(result);
          setShowReadyScreen(true);
        }
      }, [location.state]);

      // ==========================================================
      // STEP 17B — RESET PREVIEW PAGE
      // ==========================================================

      useEffect(() => {
        setPreviewPage(1);
      }, [
        assignment.template,
        assignment.paperStyle,
        assignment.paperSize,
        assignment.orientation,
        assignment.marginPreset,
        assignment.customMargins,
        assignment.headingFontSize,
        assignment.titleFontSize,
        assignment.bodyFontSize,
        assignment.titleAlignment,
        phase6Document,
      ]);

      // ==========================================================
      // STEP 17C — PREVIEW CONTROLS
      // ==========================================================

      const zoomIn = () => {
        setPreviewZoom((current) =>
          Math.min(
            Number(
              (current + 0.1).toFixed(2)
            ),
            2
          )
        );
      };

      const zoomOut = () => {
        setPreviewZoom((current) =>
          Math.max(
            Number(
              (current - 0.1).toFixed(2)
            ),
            0.5
          )
        );
      };

      const fitPage = () => {
        setPreviewZoom(1);
      };

      const goToPreviousPage = () => {
        setPreviewPage((current) =>
          Math.max(current - 1, 1)
        );
      };

      const goToNextPage = () => {
        setPreviewPage((current) =>
          Math.min(
            current + 1,
            previewTotalPages
          )
        );
      };

  /* ==========================================================
     UPDATE ASSIGNMENT
  ========================================================== */

  const updateAssignment = (field, value) => {
    setAssignment((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  // ==========================================================
  // STEP 31 — AUTO SAVE DRAFT
  // ==========================================================

  useEffect(() => {
    const documentId =
      phase6Document?.id ||
      phase6Document?.document_id ||
      location.state?.documentId;

    if (!documentId) {
      return;
    }

    let cancelled = false;

    const timer = setTimeout(async () => {
      try {
        setDraftSaveStatus("saving");

        const result =
          await saveAssignmentDraft({
            draftId,
            documentId,

            template:
              assignment.template,

            paper:
              assignment.paperStyle,

            handwritingStyle:
              handwriting.style,

            ink:
              handwriting.ink,

            pageNumbers:
              assignment.showPageNumber,

            assignment,

            handwriting,
          });

        if (cancelled) {
          return;
        }

        if (result?.draft_id) {
          setDraftId(result.draft_id);
        }

        setDraftSaveStatus("saved");

      } catch (error) {
        console.error(
          "Failed to save assignment draft:",
          error
        );

        if (!cancelled) {
          setDraftSaveStatus("error");
        }
      }
    }, 800);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [
    phase6Document,
    assignment,
    handwriting,
    draftId,
    location.state?.documentId,
  ]);

  /* ==========================================================
     PREVIEW DATA
  ========================================================== */

  const previewData = useMemo(() => {
    return {
      ...assignment,
    };
  }, [assignment]);

  useEffect(() => {
    const documentId =
      location.state?.documentId;

    if (
      phase6Document ||
      !documentId
    ) {
      return;
    }

    let cancelled = false;

    async function loadDocument() {
      try {
        setIsLoadingDocument(true);
        setDocumentError("");

        const document =
          await getPhase6Document(
            documentId
          );

        if (!cancelled) {
          setPhase6Document(
            document
          );
        }
      } catch (error) {
        console.error(
          "Failed to load Phase 6 document:",
          error
        );

        if (!cancelled) {
          setDocumentError(
            error.message ||
              "Unable to load the document."
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoadingDocument(false);
        }
      }
    }

    loadDocument();

    return () => {
      cancelled = true;
    };
  }, [
    location.state,
    phase6Document,
  ]);

    useEffect(() => {
      if (!phase6Document) {
        setPreviewPages([
          {
            pageNumber: 1,
            nodes: [],
          },
        ]);

        setPreviewTotalPages(1);

        return;
      }

      let cancelled = false;

      async function updatePreviewPagination() {
        try {
          setIsPaginatingPreview(true);

          const result =
            await paginateAssignment({
              document: phase6Document.content ||
                phase6Document,
              assignment,
            });

          if (cancelled) {
            return;
          }

          const pages =
            Array.isArray(result?.pages)
              ? result.pages
              : [];

          setPreviewPages(
            pages.length
              ? pages
              : [
                  {
                    pageNumber: 1,
                    nodes: [],
                  },
                ]
          );

          setPreviewTotalPages(
            pages.length || 1
          );

        } catch (error) {
          console.error(
            "Failed to paginate live preview:",
            error
          );

          if (!cancelled) {
            setPreviewPages([
              {
                pageNumber: 1,
                nodes:
                  phase6Document?.content
                    ?.content ||
                  phase6Document?.blocks ||
                  [],
              },
            ]);

            setPreviewTotalPages(1);
          }

        } finally {
          if (!cancelled) {
            setIsPaginatingPreview(false);
          }
        }
      }

      updatePreviewPagination();

      return () => {
        cancelled = true;
      };

    }, [
      phase6Document,
      assignment,
    ]);

  const handlePreviewPDF = () => {
    if (!generationResult?.download_url) {
      return;
    }

    window.open(
      generationResult.download_url,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const handleDownloadPDF = async () => {
    if (!generationResult?.download_url) {
      return;
    }

    try {
      const response = await fetch(
        generationResult.download_url
      );

      if (!response.ok) {
        throw new Error(
          "Failed to download PDF."
        );
      }

      const blob =
        await response.blob();

      const url =
        window.URL.createObjectURL(blob);

      const link =
        document.createElement("a");

      link.href = url;

      document.body.appendChild(link);

      link.click();

      link.remove();

      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error(
        "PDF download failed:",
        error
      );
    }
  };

  const handleCreateAnother = () => {
    setGenerationResult(null);
    setShowReadyScreen(false);
    setExportFormat("pdf");
  };

  /* ==========================================================
     STEP 12.2 / 12.8 — GENERATE HANDWRITING
  ========================================================== */

  const handleGenerateHandwriting = async () => {
    setDocumentError("");

    // ==========================================================
    // STEP 30 — REQUIRED FIELD VALIDATION
    // ==========================================================

    if (!assignment.studentName?.trim()) {
      setDocumentError(
        "Please enter the student name."
      );
      return;
    }

    if (!assignment.subject?.trim()) {
      setDocumentError(
        "Please enter the subject."
      );
      return;
    }

    if (!assignment.title?.trim()) {
      setDocumentError(
        "Please enter the assignment title."
      );
      return;
    }

    if (!phase6Document) {
      setDocumentError(
        "Phase 6 document is not available."
      );
      return;
    }

    // ==========================================================
    // CHECK STRUCTURED CONTENT
    // ==========================================================

    const documentContent =
      phase6Document?.content?.content ||
      phase6Document?.content ||
      phase6Document?.blocks ||
      [];

    const hasContent =
      Array.isArray(documentContent) &&
      documentContent.some((node) => {
        if (!node) {
          return false;
        }

        if (
          node.type === "text" &&
          node.text?.trim()
        ) {
          return true;
        }

        if (
          Array.isArray(node.content) &&
          node.content.length > 0
        ) {
          return node.content.some(
            (child) =>
              child?.text?.trim() ||
              (
                Array.isArray(child?.content) &&
                child.content.length > 0
              )
          );
        }

        return false;
      });

    if (!hasContent) {
      setDocumentError(
        "Please add some assignment content before generating."
      );
      return;
    }

    // ==========================================================
    // CREATE HANDWRITING PAYLOAD
    // ==========================================================

    try {
      const payload =
        createHandwritingAssignmentPayload({
          phase6Document,
          assignment,
          handwriting,
        });

      navigate("/handwriting", {
        state: {
          document: payload.document,
          assignment: payload.assignment,
          handwriting: payload.handwriting,
        },
      });
    } catch (error) {
      console.error(
        "Failed to prepare handwriting assignment:",
        error
      );

      setDocumentError(
        error?.message ||
          "Unable to prepare the assignment for handwriting generation."
      );
    }
  };

  return (
    <>
      {showReadyScreen && generationResult ? (
        <div className="min-h-screen bg-[#080b12] text-white flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-2xl">
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-8 md:p-10 shadow-2xl">
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-400/30 flex items-center justify-center text-emerald-400 text-4xl">
                  ✓
                </div>
              </div>

              <div className="text-center mb-8">
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
                  Assignment Ready!
                </h1>
                <p className="text-gray-400">
                  Your handwritten assignment has been generated successfully.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-5 text-center">
                  <p className="text-gray-500 text-xs uppercase tracking-wider mb-2">Pages</p>
                  <p className="text-2xl font-bold text-white">
                    {generationResult.pages || 0}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-5 text-center">
                  <p className="text-gray-500 text-xs uppercase tracking-wider mb-2">Paper</p>
                  <p className="text-lg font-semibold text-white capitalize">
                    {assignment.paperStyle?.replaceAll("_", " ") || "Ruled"}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-5 text-center">
                  <p className="text-gray-500 text-xs uppercase tracking-wider mb-2">Ink</p>
                  <p className="text-lg font-semibold text-white capitalize">
                    {handwriting.ink || "Blue"} Ink
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-sm font-medium text-gray-300 mb-3">Export Format</p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setExportFormat("pdf")}
                    className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                      exportFormat === "pdf"
                        ? "border-cyan-400/50 bg-cyan-400/10 text-cyan-300"
                        : "border-white/10 bg-white/5 text-gray-400"
                    }`}
                  >
                    PDF
                  </button>

                  <button
                    type="button"
                    disabled
                    className="rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3 text-sm font-semibold text-gray-600 cursor-not-allowed"
                  >
                    PNG
                    <span className="block text-[10px] mt-1">Coming soon</span>
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handlePreviewPDF}
                  className="w-full rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white py-3.5 font-semibold transition"
                >
                  Preview PDF
                </button>

                <button
                  type="button"
                  onClick={handleDownloadPDF}
                  className="w-full rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black py-3.5 font-semibold transition"
                >
                  Download PDF
                </button>

                <button
                  type="button"
                  onClick={handleCreateAnother}
                  className="w-full rounded-xl border border-white/10 bg-transparent hover:bg-white/5 text-gray-300 py-3.5 font-semibold transition"
                >
                  Create Another
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="min-h-screen bg-slate-950 text-white">

      {/* =====================================================
          PAGE HEADER
      ====================================================== */}

      <header className="border-b border-white/10 bg-slate-950/95">

        <div className="mx-auto max-w-7xl px-6 py-5">

          <h1 className="text-2xl font-bold tracking-tight">
            Create Assignment
          </h1>

          <p className="mt-1 text-sm text-slate-400">
            Create a handwritten-style assignment with a live
            preview.
          </p>

        </div>

      </header>

      {/* =====================================================
          MAIN WORKSPACE
      ====================================================== */}

      <main className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-6 py-6 lg:grid-cols-2">

        {/* ===================================================
            LEFT — ASSIGNMENT SETUP
        ==================================================== */}

        <section className="rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-xl">

          {/* -------------------------------------------------
              SECTION TITLE
          -------------------------------------------------- */}

          <div className="mb-6">

            <h2 className="text-lg font-semibold">
              Assignment Setup
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Enter your assignment details and configure the
              document.
            </p>

          </div>

          {/* =================================================
              STUDENT + ASSIGNMENT INFORMATION
          ================================================== */}

          <AssignmentForm
            assignment={assignment}
            updateAssignment={updateAssignment}
          />

          {/* =================================================
              TEMPLATE
          ================================================== */}

          <div className="mt-4">

            <AssignmentTemplates
              selectedTemplate={assignment.template}
              onTemplateChange={(template) =>
                updateAssignment(
                  "template",
                  template
                )
              }
            />

          </div>



          {/* =================================================
              PAPER STYLE
          ================================================== */}

          <details className="group mt-4 rounded-xl border border-white/10 bg-slate-800/40">

            <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4">

              <div>

                <h3 className="text-sm font-semibold text-white">
                  Paper Style
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                  Choose notebook and writing-line style.
                </p>

              </div>

              <span className="ml-4 text-xs text-slate-400 transition-transform duration-200 group-open:rotate-180">
                ▼
              </span>

            </summary>

            <div className="border-t border-white/10 px-5 py-5">

              <PaperSelector
                selectedPaper={assignment.paperStyle}

                onPaperChange={(paperStyle) =>
                  updateAssignment(
                    "paperStyle",
                    paperStyle
                  )
                }

                selectedMargin={
                  assignment.notebookMargin
                }

                onMarginChange={(notebookMargin) =>
                  updateAssignment(
                    "notebookMargin",
                    notebookMargin
                  )
                }
              />

            </div>

          </details>

          {/* =================================================
              PAGE SETTINGS
          ================================================== */}

          <div className="mt-4">

            <PageSettings
              paperSize={assignment.paperSize}
              orientation={assignment.orientation}
              marginPreset={assignment.marginPreset}
              customMargins={assignment.customMargins}

              onPaperSizeChange={(paperSize) =>
                updateAssignment(
                  "paperSize",
                  paperSize
                )
              }

              onOrientationChange={(orientation) =>
                updateAssignment(
                  "orientation",
                  orientation
                )
              }

              onMarginPresetChange={(marginPreset) =>
                updateAssignment(
                  "marginPreset",
                  marginPreset
                )
              }

              onCustomMarginsChange={(customMargins) =>
                updateAssignment(
                  "customMargins",
                  customMargins
                )
              }
            />

          </div>

          {/* =================================================
              FONT SETTINGS
          ================================================== */}

          <details className="group mt-4 rounded-xl border border-white/10 bg-slate-800/40">

            <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4">

              <div>

                <h3 className="text-sm font-semibold text-white">
                  Font Sizes
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                  Adjust heading, title and content sizes.
                </p>

              </div>

              <span className="ml-4 text-xs text-slate-400 transition-transform duration-200 group-open:rotate-180">
                ▼
              </span>

            </summary>

            <div className="border-t border-white/10 px-5 py-5">

              <div className="grid gap-4 sm:grid-cols-3">

                {/* Heading */}

                <div>

                  <label className="mb-2 block text-xs text-slate-400">
                    Heading
                  </label>

                  <select
                    value={assignment.headingFontSize}
                    onChange={(event) =>
                      updateAssignment(
                        "headingFontSize",
                        event.target.value
                      )
                    }
                    className="w-full rounded-lg border border-white/10 bg-slate-800 px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-500"
                  >

                    {FONT_SIZES.map((size) => (
                      <option
                        key={size.id}
                        value={size.id}
                      >
                        {size.name}
                      </option>
                    ))}

                  </select>

                </div>

                {/* Title */}

                <div>

                  <label className="mb-2 block text-xs text-slate-400">
                    Title
                  </label>

                  <select
                    value={assignment.titleFontSize}
                    onChange={(event) =>
                      updateAssignment(
                        "titleFontSize",
                        event.target.value
                      )
                    }
                    className="w-full rounded-lg border border-white/10 bg-slate-800 px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-500"
                  >

                    {FONT_SIZES.map((size) => (
                      <option
                        key={size.id}
                        value={size.id}
                      >
                        {size.name}
                      </option>
                    ))}

                  </select>

                </div>

                {/* Content */}

                <div>

                  <label className="mb-2 block text-xs text-slate-400">
                    Content
                  </label>

                  <select
                    value={assignment.bodyFontSize}
                    onChange={(event) =>
                      updateAssignment(
                        "bodyFontSize",
                        event.target.value
                      )
                    }
                    className="w-full rounded-lg border border-white/10 bg-slate-800 px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-500"
                  >

                    {FONT_SIZES.map((size) => (
                      <option
                        key={size.id}
                        value={size.id}
                      >
                        {size.name}
                      </option>
                    ))}

                  </select>

                </div>

              </div>

            </div>

          </details>

          {/* =================================================
              TITLE SETTINGS
          ================================================== */}

          <TitleSettings
            titleAlignment={
              assignment.titleAlignment
            }

            onTitleAlignmentChange={
              (titleAlignment) =>
                updateAssignment(
                  "titleAlignment",
                  titleAlignment
                )
            }
          />

          <HandwritingStyleSettings
            value={handwriting}
            onChange={setHandwriting}
          />

          {/* =================================================
              HEADER SETTINGS
          ================================================== */}

          <details className="group mt-4 rounded-xl border border-white/10 bg-slate-800/40">

            <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4">

              <div>

                <h3 className="text-sm font-semibold text-white">
                  Header
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                  Choose which information appears in the
                  assignment header.
                </p>

              </div>

              <span className="ml-4 text-xs text-slate-400 transition-transform duration-200 group-open:rotate-180">
                ▼
              </span>

            </summary>

            <div className="border-t border-white/10 px-5 py-5">

              <div className="grid gap-3 sm:grid-cols-2">

                {[
                  ["showName", "Show Name"],
                  [
                    "showRollNumber",
                    "Show Roll Number",
                  ],
                  [
                    "showSubject",
                    "Show Subject",
                  ],
                  ["showDate", "Show Date"],
                  [
                    "showTeacher",
                    "Show Teacher",
                  ],
                  ["showClass", "Show Class"],
                  [
                    "showSection",
                    "Show Section",
                  ],
                ].map(([field, label]) => (

                  <label
                    key={field}
                    className="flex cursor-pointer items-center gap-3 rounded-lg border border-white/10 bg-slate-800 px-3 py-3 text-sm text-slate-300 transition hover:border-white/20"
                  >

                    <input
                      type="checkbox"
                      checked={assignment[field]}
                      onChange={(event) =>
                        updateAssignment(
                          field,
                          event.target.checked
                        )
                      }
                      className="h-4 w-4 rounded border-slate-600 bg-slate-700 text-indigo-500 focus:ring-indigo-500"
                    />

                    {label}

                  </label>

                ))}

              </div>

            </div>

          </details>

          {/* =================================================
              FOOTER SETTINGS
          ================================================== */}

          <details className="group mt-4 rounded-xl border border-white/10 bg-slate-800/40">

            <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4">

              <div>
                <h3 className="text-sm font-semibold text-white">
                  Footer
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                  Configure footer text and page numbering.
                </p>
              </div>

              <span className="ml-4 text-xs text-slate-400 transition-transform duration-200 group-open:rotate-180">
                ▼
              </span>

            </summary>

            <div className="space-y-4 border-t border-white/10 px-5 py-5">

              {/* =================================================
                  ENABLE FOOTER
              ================================================== */}

              <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-white/10 bg-slate-800 px-3 py-3 text-sm text-slate-300 transition hover:border-white/20">

                <input
                  type="checkbox"
                  checked={assignment.showFooter}
                  onChange={(event) =>
                    updateAssignment(
                      "showFooter",
                      event.target.checked
                    )
                  }
                  className="h-4 w-4 rounded border-slate-600 bg-slate-700 text-indigo-500 focus:ring-indigo-500"
                />

                Enable Footer

              </label>

              {/* =================================================
                  FOOTER TEXT
              ================================================== */}

              {assignment.showFooter && (
                <div>

                  <label className="mb-2 block text-xs text-slate-400">
                    Footer Text
                  </label>

                  <input
                    type="text"
                    value={assignment.footerText}
                    onChange={(event) =>
                      updateAssignment(
                        "footerText",
                        event.target.value
                      )
                    }
                    placeholder="Computer Networks — Assignment"
                    className="w-full rounded-lg border border-white/10 bg-slate-800 px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-500"
                  />

                  <p className="mt-1 text-xs text-slate-500">
                    Example: Computer Networks — Assignment
                  </p>

                </div>
              )}

              {/* =================================================
                  PAGE NUMBERS
              ================================================== */}

              <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-white/10 bg-slate-800 px-3 py-3 text-sm text-slate-300 transition hover:border-white/20">

                <input
                  type="checkbox"
                  checked={assignment.showPageNumber}
                  onChange={(event) =>
                    updateAssignment(
                      "showPageNumber",
                      event.target.checked
                    )
                  }
                  className="h-4 w-4 rounded border-slate-600 bg-slate-700 text-indigo-500 focus:ring-indigo-500"
                />

                Show Page Numbers

              </label>

              {/* =================================================
                  PAGE NUMBER POSITION
              ================================================== */}

              {assignment.showPageNumber && (
                <div>

                  <label className="mb-2 block text-xs text-slate-400">
                    Page Number Position
                  </label>

                  <select
                    value={assignment.pageNumberPosition}
                    onChange={(event) =>
                      updateAssignment(
                        "pageNumberPosition",
                        event.target.value
                      )
                    }
                    className="w-full rounded-lg border border-white/10 bg-slate-800 px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-500"
                  >

                    <option value="left">
                      Bottom Left
                    </option>

                    <option value="center">
                      Bottom Center
                    </option>

                    <option value="right">
                      Bottom Right
                    </option>

                  </select>

                </div>
              )}

            </div>

          </details>

          {/* =================================================
              STEP 12.8 — GENERATE HANDWRITTEN ASSIGNMENT
          ================================================== */}

          <div className="mt-6 border-t border-white/10 pt-5">
            <button
              type="button"
              onClick={handleGenerateHandwriting}
              disabled={
                !phase6Document ||
                isLoadingDocument
              }
              className="
                w-full
                rounded-xl
                bg-indigo-600
                px-5
                py-3
                text-sm
                font-semibold
                text-white
                transition
                hover:bg-indigo-500
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              {isLoadingDocument
                ? "Loading Document..."
                : "Generate Handwritten Assignment"}
            </button>

            {documentError && (
              <p className="mt-2 text-xs text-red-400">
                {documentError}
              </p>
            )}

            {draftSaveStatus === "saving" && (
              <p className="mt-2 text-xs text-slate-500">
                Saving draft...
              </p>
            )}

            {draftSaveStatus === "saved" && (
              <p className="mt-2 text-xs text-emerald-400">
                ✓ Draft saved
              </p>
            )}

            {draftSaveStatus === "error" && (
              <p className="mt-2 text-xs text-red-400">
                Draft could not be saved.
              </p>
            )}
          </div>

        </section>

        {/* ===================================================
            RIGHT — LIVE PREVIEW
        ==================================================== */}

        <section className="rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-xl">

          {/* =================================================
              PREVIEW HEADER
          ================================================== */}

          <div className="mb-4">

            <div className="flex items-center justify-between">

              <div>

                <h2 className="text-lg font-semibold">
                  Live Preview
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  Preview updates automatically as you change
                  settings.
                </p>

              </div>

              <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-slate-800 px-3 py-1.5 text-xs text-slate-400 sm:flex">

                <span className="h-1.5 w-1.5 rounded-full bg-green-400" />

                Live

              </div>

            </div>

          </div>


          {/* =================================================
              STEP 18 — PREVIEW CONTROLS
          ================================================== */}

          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-slate-800/60 px-3 py-2">

            {/* -----------------------------------------------
                ZOOM
            ------------------------------------------------ */}

            <div className="flex items-center gap-1">

              <button
                type="button"
                onClick={zoomOut}
                className="
                  rounded-lg
                  border
                  border-white/10
                  bg-slate-800
                  px-3
                  py-1.5
                  text-xs
                  text-slate-300
                  transition
                  hover:bg-slate-700
                "
                title="Zoom out"
              >
                −
              </button>

              <span className="min-w-[52px] text-center text-xs text-slate-400">
                {Math.round(previewZoom * 100)}%
              </span>

              <button
                type="button"
                onClick={zoomIn}
                className="
                  rounded-lg
                  border
                  border-white/10
                  bg-slate-800
                  px-3
                  py-1.5
                  text-xs
                  text-slate-300
                  transition
                  hover:bg-slate-700
                "
                title="Zoom in"
              >
                +
              </button>

              <button
                type="button"
                onClick={fitPage}
                className="
                  ml-1
                  rounded-lg
                  border
                  border-white/10
                  bg-slate-800
                  px-3
                  py-1.5
                  text-xs
                  text-slate-300
                  transition
                  hover:bg-slate-700
                "
              >
                Fit Page
              </button>

            </div>


            {/* -----------------------------------------------
                PAGE NAVIGATION
            ------------------------------------------------ */}

            <div className="flex items-center gap-2">

              <button
                type="button"
                onClick={goToPreviousPage}
                disabled={previewPage <= 1}
                className="
                  rounded-lg
                  border
                  border-white/10
                  bg-slate-800
                  px-3
                  py-1.5
                  text-xs
                  text-slate-300
                  transition
                  hover:bg-slate-700
                  disabled:cursor-not-allowed
                  disabled:opacity-40
                "
              >
                ← Previous
              </button>

              <span className="min-w-[72px] text-center text-xs font-medium text-slate-300">
                Page {previewPage} / {previewTotalPages}
              </span>

              <button
                type="button"
                onClick={goToNextPage}
                disabled={
                  previewPage >=
                  previewTotalPages
                }
                className="
                  rounded-lg
                  border
                  border-white/10
                  bg-slate-800
                  px-3
                  py-1.5
                  text-xs
                  text-slate-300
                  transition
                  hover:bg-slate-700
                  disabled:cursor-not-allowed
                  disabled:opacity-40
                "
              >
                Next →
              </button>

            </div>

          </div>


          {/* =================================================
              PREVIEW CANVAS
          ================================================== */}

          <div
            className="
              flex
              min-h-[700px]
              items-start
              justify-center
              overflow-auto
              rounded-xl
              bg-slate-800/60
              p-6
            "
          >

            <div
              style={{
                transform: `scale(${previewZoom})`,
                transformOrigin: "top center",
                transition: "transform 150ms ease",
              }}
            >

              <AssignmentPreview
                data={previewData}
                phase6Document={phase6Document}
                pageNumber={previewPage}
                totalPages={previewTotalPages}
                pageNodes={
                  previewPages[
                    previewPage - 1
                  ]?.nodes || []
                }
              />

            </div>

          </div>

        </section>

      </main>

        </div>
      )}
    </>
  );
}

function StructuredDocumentPreview({
  nodes = [],
  bodyFontClass = "text-sm",
}) {
  if (!Array.isArray(nodes)) {
    return null;
  }

  return (
    <div
      className={`space-y-3 ${bodyFontClass}`}
    >
      {nodes.map(
        (node, index) => (
          <StructuredNode
            key={
              node.attrs?.uid ||
              `${node.type}-${index}`
            }
            node={node}
          />
        )
      )}
    </div>
  );
}

function StructuredNode({ node }) {
  if (!node) {
    return null;
  }

  switch (node.type) {
    case "heading":
      return (
        <h2
          className="font-bold"
          style={{
            fontSize:
              node.attrs?.level === 1
                ? "1.5rem"
                : node.attrs?.level === 2
                ? "1.25rem"
                : "1.1rem",
          }}
        >
          <InlineContent
            content={node.content}
          />
        </h2>
      );

    case "paragraph":
      return (
        <p>
          <InlineContent
            content={node.content}
          />
        </p>
      );

    case "bulletList":
      return (
        <ul className="list-disc pl-6">
          {(node.content || []).map(
            (item, index) => (
              <li key={index}>
                {(item.content || []).map(
                  (child, childIndex) => (
                    <StructuredNode
                      key={childIndex}
                      node={child}
                    />
                  )
                )}
              </li>
            )
          )}
        </ul>
      );

    case "orderedList":
      return (
        <ol className="list-decimal pl-6">
          {(node.content || []).map(
            (item, index) => (
              <li key={index}>
                {(item.content || []).map(
                  (child, childIndex) => (
                    <StructuredNode
                      key={childIndex}
                      node={child}
                    />
                  )
                )}
              </li>
            )
          )}
        </ol>
      );

    case "table":
      return (
        <table className="w-full border-collapse border border-slate-300">
          <tbody>
            {(node.content || []).map(
              (row, rowIndex) => (
                <tr key={rowIndex}>
                  {(row.content || []).map(
                    (cell, cellIndex) => (
                      <td
                        key={cellIndex}
                        className="border border-slate-300 px-2 py-1"
                      >
                        {(cell.content || []).map(
                          (
                            child,
                            childIndex
                          ) => (
                            <StructuredNode
                              key={
                                childIndex
                              }
                              node={
                                child
                              }
                            />
                          )
                        )}
                      </td>
                    )
                  )}
                </tr>
              )
            )}
          </tbody>
        </table>
      );

    case "image":
      return (
        <div className="my-4">
          <img
            src={
              node.attrs?.src
            }
            alt={
              node.attrs?.alt ||
              ""
            }
            style={{
              width:
                node.attrs?.width ||
                "auto",
              maxWidth: "100%",
            }}
            className="rounded"
          />
        </div>
      );

    case "pageBreak":
      return null;

    case "hardBreak":
      return <br />;

    default:
      return (
        <div>
          {(node.content || []).map(
            (child, index) => (
              <StructuredNode
                key={index}
                node={child}
              />
            )
          )}
        </div>
      );
  }
}

function InlineContent({
  content = [],
}) {
  return (
    <>
      {content.map(
        (node, index) => {
          if (
            node.type === "hardBreak"
          ) {
            return (
              <br
                key={index}
              />
            );
          }

          if (
            node.type !== "text"
          ) {
            return null;
          }

          let element = (
            <span>
              {node.text}
            </span>
          );

          const marks =
            node.marks || [];

          for (
            const mark of marks
          ) {
            if (
              mark.type ===
              "bold"
            ) {
              element = (
                <strong
                  key={`${index}-bold`}
                >
                  {element}
                </strong>
              );
            }

            if (
              mark.type ===
              "italic"
            ) {
              element = (
                <em
                  key={`${index}-italic`}
                >
                  {element}
                </em>
              );
            }

            if (
              mark.type ===
              "underline"
            ) {
              element = (
                <u
                  key={`${index}-underline`}
                >
                  {element}
                </u>
              );
            }

            if (
              mark.type ===
              "strike"
            ) {
              element = (
                <s
                  key={`${index}-strike`}
                >
                  {element}
                </s>
              );
            }
          }

          return (
            <span key={index}>
              {element}
            </span>
          );
        }
      )}
    </>
  );
}

/* ============================================================
   ASSIGNMENT PREVIEW
============================================================ */

function AssignmentPreview({
  data,
  phase6Document,
  pageNumber = 1,
  totalPages = 1,
  pageNodes = [],
}) {

  const structuredBlocks =
    Array.isArray(pageNodes)
      ? pageNodes
      : [];

  /* ----------------------------------------------------------
     Orientation
  ---------------------------------------------------------- */

  const isLandscape =
    data.orientation === "landscape";

  /* ----------------------------------------------------------
     Paper Configuration
  ---------------------------------------------------------- */

  const paperConfig =
    getPaperConfig(data.paperStyle);

  /* ----------------------------------------------------------
     Page Margins
  ---------------------------------------------------------- */

  const pageMargins =
    getPageMargins(data);

  /* ----------------------------------------------------------
     Notebook Writing Margin
  ---------------------------------------------------------- */

  const writingLeftMargin =
    getEffectiveLeftMargin(
      data.paperStyle,
      data.notebookMargin
    );

  /* ----------------------------------------------------------
     Preview Dimensions
  ---------------------------------------------------------- */

  const paperClass = isLandscape
    ? "h-[520px] w-[735px]"
    : "min-h-[735px] w-[520px]";

  /* ----------------------------------------------------------
     Font Sizes
  ---------------------------------------------------------- */

  const headingSize =
    FONT_SIZE_CLASSES.heading[
      data.headingFontSize
    ] ||
    FONT_SIZE_CLASSES.heading.large;

  const titleSize =
    FONT_SIZE_CLASSES.title[
      data.titleFontSize
    ] ||
    FONT_SIZE_CLASSES.title.medium;

  const bodySize =
    FONT_SIZE_CLASSES.body[
      data.bodyFontSize
    ] ||
    FONT_SIZE_CLASSES.body.medium;

  /* ----------------------------------------------------------
     Template Heading
  ---------------------------------------------------------- */

  const templateHeading =
    TEMPLATE_HEADINGS[data.template] ||
    "ASSIGNMENT";

  /* ==========================================================
     PAPER BACKGROUND
  ========================================================== */

  const PaperBackground = () => {

    /* --------------------------------------------------------
       Plain Paper
    -------------------------------------------------------- */

    if (data.paperStyle === "plain") {
      return null;
    }

    /* --------------------------------------------------------
       Graph Paper
    -------------------------------------------------------- */

    if (data.paperStyle === "graph") {

      return (
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(
                #cbd5e1 1px,
                transparent 1px
              ),
              linear-gradient(
                90deg,
                #cbd5e1 1px,
                transparent 1px
              )
            `,

            backgroundSize: `${
              paperConfig.gridSize
            }px ${
              paperConfig.gridSize
            }px`,

            opacity: 0.45,
          }}
        />
      );
    }

    /* --------------------------------------------------------
       Ruled / Notebook Paper
    -------------------------------------------------------- */

    return (
      <>
        {/* Horizontal writing lines */}

        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: `
              repeating-linear-gradient(
                to bottom,
                transparent 0px,
                transparent ${
                  paperConfig.lineHeight - 1
                }px,
                #cbd5e1 ${
                  paperConfig.lineHeight - 1
                }px,
                #cbd5e1 ${
                  paperConfig.lineHeight
                }px
              )
            `,

            backgroundPositionY:
              `${paperConfig.topMargin}px`,

            opacity: 0.65,
          }}
        />

        {/* Notebook Vertical Margin */}

        {paperConfig.showVerticalMargin &&
          data.notebookMargin !== "none" && (

            <div
              className="pointer-events-none absolute bottom-0 top-0 border-l border-red-300"
              style={{
                left:
                  data.notebookMargin === "wide"
                    ? "82px"
                    : "62px",

                opacity: 0.6,
              }}
            />

          )}

      </>
    );
  };

  /* ==========================================================
     FOOTER
  ========================================================== */

  const Footer = () => {

    if (
      !data.showFooter &&
      !data.showPageNumber
    ) {
      return null;
    }

    const pageText =
      `Page ${pageNumber} of ${totalPages}`;

    return (
      <div className="absolute bottom-5 left-8 right-8 border-t border-slate-300 pt-2 text-[10px] text-slate-500">

        {data.showPageNumber && (
          <div
            className={
              data.pageNumberPosition === "left"
                ? "text-left"
                : data.pageNumberPosition === "right"
                  ? "text-right"
                  : "text-center"
            }
          >
            {pageText}
          </div>
        )}

        {data.showFooter &&
          data.footerText && (
            <div className="mt-1 text-center">
              {data.footerText}
            </div>
          )}

      </div>
    );
  };

  /* ==========================================================
     COMMON PAGE STYLE
  ========================================================== */

  const pageStyle = {

    paddingTop:
      `${pageMargins.top}px`,

    paddingRight:
      `${pageMargins.right}px`,

    paddingBottom:
      `${pageMargins.bottom}px`,

    paddingLeft:
      `${Math.max(
        pageMargins.left,
        writingLeftMargin
      )}px`,
  };

  /* ==========================================================
     SCHOOL NOTEBOOK
  ========================================================== */

  if (
    data.template === "school-notebook"
  ) {

    return (
      <div
        className={`relative overflow-hidden bg-white text-slate-900 shadow-2xl ${paperClass}`}
        style={pageStyle}
      >

        <PaperBackground />

        <div className="relative z-10">

          {/* Heading */}

          <h2
            className={`mb-5 text-center font-bold tracking-widest ${headingSize}`}
          >
            {templateHeading}
          </h2>

          {/* Header */}

          <AssignmentHeader
            assignment={data}
          />

          {/* Assignment Title */}

          <h3
            className={`mb-5 mt-6 font-bold ${titleSize}`}
            style={{
              textAlign:
                data.titleAlignment ||
                "center",
            }}
          >
            {data.title ||
              "Assignment Title"}
          </h3>

          {/* Content */}

          <StructuredDocumentPreview
            nodes={structuredBlocks}
            bodyFontClass={bodySize}
          />

        </div>

        <AssignmentFooter
          showFooter={data.showFooter}
          footerText={data.footerText}
          showPageNumber={data.showPageNumber}
          pageNumber={1}
          totalPages={1}
          pageNumberPosition={
            data.pageNumberPosition
          }
        />

      </div>
    );
  }

  /* ==========================================================
     COLLEGE ASSIGNMENT
  ========================================================== */

  if (
    data.template === "college-assignment"
  ) {

    return (
      <div
        className={`relative overflow-hidden bg-white text-slate-900 shadow-2xl ${paperClass}`}
        style={pageStyle}
      >

        <PaperBackground />

        <div className="relative z-10">

          {/* Main Heading */}

          <h2
            className={`mb-4 text-center font-bold tracking-[0.18em] ${headingSize}`}
          >
            {templateHeading}
          </h2>

          {/* Configurable Header */}

          <AssignmentHeader
            assignment={data}
          />

          {/* Assignment Title */}

          <h3
            className={`mb-5 mt-5 font-bold ${titleSize}`}
            style={{
              textAlign:
                data.titleAlignment ||
                "center",
            }}
          >
            {data.title ||
              "Assignment Title"}
          </h3>

          {/* Assignment Content */}

          <StructuredDocumentPreview
            nodes={structuredBlocks}
            bodyFontClass={bodySize}
          />

        </div>

        <AssignmentFooter
          showFooter={data.showFooter}
          footerText={data.footerText}
          showPageNumber={data.showPageNumber}
          pageNumber={1}
          totalPages={1}
          pageNumberPosition={
            data.pageNumberPosition
          }
        />

      </div>
    );
  }

  /* ==========================================================
     PROJECT REPORT
  ========================================================== */

  if (
    data.template === "project-report"
  ) {

    return (
      <div
        className={`relative overflow-hidden bg-white text-slate-900 shadow-2xl ${paperClass}`}
        style={pageStyle}
      >

        <div className="relative z-10 flex h-full flex-col items-center text-center">

          {/* Report Heading */}

          <div className="mt-8">

            <h2
              className={`font-bold tracking-widest ${headingSize}`}
            >
              {templateHeading}
            </h2>

            <div className="mx-auto mt-3 h-1 w-16 bg-slate-900" />

          </div>

          {/* Project Title */}

          <div className="mt-12">

            <p className="text-xs uppercase tracking-widest text-slate-500">
              Project Title
            </p>

            <h3
              className={`mt-3 font-bold ${titleSize}`}
              style={{
                textAlign:
                  data.titleAlignment ||
                  "center",
              }}
            >
              {data.title ||
                "Project Title"}
            </h3>

          </div>

          {/* Submitted Information */}

          <div
            className={`mt-12 space-y-3 ${bodySize}`}
          >

            <p className="font-semibold">
              Submitted By
            </p>

            {data.showName && (
              <p>
                {data.studentName ||
                  "Student Name"}
              </p>
            )}

            {data.showRollNumber && (
              <p>
                {data.rollNumber ||
                  "Roll Number"}
              </p>
            )}

            {data.showClass && (
              <p>
                {data.className ||
                  "Class"}
              </p>
            )}

            {data.showSection && (
              <p>
                {data.section ||
                  "Section"}
              </p>
            )}

            {data.showTeacher && (
              <>
                <p className="pt-5 font-semibold">
                  Submitted To
                </p>

                <p>
                  {data.teacherName ||
                    "Professor"}
                </p>
              </>
            )}

          </div>

          <div className="mt-10 w-full text-left">
            <StructuredDocumentPreview
              nodes={structuredBlocks}
              bodyFontClass={bodySize}
            />
          </div>

        </div>

        <AssignmentFooter
          showFooter={data.showFooter}
          footerText={data.footerText}
          showPageNumber={data.showPageNumber}
          pageNumber={1}
          totalPages={1}
          pageNumberPosition={
            data.pageNumberPosition
          }
        />

      </div>
    );
  }

  /* ==========================================================
     SIMPLE HOMEWORK
  ========================================================== */

  return (
    <div
      className={`relative overflow-hidden bg-white text-slate-900 shadow-2xl ${paperClass}`}
      style={pageStyle}
    >

      <PaperBackground />

      <div className="relative z-10">

        {/* Heading */}

        <h2
          className={`mb-5 text-center font-bold tracking-widest ${headingSize}`}
        >
          {templateHeading}
        </h2>

        {/* Header */}

        <AssignmentHeader
          assignment={data}
        />

        {/* Homework Title */}

        <h3
          className={`mb-5 mt-6 font-bold ${titleSize}`}
          style={{
            textAlign:
              data.titleAlignment ||
              "center",
          }}
        >
          {data.title ||
            "Homework"}
        </h3>

        {/* Homework Content */}

        <StructuredDocumentPreview
          nodes={structuredBlocks}
          bodyFontClass={bodySize}
        />

      </div>

      <AssignmentFooter
        showFooter={data.showFooter}
        footerText={data.footerText}
        showPageNumber={data.showPageNumber}
        pageNumber={1}
        totalPages={1}
        pageNumberPosition={
          data.pageNumberPosition
        }
      />

    </div>
  );
}

export default AssignmentPage;