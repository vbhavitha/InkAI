import React from "react";
import {
  FileText,
  Minus,
  NotebookPen,
  Grid3X3,
  BookOpen,
} from "lucide-react";

export const PAPER_STYLES = [
  {
    id: "plain",
    name: "Plain Paper",
    description: "Clean white paper without writing lines",
    icon: FileText,
    lineHeight: 28,
    baselineOffset: 22,
    topMargin: 48,
    leftMargin: 50,
    showHorizontalLines: false,
    showVerticalMargin: false,
  },
  {
    id: "ruled",
    name: "Ruled Notebook",
    description: "Standard horizontal writing lines",
    icon: Minus,
    lineHeight: 28,
    baselineOffset: 22,
    topMargin: 48,
    leftMargin: 50,
    showHorizontalLines: true,
    showVerticalMargin: false,
  },
  {
    id: "college",
    name: "College Notebook",
    description: "Ruled paper with a notebook margin",
    icon: NotebookPen,
    lineHeight: 28,
    baselineOffset: 22,
    topMargin: 48,
    leftMargin: 70,
    showHorizontalLines: true,
    showVerticalMargin: true,
  },
  {
    id: "graph",
    name: "Graph Paper",
    description: "Grid paper for mathematical and technical work",
    icon: Grid3X3,
    lineHeight: 20,
    baselineOffset: 16,
    topMargin: 40,
    leftMargin: 50,
    showHorizontalLines: true,
    showVerticalMargin: false,
    gridSize: 20,
  },
  {
    id: "margin",
    name: "Margin Notebook",
    description: "Ruled notebook with a wider writing margin",
    icon: BookOpen,
    lineHeight: 28,
    baselineOffset: 22,
    topMargin: 48,
    leftMargin: 82,
    showHorizontalLines: true,
    showVerticalMargin: true,
  },
];

const MARGIN_OPTIONS = [
  {
    id: "none",
    name: "None",
    width: 0,
  },
  {
    id: "normal",
    name: "Normal",
    width: 55,
  },
  {
    id: "wide",
    name: "Wide",
    width: 80,
  },
];

function PaperSelector({
  selectedPaper = "ruled",
  onPaperChange,
  selectedMargin = "normal",
  onMarginChange,
}) {
  const selectedPaperData =
    PAPER_STYLES.find((paper) => paper.id === selectedPaper) ||
    PAPER_STYLES[1];

  const SelectedIcon = selectedPaperData.icon;

  const isNotebookMode = [
    "ruled",
    "college",
    "margin",
  ].includes(selectedPaper);

  return (
    <div className="space-y-4">
      {/* Paper Style */}
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-200">
          Paper Style
        </label>

        <div className="relative">
          <SelectedIcon
            size={18}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <select
            value={selectedPaper}
            onChange={(e) => onPaperChange(e.target.value)}
            className="w-full appearance-none rounded-lg border border-white/10 bg-slate-900/70 px-10 py-2.5 text-sm text-slate-100 outline-none transition focus:border-indigo-400"
          >
            {PAPER_STYLES.map((paper) => (
              <option
                key={paper.id}
                value={paper.id}
                className="bg-slate-900"
              >
                {paper.name}
              </option>
            ))}
          </select>

          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
            ▾
          </span>
        </div>

        <p className="mt-1.5 text-xs text-slate-400">
          {selectedPaperData.description}
        </p>
      </div>

      {/* Notebook Margin */}
      {isNotebookMode && (
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-200">
            Margin
          </label>

          <select
            value={selectedMargin}
            onChange={(e) => onMarginChange(e.target.value)}
            className="w-full appearance-none rounded-lg border border-white/10 bg-slate-900/70 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:border-indigo-400"
          >
            {MARGIN_OPTIONS.map((margin) => (
              <option
                key={margin.id}
                value={margin.id}
                className="bg-slate-900"
              >
                {margin.name}
              </option>
            ))}
          </select>

          <p className="mt-1.5 text-xs text-slate-400">
            Choose the notebook writing margin.
          </p>
        </div>
      )}
    </div>
  );
}

export { MARGIN_OPTIONS };

export default PaperSelector;