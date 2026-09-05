import React from "react";
import {
  Circle,
  Pencil,
} from "lucide-react";

const INK_STYLES = [
  {
    id: "blue",
    name: "Blue",
    description: "Classic blue pen",
    icon: "🔵",

    // Slight variations for future realistic rendering
    colors: [
      "#163A63",
      "#19426F",
      "#1C4778",
      "#204C80",
    ],

    defaultColor: "#19426F",
  },

  {
    id: "black",
    name: "Black",
    description: "Dark black pen",
    icon: "⚫",

    colors: [
      "#202020",
      "#252525",
      "#2A2A2A",
      "#303030",
    ],

    defaultColor: "#252525",
  },

  {
    id: "red",
    name: "Red",
    description: "Red ink",
    icon: "🔴",

    colors: [
      "#8E2525",
      "#972A2A",
      "#A02F2F",
      "#A93434",
    ],

    defaultColor: "#972A2A",
  },

  {
    id: "pencil",
    name: "Pencil",
    description: "Soft graphite writing",
    icon: "✏️",

    colors: [
      "#555555",
      "#5C5C5C",
      "#636363",
      "#696969",
    ],

    defaultColor: "#5C5C5C",
  },
];

function InkSelector({
  selectedInk = "blue",
  onInkChange,
}) {
  return (
    <div className="w-full">
      <div className="mb-3">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
          Ink Color
        </h2>

        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Choose the ink used for handwriting.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {INK_STYLES.map((ink) => {
          const isSelected =
            selectedInk === ink.id;

          return (
            <button
              key={ink.id}
              type="button"
              onClick={() =>
                onInkChange?.(ink.id, ink)
              }
              aria-pressed={isSelected}
              className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-all ${
                isSelected
                  ? "border-indigo-500 bg-indigo-50 shadow-sm dark:border-indigo-400 dark:bg-indigo-950/40"
                  : "border-gray-200 bg-white hover:border-indigo-300 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-indigo-500"
              }`}
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-lg dark:border-gray-700 dark:bg-gray-800"
              >
                {ink.icon}
              </span>

              <span className="min-w-0">
                <span
                  className={`block text-xs font-semibold ${
                    isSelected
                      ? "text-indigo-700 dark:text-indigo-300"
                      : "text-gray-800 dark:text-gray-100"
                  }`}
                >
                  {ink.name}
                </span>

                <span className="mt-1 block truncate text-[11px] text-gray-500 dark:text-gray-400">
                  {ink.description}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function getInkStyle(inkId) {
  return (
    INK_STYLES.find(
      (ink) => ink.id === inkId
    ) || INK_STYLES[0]
  );
}

export {
  INK_STYLES,
  getInkStyle,
};

export default InkSelector;