import React from "react";

const TITLE_ALIGNMENTS = [
  {
    id: "left",
    name: "Left",
  },
  {
    id: "center",
    name: "Center",
  },
  {
    id: "right",
    name: "Right",
  },
];

function TitleSettings({
  titleAlignment = "center",
  onTitleAlignmentChange,
}) {
  return (
    <details className="group mt-4 rounded-xl border border-white/10 bg-slate-800/40">

      <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4">

        <div>
          <h3 className="text-sm font-semibold text-white">
            Title Formatting
          </h3>

          <p className="mt-1 text-xs text-slate-500">
            Configure the assignment title alignment.
          </p>
        </div>

        <span className="ml-4 text-xs text-slate-400 transition-transform duration-200 group-open:rotate-180">
          ▼
        </span>

      </summary>

      <div className="border-t border-white/10 px-5 py-5">

        <label className="mb-2 block text-sm font-medium text-slate-300">
          Title Alignment
        </label>

        <select
          value={titleAlignment}
          onChange={(event) =>
            onTitleAlignmentChange(event.target.value)
          }
          className="w-full rounded-lg border border-white/10 bg-slate-800 px-4 py-3 text-sm text-white outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30"
        >

          {TITLE_ALIGNMENTS.map((alignment) => (
            <option
              key={alignment.id}
              value={alignment.id}
            >
              {alignment.name}
            </option>
          ))}

        </select>

      </div>

    </details>
  );
}

export {
  TITLE_ALIGNMENTS,
};

export default TitleSettings;