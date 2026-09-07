import React from "react";

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

function AssignmentTemplates({
  selectedTemplate,
  onTemplateChange,
}) {
  const selectedTemplateData =
    TEMPLATES.find(
      (template) =>
        template.id === selectedTemplate
    ) || TEMPLATES[0];

  return (
    <details className="group rounded-xl border border-white/10 bg-slate-800/40">

      {/* =====================================================
          HEADER
      ====================================================== */}

      <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4">

        <div>

          <h3 className="text-sm font-semibold text-white">
            Assignment Template
          </h3>

          <p className="mt-1 text-xs text-slate-500">
            Choose a predefined assignment layout.
          </p>

        </div>

        <span className="ml-4 text-xs text-slate-400 transition-transform duration-200 group-open:rotate-180">
          ▼
        </span>

      </summary>

      {/* =====================================================
          CONTENT
      ====================================================== */}

      <div className="border-t border-white/10 px-5 py-5">

        <label className="mb-2 block text-sm font-medium text-slate-300">
          Template
        </label>

        <div className="relative">

          <select
            value={selectedTemplate}
            onChange={(event) =>
              onTemplateChange(
                event.target.value
              )
            }
            className="w-full appearance-none rounded-lg border border-white/10 bg-slate-800 px-4 py-3 pr-10 text-sm text-white outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30"
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

          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400">
            ▼
          </span>

        </div>

        <div className="mt-2 rounded-lg bg-slate-800/60 px-3 py-2">

          <p className="text-xs text-slate-400">
            {selectedTemplateData.description}
          </p>

        </div>

      </div>

    </details>
  );
}

export { TEMPLATES };

export default AssignmentTemplates;