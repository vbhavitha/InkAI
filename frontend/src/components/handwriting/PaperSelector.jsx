import React from "react";
import {
  FileText,
  NotebookPen,
  Grid3X3,
  Minus,
} from "lucide-react";

const PAPER_STYLES = [
  {
    id: "plain",
    name: "Plain",
    description: "Clean white paper",
    icon: FileText,
  },
  {
    id: "ruled",
    name: "Ruled",
    description: "Horizontal writing lines",
    icon: Minus,
  },
  {
    id: "notebook",
    name: "Notebook",
    description: "Lines with a left margin",
    icon: NotebookPen,
  },
  {
    id: "graph",
    name: "Graph",
    description: "Grid paper for mathematics",
    icon: Grid3X3,
  },
];

function PaperSelector({
  selectedPaper = "plain",
  onPaperChange,
}) {
  return (
    <div className="w-full">
      <div className="mb-3">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
          Paper Style
        </h2>

        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Choose the paper for your handwritten document.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {PAPER_STYLES.map((paper) => {
          const Icon = paper.icon;
          const isSelected =
            selectedPaper === paper.id;

          return (
            <button
              key={paper.id}
              type="button"
              onClick={() =>
                onPaperChange?.(paper.id)
              }
              aria-pressed={isSelected}
              className={`rounded-xl border p-3 text-left transition-all ${
                isSelected
                  ? "border-indigo-500 bg-indigo-50 shadow-sm dark:border-indigo-400 dark:bg-indigo-950/40"
                  : "border-gray-200 bg-white hover:border-indigo-300 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-indigo-500"
              }`}
            >
              <div
                className={`mb-2 flex h-8 w-8 items-center justify-center rounded-lg ${
                  isSelected
                    ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/60 dark:text-indigo-300"
                    : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                }`}
              >
                <Icon size={17} />
              </div>

              <span
                className={`block text-xs font-semibold ${
                  isSelected
                    ? "text-indigo-700 dark:text-indigo-300"
                    : "text-gray-800 dark:text-gray-100"
                }`}
              >
                {paper.name}
              </span>

              <span className="mt-1 block text-[11px] leading-4 text-gray-500 dark:text-gray-400">
                {paper.description}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export { PAPER_STYLES };

export default PaperSelector;