import { useMemo, useState } from "react";

import AssignmentForm from "../components/assignment/AssignmentForm";
import AssignmentTemplates from "../components/assignment/AssignmentTemplates";
import PaperSelector from "../components/assignment/PaperSelector";
import PageSettings from "../components/assignment/PageSettings";
import WritingArea from "../components/assignment/WritingArea";

import {
  getPaperConfig,
  getEffectiveLeftMargin,
} from "../utils/paperLayout";

/* ============================================================
   DEFAULT ASSIGNMENT
============================================================ */

const DEFAULT_ASSIGNMENT = {
  /* Student information */
  studentName: "",
  rollNumber: "",
  className: "",
  section: "",

  /* Assignment information */
  subject: "",
  title: "",
  teacherName: "",
  date: new Date().toISOString().split("T")[0],

  /* Template */
  template: "college-assignment",

  /* Paper */
  paperStyle: "ruled",
  notebookMargin: "normal",

  /* Page */
  paperSize: "A4",
  orientation: "portrait",

  /* Page margins */
  marginPreset: "normal",

  customMargins: {
    top: 56,
    right: 50,
    bottom: 56,
    left: 50,
  },

  /* Display fields */
  showName: true,
  showRollNumber: true,
  showClass: true,
  showSection: true,
  showSubject: true,
  showDate: true,
  showTeacher: true,

  /* Footer */
  showFooter: true,
  showPageNumber: true,

  /* Font sizes */
  headingFontSize: "large",
  titleFontSize: "medium",
  bodyFontSize: "medium",

  /* Content */
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
   DATE FORMATTER
============================================================ */

function formatDate(dateString) {
  if (!dateString) {
    return "________";
  }

  const [year, month, day] = dateString.split("-");

  if (!year || !month || !day) {
    return dateString;
  }

  return `${day}/${month}/${year}`;
}

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

  /* ==========================================================
     UPDATE ASSIGNMENT
  ========================================================== */

  const updateAssignment = (field, value) => {
    setAssignment((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  /* ==========================================================
     PREVIEW DATA
  ========================================================== */

  const previewData = useMemo(() => {
    return {
      ...assignment,
    };
  }, [assignment]);

  return (
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

          {/* Section title */}

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
              INFORMATION
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
                updateAssignment("template", template)
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
                selectedMargin={assignment.notebookMargin}
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

          </div>

          {/* =================================================
              DISPLAY FIELDS
          ================================================== */}

          <details className="group mt-4 rounded-xl border border-white/10 bg-slate-800/40">

            <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4">

              <div>
                <h3 className="text-sm font-semibold text-white">
                  Display Fields
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                  Choose which information appears on the
                  assignment.
                </p>
              </div>

              <span className="ml-4 text-xs text-slate-400 transition-transform duration-200 group-open:rotate-180">
                ▼
              </span>

            </summary>

            <div className="border-t border-white/10 px-5 py-5">

              <div className="grid gap-3 sm:grid-cols-2">

                {[
                  ["showName", "Student Name"],
                  ["showRollNumber", "Roll Number"],
                  ["showClass", "Class"],
                  ["showSection", "Section"],
                  ["showSubject", "Subject"],
                  ["showDate", "Date"],
                  ["showTeacher", "Teacher"],
                  ["showPageNumber", "Page Number"],
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

              {/* Footer */}

              <label className="mt-3 flex cursor-pointer items-center gap-3 rounded-lg border border-white/10 bg-slate-800 px-3 py-3 text-sm text-slate-300 transition hover:border-white/20">

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

                Show Footer

              </label>

            </div>

          </details>

        </section>

        {/* ===================================================
            RIGHT — LIVE PREVIEW
        ==================================================== */}

        <section className="rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-xl">

          <div className="mb-6">

            <div className="flex items-center justify-between">

              <div>

                <h2 className="text-lg font-semibold">
                  Live Preview
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  Preview updates automatically as you
                  change settings.
                </p>

              </div>

              <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-slate-800 px-3 py-1.5 text-xs text-slate-400 sm:flex">

                <span className="h-1.5 w-1.5 rounded-full bg-green-400" />

                Live

              </div>

            </div>

          </div>

          <div className="flex min-h-[700px] items-start justify-center overflow-auto rounded-xl bg-slate-800/60 p-6">

            <AssignmentPreview
              data={previewData}
            />

          </div>

        </section>

      </main>

    </div>
  );
}

/* ============================================================
   ASSIGNMENT PREVIEW
============================================================ */

function AssignmentPreview({ data }) {

  const isLandscape =
    data.orientation === "landscape";

  const paperConfig =
    getPaperConfig(data.paperStyle);

  const pageMargins =
    getPageMargins(data);

  /*
   * Notebook margin affects where handwriting begins.
   *
   * Page margin affects the overall page layout.
   */
  const writingLeftMargin =
    getEffectiveLeftMargin(
      data.paperStyle,
      data.notebookMargin
    );

  const paperClass = isLandscape
    ? "h-[520px] w-[735px]"
    : "min-h-[735px] w-[520px]";

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

  const templateHeading =
    TEMPLATE_HEADINGS[data.template] ||
    "ASSIGNMENT";

  /* ==========================================================
     PAPER BACKGROUND
  ========================================================== */

  const PaperBackground = () => {

    /* Plain paper */

    if (data.paperStyle === "plain") {
      return null;
    }

    /* Graph paper */

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

    return (
      <>
        {/* Horizontal ruled lines */}

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

        {/* Notebook margin */}

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
     HEADER INFORMATION
  ========================================================== */

  const HeaderInformation = ({
    compact = false,
  }) => {

    return (
      <div
        className={
          compact
            ? "grid grid-cols-2 gap-x-8 gap-y-1.5 border-b border-slate-300 pb-4 text-xs"
            : "grid grid-cols-2 gap-x-8 gap-y-2 border-b border-slate-300 pb-4 text-xs"
        }
      >

        {data.showSubject && (
          <div>
            <strong>Subject:</strong>{" "}
            {data.subject || "Subject"}
          </div>
        )}

        {data.showName && (
          <div>
            <strong>Name:</strong>{" "}
            {data.studentName || "Student Name"}
          </div>
        )}

        {data.showRollNumber && (
          <div>
            <strong>Roll No:</strong>{" "}
            {data.rollNumber || "________"}
          </div>
        )}

        {data.showClass && (
          <div>
            <strong>Class:</strong>{" "}
            {data.className || "________"}
          </div>
        )}

        {data.showSection && (
          <div>
            <strong>Section:</strong>{" "}
            {data.section || "________"}
          </div>
        )}

        {data.showTeacher && (
          <div>
            <strong>Teacher:</strong>{" "}
            {data.teacherName || "________"}
          </div>
        )}

        {data.showDate && (
          <div>
            <strong>Date:</strong>{" "}
            {formatDate(data.date)}
          </div>
        )}

      </div>
    );
  };

  /* ==========================================================
     FOOTER
  ========================================================== */

  const Footer = () => {

    if (!data.showFooter) {
      return null;
    }

    return (
      <div
        className="absolute bottom-5 left-8 right-8 flex justify-between border-t border-slate-300 pt-2 text-[10px] text-slate-500"
      >

        <span>
          InkAI
        </span>

        {data.showPageNumber && (
          <span>
            Page 1
          </span>
        )}

      </div>
    );
  };

  /* ==========================================================
     COMMON PAGE STYLE
  ========================================================== */

  const pageStyle = {
    paddingTop: `${pageMargins.top}px`,
    paddingRight: `${pageMargins.right}px`,
    paddingBottom: `${pageMargins.bottom}px`,
    paddingLeft: `${Math.max(
      pageMargins.left,
      writingLeftMargin
    )}px`,
  };

  /* ==========================================================
     SCHOOL NOTEBOOK
  ========================================================== */

  if (data.template === "school-notebook") {

    return (
      <div
        className={`relative overflow-hidden bg-white text-slate-900 shadow-2xl ${paperClass}`}
        style={pageStyle}
      >

        <PaperBackground />

        <div className="relative z-10">

          <h2
            className={`mb-5 text-center font-bold tracking-widest ${headingSize}`}
          >
            {templateHeading}
          </h2>

          <HeaderInformation compact />

          <h3
            className={`mb-5 mt-6 text-center font-bold ${titleSize}`}
          >
            {data.title || "Assignment Title"}
          </h3>

          <WritingArea
            paperStyle={data.paperStyle}
            content={data.content}
            fontSizeClass={bodySize}
          />

        </div>

        <Footer />

      </div>
    );
  }

  /* ==========================================================
     COLLEGE ASSIGNMENT
  ========================================================== */

  if (data.template === "college-assignment") {

    return (
      <div
        className={`relative overflow-hidden bg-white text-slate-900 shadow-2xl ${paperClass}`}
        style={pageStyle}
      >

        <PaperBackground />

        <div className="relative z-10">

          {/* Main heading */}

          <h2
            className={`mb-4 text-center font-bold tracking-[0.18em] ${headingSize}`}
          >
            {templateHeading}
          </h2>

          {/* Compact metadata */}

          <HeaderInformation compact />

          {/* Assignment title */}

          <h3
            className={`mb-5 mt-5 text-center font-bold ${titleSize}`}
          >
            {data.title || "Assignment Title"}
          </h3>

          {/* Content */}

          <WritingArea
            paperStyle={data.paperStyle}
            content={
              data.content ||
              "Your assignment content will appear here as you type."
            }
            fontSizeClass={bodySize}
          />

        </div>

        <Footer />

      </div>
    );
  }

  /* ==========================================================
     PROJECT REPORT
  ========================================================== */

  if (data.template === "project-report") {

    return (
      <div
        className={`relative overflow-hidden bg-white text-slate-900 shadow-2xl ${paperClass}`}
        style={pageStyle}
      >

        <div className="relative z-10 flex h-full flex-col items-center text-center">

          <div className="mt-8">

            <h2
              className={`font-bold tracking-widest ${headingSize}`}
            >
              {templateHeading}
            </h2>

            <div className="mx-auto mt-3 h-1 w-16 bg-slate-900" />

          </div>

          <div className="mt-12">

            <p className="text-xs uppercase tracking-widest text-slate-500">
              Project Title
            </p>

            <h3
              className={`mt-3 font-bold ${titleSize}`}
            >
              {data.title || "Project Title"}
            </h3>

          </div>

          <div
            className={`mt-12 space-y-3 ${bodySize}`}
          >

            <p className="font-semibold">
              Submitted By
            </p>

            {data.showName && (
              <p>
                {data.studentName || "Student Name"}
              </p>
            )}

            {data.showRollNumber && (
              <p>
                {data.rollNumber || "Roll Number"}
              </p>
            )}

            {data.showClass && (
              <p>
                {data.className || "Class"}
              </p>
            )}

            {data.showSection && (
              <p>
                {data.section || "Section"}
              </p>
            )}

            {data.showTeacher && (
              <>
                <p className="pt-5 font-semibold">
                  Submitted To
                </p>

                <p>
                  {data.teacherName || "Professor"}
                </p>
              </>
            )}

          </div>

        </div>

        <Footer />

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

        <h2
          className={`mb-5 text-center font-bold tracking-widest ${headingSize}`}
        >
          {templateHeading}
        </h2>

        <HeaderInformation compact />

        <h3
          className={`mb-5 mt-6 text-center font-bold ${titleSize}`}
        >
          {data.title || "Homework"}
        </h3>

        <WritingArea
          paperStyle={data.paperStyle}
          content={
            data.content ||
            "Your homework content will appear here as you type."
          }
          fontSizeClass={bodySize}
        />

      </div>

      <Footer />

    </div>
  );
}

export default AssignmentPage;