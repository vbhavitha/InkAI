import { useMemo, useState } from "react";

const DEFAULT_ASSIGNMENT = {
  studentName: "",
  rollNumber: "",
  subject: "",
  title: "",
  date: new Date().toISOString().split("T")[0],
  teacherName: "",

  template: "college-assignment",
  paperStyle: "ruled",

  paperSize: "A4",
  orientation: "portrait",

  showName: true,
  showRollNumber: true,
  showSubject: true,
  showDate: true,
  showTeacher: false,

  showFooter: true,
  showPageNumber: true,

  content: "",
};

const TEMPLATES = [
  {
    id: "school-notebook",
    name: "School Notebook",
    description: "Simple notebook-style assignment",
  },
  {
    id: "college-assignment",
    name: "College Assignment",
    description: "Clean academic assignment format",
  },
  {
    id: "project-report",
    name: "Project Report",
    description: "Structured project/report layout",
  },
  {
    id: "simple-homework",
    name: "Simple Homework",
    description: "Minimal homework format",
  },
];

const PAPER_STYLES = [
  {
    id: "ruled",
    name: "Ruled",
  },
  {
    id: "plain",
    name: "Plain",
  },
  {
    id: "graph",
    name: "Graph",
  },
  {
    id: "margin",
    name: "Margin",
  },
];

/**
 * Convert browser date format (YYYY-MM-DD)
 * into assignment display format (DD/MM/YYYY).
 */
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

function AssignmentPage() {
  const [assignment, setAssignment] = useState(DEFAULT_ASSIGNMENT);

  const updateAssignment = (field, value) => {
    setAssignment((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const previewData = useMemo(() => {
    return {
      ...assignment,

      template:
        TEMPLATES.find(
          (template) => template.id === assignment.template
        ) || TEMPLATES[1],

      paper:
        PAPER_STYLES.find(
          (paper) => paper.id === assignment.paperStyle
        ) || PAPER_STYLES[0],
    };
  }, [assignment]);

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* =====================================================
          HEADER
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
            ASSIGNMENT SETUP
        ==================================================== */}

        <section className="rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-xl">

          <div className="mb-6">

            <h2 className="text-lg font-semibold">
              Assignment Setup
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Enter assignment details and choose your
              document style.
            </p>

          </div>

          <div className="space-y-5">

            {/* =================================================
                STUDENT INFORMATION
            ================================================== */}

            <div>

              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-300">
                Student Information
              </h3>

              <div className="grid gap-4 sm:grid-cols-2">

                {/* Student Name */}

                <div>

                  <label className="mb-2 block text-sm text-slate-300">
                    Student Name
                  </label>

                  <input
                    type="text"
                    value={assignment.studentName}
                    onChange={(event) =>
                      updateAssignment(
                        "studentName",
                        event.target.value
                      )
                    }
                    placeholder="Enter student name"
                    className="w-full rounded-lg border border-white/10 bg-slate-800 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500"
                  />

                </div>

                {/* Roll Number */}

                <div>

                  <label className="mb-2 block text-sm text-slate-300">
                    Roll Number
                  </label>

                  <input
                    type="text"
                    value={assignment.rollNumber}
                    onChange={(event) =>
                      updateAssignment(
                        "rollNumber",
                        event.target.value
                      )
                    }
                    placeholder="Enter roll number"
                    className="w-full rounded-lg border border-white/10 bg-slate-800 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500"
                  />

                </div>

                {/* Subject */}

                <div>

                  <label className="mb-2 block text-sm text-slate-300">
                    Subject
                  </label>

                  <input
                    type="text"
                    value={assignment.subject}
                    onChange={(event) =>
                      updateAssignment(
                        "subject",
                        event.target.value
                      )
                    }
                    placeholder="Enter subject"
                    className="w-full rounded-lg border border-white/10 bg-slate-800 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500"
                  />

                </div>

                {/* Date */}

                <div>

                  <label className="mb-2 block text-sm text-slate-300">
                    Date
                  </label>

                  <input
                    type="date"
                    value={assignment.date}
                    onChange={(event) =>
                      updateAssignment(
                        "date",
                        event.target.value
                      )
                    }
                    className="w-full rounded-lg border border-white/10 bg-slate-800 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500"
                  />

                </div>

              </div>

            </div>

            {/* =================================================
                ASSIGNMENT DETAILS
            ================================================== */}

            <div>

              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-300">
                Assignment Details
              </h3>

              <div className="space-y-4">

                {/* Title */}

                <div>

                  <label className="mb-2 block text-sm text-slate-300">
                    Title
                  </label>

                  <input
                    type="text"
                    value={assignment.title}
                    onChange={(event) =>
                      updateAssignment(
                        "title",
                        event.target.value
                      )
                    }
                    placeholder="Enter assignment title"
                    className="w-full rounded-lg border border-white/10 bg-slate-800 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500"
                  />

                </div>

                {/* Content */}

                <div>

                  <label className="mb-2 block text-sm text-slate-300">
                    Content
                  </label>

                  <textarea
                    value={assignment.content}
                    onChange={(event) =>
                      updateAssignment(
                        "content",
                        event.target.value
                      )
                    }
                    placeholder="Type your assignment content here..."
                    rows={8}
                    className="w-full resize-y rounded-lg border border-white/10 bg-slate-800 px-3 py-3 text-sm leading-6 outline-none transition focus:border-indigo-500"
                  />

                </div>

              </div>

            </div>

            {/* =================================================
                ASSIGNMENT TEMPLATE
            ================================================== */}

            <div>

              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-300">
                Assignment Template
              </h3>

              <select
                value={assignment.template}
                onChange={(event) =>
                  updateAssignment(
                    "template",
                    event.target.value
                  )
                }
                className="w-full rounded-lg border border-white/10 bg-slate-800 px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
              >

                {TEMPLATES.map((template) => (
                  <option
                    key={template.id}
                    value={template.id}
                  >
                    {template.name}
                  </option>
                ))}

              </select>

            </div>

            {/* =================================================
                PAPER STYLE
            ================================================== */}

            <div>

              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-300">
                Paper Style
              </h3>

              <div className="grid grid-cols-2 gap-3">

                {PAPER_STYLES.map((paper) => {

                  const selected =
                    assignment.paperStyle === paper.id;

                  return (
                    <button
                      key={paper.id}
                      type="button"
                      onClick={() =>
                        updateAssignment(
                          "paperStyle",
                          paper.id
                        )
                      }
                      className={`rounded-lg border px-4 py-3 text-left text-sm transition ${
                        selected
                          ? "border-indigo-500 bg-indigo-500/10 text-white"
                          : "border-white/10 bg-slate-800 text-slate-300 hover:border-white/20"
                      }`}
                    >
                      {paper.name}
                    </button>
                  );

                })}

              </div>

            </div>

            {/* =================================================
                PAGE SETTINGS
            ================================================== */}

            <div>

              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-300">
                Page Settings
              </h3>

              <div className="grid gap-4 sm:grid-cols-2">

                {/* Paper Size */}

                <div>

                  <label className="mb-2 block text-sm text-slate-300">
                    Paper Size
                  </label>

                  <select
                    value={assignment.paperSize}
                    onChange={(event) =>
                      updateAssignment(
                        "paperSize",
                        event.target.value
                      )
                    }
                    className="w-full rounded-lg border border-white/10 bg-slate-800 px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
                  >

                    <option value="A4">
                      A4
                    </option>

                    <option value="A5">
                      A5
                    </option>

                    <option value="LETTER">
                      Letter
                    </option>

                  </select>

                </div>

                {/* Orientation */}

                <div>

                  <label className="mb-2 block text-sm text-slate-300">
                    Orientation
                  </label>

                  <select
                    value={assignment.orientation}
                    onChange={(event) =>
                      updateAssignment(
                        "orientation",
                        event.target.value
                      )
                    }
                    className="w-full rounded-lg border border-white/10 bg-slate-800 px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
                  >

                    <option value="portrait">
                      Portrait
                    </option>

                    <option value="landscape">
                      Landscape
                    </option>

                  </select>

                </div>

              </div>

            </div>

            {/* =================================================
                HEADER FIELDS
            ================================================== */}

            <div>

              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-300">
                Header Fields
              </h3>

              <div className="grid gap-3 sm:grid-cols-2">

                {[
                  ["showName", "Student Name"],
                  ["showRollNumber", "Roll Number"],
                  ["showSubject", "Subject"],
                  ["showDate", "Date"],
                  ["showTeacher", "Teacher"],
                  ["showPageNumber", "Page Number"],
                ].map(([field, label]) => (

                  <label
                    key={field}
                    className="flex items-center gap-3 rounded-lg border border-white/10 bg-slate-800 px-3 py-3 text-sm text-slate-300"
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
                      className="h-4 w-4 rounded"
                    />

                    {label}

                  </label>

                ))}

              </div>

            </div>

            {/* =================================================
                FOOTER
            ================================================== */}

            <label className="flex items-center gap-3 rounded-lg border border-white/10 bg-slate-800 px-3 py-3 text-sm text-slate-300">

              <input
                type="checkbox"
                checked={assignment.showFooter}
                onChange={(event) =>
                  updateAssignment(
                    "showFooter",
                    event.target.checked
                  )
                }
                className="h-4 w-4 rounded"
              />

              Show Footer

            </label>

          </div>

        </section>

        {/* ===================================================
            LIVE PREVIEW
        ==================================================== */}

        <section className="rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-xl">

          <div className="mb-6">

            <h2 className="text-lg font-semibold">
              Live Preview
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Preview updates automatically as you change
              assignment settings.
            </p>

          </div>

          <div className="flex min-h-[700px] items-start justify-center overflow-auto rounded-xl bg-slate-800/60 p-6">

            <AssignmentPreview data={previewData} />

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

  return (

    <div
      className={`relative overflow-hidden bg-white text-slate-900 shadow-2xl ${
        isLandscape
          ? "h-[520px] w-[735px]"
          : "min-h-[735px] w-[520px]"
      }`}
    >

      {/* ======================================================
          PAPER BACKGROUND
      ======================================================= */}

      {/* Ruled Paper */}

      {data.paperStyle === "ruled" && (

        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            backgroundImage:
              "repeating-linear-gradient(to bottom, transparent 0px, transparent 27px, #cbd5e1 28px)",
          }}
        />

      )}

      {/* Graph Paper */}

      {data.paperStyle === "graph" && (

        <div
          className="pointer-events-none absolute inset-0 opacity-50"
          style={{
            backgroundImage:
              "linear-gradient(#cbd5e1 1px, transparent 1px), linear-gradient(90deg, #cbd5e1 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        />

      )}

      {/* Margin Paper */}

      {data.paperStyle === "margin" && (

        <div className="pointer-events-none absolute bottom-0 left-14 top-0 border-l border-red-300" />

      )}

      {/* ======================================================
          ASSIGNMENT CONTENT
      ======================================================= */}

      <div className="relative z-10 p-10">

        {/* Assignment Header */}

        <div className="mb-8 border-b border-slate-300 pb-4">

          <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-xs">

            {/* Student Name */}

            {data.showName && (

              <div>

                <span className="font-semibold">
                  Name:
                </span>{" "}

                {data.studentName || "Student Name"}

              </div>

            )}

            {/* Roll Number */}

            {data.showRollNumber && (

              <div>

                <span className="font-semibold">
                  Roll No:
                </span>{" "}

                {data.rollNumber || "________"}

              </div>

            )}

            {/* Subject */}

            {data.showSubject && (

              <div>

                <span className="font-semibold">
                  Subject:
                </span>{" "}

                {data.subject || "Subject"}

              </div>

            )}

            {/* Date */}

            {data.showDate && (

              <div>

                <span className="font-semibold">
                  Date:
                </span>{" "}

                {formatDate(data.date)}

              </div>

            )}

            {/* Teacher */}

            {data.showTeacher && (

              <div>

                <span className="font-semibold">
                  Teacher:
                </span>{" "}

                {data.teacherName || "________"}

              </div>

            )}

          </div>

        </div>

        {/* Assignment Title */}

        <h2 className="mb-8 text-center text-xl font-bold">

          {data.title || "Assignment Title"}

        </h2>

        {/* Assignment Content */}

        <div className="whitespace-pre-wrap text-sm leading-7">

          {data.content ||
            "Your assignment content will appear here as you type."}

        </div>

        {/* ====================================================
            FOOTER
        ===================================================== */}

        {data.showFooter && (

          <div className="absolute bottom-6 left-10 right-10 flex items-center justify-between border-t border-slate-300 pt-2 text-[10px] text-slate-500">

            <span>
              InkAI
            </span>

            {data.showPageNumber && (

              <span>
                Page 1
              </span>

            )}

          </div>

        )}

      </div>

    </div>

  );
}

export default AssignmentPage;