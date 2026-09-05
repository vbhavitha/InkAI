import React from "react";
import { PenLine } from "lucide-react";

const DEFAULT_STYLES = [
  {
    id: "neat_student",
    name: "Neat Student",
    description: "Clean and readable student handwriting",
  },
  {
    id: "school_notebook",
    name: "School Notebook",
    description: "Natural handwriting suitable for school notes",
  },
  {
    id: "cursive",
    name: "Cursive",
    description: "Flowing and elegant handwritten style",
  },
  {
    id: "casual_handwriting",
    name: "Casual Handwriting",
    description: "Relaxed and informal handwritten style",
  },
  {
    id: "messy_notes",
    name: "Messy Notes",
    description: "Loose and slightly irregular note-taking style",
  },
  {
    id: "pencil_writing",
    name: "Pencil Writing",
    description: "Soft notebook-style handwriting",
  },
];

function FontSelector({
  styles = DEFAULT_STYLES,
  selectedStyle,
  onStyleChange,
}) {
  return (
    <div className="w-full">
      <div className="mb-3">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
          Handwriting Style
        </h2>

        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Choose how your document should look.
        </p>
      </div>

      <div className="space-y-2">
        {styles.map((style) => {
          const isSelected = selectedStyle === style.id;

          return (
            <button
              key={style.id}
              type="button"
              onClick={() => onStyleChange?.(style.id)}
              className={`group flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all ${
                isSelected
                  ? "border-indigo-500 bg-indigo-50 shadow-sm dark:border-indigo-400 dark:bg-indigo-950/40"
                  : "border-gray-200 bg-white hover:border-indigo-300 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-indigo-500 dark:hover:bg-gray-800"
              }`}
              aria-pressed={isSelected}
            >
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                  isSelected
                    ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/60 dark:text-indigo-300"
                    : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                }`}
              >
                <PenLine size={18} />
              </span>

              <span className="min-w-0 flex-1">
                <span
                  className={`block text-sm font-medium ${
                    isSelected
                      ? "text-indigo-700 dark:text-indigo-300"
                      : "text-gray-800 dark:text-gray-100"
                  }`}
                >
                  {style.name}
                </span>

                <span className="mt-0.5 block truncate text-xs text-gray-500 dark:text-gray-400">
                  {style.description}
                </span>
              </span>

              {isSelected && (
                <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-300">
                  Selected
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default FontSelector;