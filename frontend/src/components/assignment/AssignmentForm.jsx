import React from "react";

function AssignmentForm({ assignment, updateAssignment }) {
  return (
    <details
      open
      className="group rounded-xl border border-white/10 bg-slate-800/40"
    >
      {/* =====================================================
          SECTION HEADER
      ====================================================== */}

      <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4">
        <div>
          <h3 className="text-sm font-semibold text-white">
            Student & Assignment Information
          </h3>

          <p className="mt-1 text-xs text-slate-500">
            Enter the details that will appear on your assignment.
          </p>
        </div>

        <span className="ml-4 text-xs text-slate-400 transition-transform duration-200 group-open:rotate-180">
          ▼
        </span>
      </summary>

      {/* =====================================================
          FORM CONTENT
      ====================================================== */}

      <div className="border-t border-white/10 px-5 py-5">

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
              className="w-full rounded-lg border border-white/10 bg-slate-800 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30"
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
              className="w-full rounded-lg border border-white/10 bg-slate-800 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30"
            />
          </div>

          {/* Class */}

          <div>
            <label className="mb-2 block text-sm text-slate-300">
              Class
            </label>

            <input
              type="text"
              value={assignment.className}
              onChange={(event) =>
                updateAssignment(
                  "className",
                  event.target.value
                )
              }
              placeholder="e.g. B.Tech CSE"
              className="w-full rounded-lg border border-white/10 bg-slate-800 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30"
            />
          </div>

          {/* Section */}

          <div>
            <label className="mb-2 block text-sm text-slate-300">
              Section
            </label>

            <input
              type="text"
              value={assignment.section}
              onChange={(event) =>
                updateAssignment(
                  "section",
                  event.target.value
                )
              }
              placeholder="e.g. A"
              className="w-full rounded-lg border border-white/10 bg-slate-800 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30"
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
              className="w-full rounded-lg border border-white/10 bg-slate-800 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30"
            />
          </div>

          {/* Assignment Title */}

          <div>
            <label className="mb-2 block text-sm text-slate-300">
              Assignment Title
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
              className="w-full rounded-lg border border-white/10 bg-slate-800 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30"
            />
          </div>

          {/* Teacher Name */}

          <div>
            <label className="mb-2 block text-sm text-slate-300">
              Teacher Name
            </label>

            <input
              type="text"
              value={assignment.teacherName}
              onChange={(event) =>
                updateAssignment(
                  "teacherName",
                  event.target.value
                )
              }
              placeholder="Enter teacher name"
              className="w-full rounded-lg border border-white/10 bg-slate-800 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30"
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
              className="w-full rounded-lg border border-white/10 bg-slate-800 px-3 py-2.5 text-sm text-white outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30"
            />

            <p className="mt-1.5 text-xs text-slate-500">
              Displayed as DD/MM/YYYY
            </p>
          </div>
        </div>

        {/* ==================================================
            ASSIGNMENT CONTENT
        =================================================== */}

        <div className="mt-5">

          <label className="mb-2 block text-sm text-slate-300">
            Assignment Content
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
            rows={7}
            className="w-full resize-y rounded-lg border border-white/10 bg-slate-800 px-3 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30"
          />

          <p className="mt-1.5 text-xs text-slate-500">
            Write or paste the content you want to appear
            in the assignment.
          </p>

        </div>
      </div>
    </details>
  );
}

export default AssignmentForm;