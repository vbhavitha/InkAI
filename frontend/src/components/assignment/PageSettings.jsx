import React from "react";

const PAPER_SIZES = [
  {
    id: "A4",
    name: "A4",
  },
  {
    id: "Letter",
    name: "Letter",
  },
  {
    id: "A5",
    name: "A5",
  },
];

const ORIENTATIONS = [
  {
    id: "portrait",
    name: "Portrait",
  },
  {
    id: "landscape",
    name: "Landscape",
  },
];

const MARGIN_PRESETS = [
  {
    id: "normal",
    name: "Normal",
    top: 56,
    right: 50,
    bottom: 56,
    left: 50,
  },
  {
    id: "narrow",
    name: "Narrow",
    top: 36,
    right: 36,
    bottom: 36,
    left: 36,
  },
  {
    id: "wide",
    name: "Wide",
    top: 72,
    right: 65,
    bottom: 72,
    left: 65,
  },
  {
    id: "custom",
    name: "Custom",
    top: 56,
    right: 50,
    bottom: 56,
    left: 50,
  },
];

function PageSettings({
  paperSize = "A4",
  orientation = "portrait",
  marginPreset = "normal",
  customMargins = {
    top: 56,
    right: 50,
    bottom: 56,
    left: 50,
  },
  onPaperSizeChange,
  onOrientationChange,
  onMarginPresetChange,
  onCustomMarginsChange,
}) {
  const updateCustomMargin = (side, value) => {
    onCustomMarginsChange({
      ...customMargins,
      [side]: Number(value),
    });
  };

  return (
    <details className="group rounded-xl border border-white/10 bg-slate-800/40">
      <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-100">
            Page Settings
          </h3>

          <p className="mt-0.5 text-xs text-slate-400">
            Configure paper size, orientation and margins.
          </p>
        </div>

        <span className="text-slate-400 transition-transform group-open:rotate-180">
          ▾
        </span>
      </summary>

      <div className="space-y-5 border-t border-white/10 p-4">
        {/* Paper Size */}
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-200">
            Paper Size
          </label>

          <select
            value={paperSize}
            onChange={(e) => onPaperSizeChange(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-slate-900/70 px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-indigo-400"
          >
            {PAPER_SIZES.map((size) => (
              <option
                key={size.id}
                value={size.id}
                className="bg-slate-900"
              >
                {size.name}
              </option>
            ))}
          </select>
        </div>

        {/* Orientation */}
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-200">
            Orientation
          </label>

          <select
            value={orientation}
            onChange={(e) => onOrientationChange(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-slate-900/70 px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-indigo-400"
          >
            {ORIENTATIONS.map((item) => (
              <option
                key={item.id}
                value={item.id}
                className="bg-slate-900"
              >
                {item.name}
              </option>
            ))}
          </select>
        </div>

        {/* Margins */}
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-200">
            Margins
          </label>

          <select
            value={marginPreset}
            onChange={(e) =>
              onMarginPresetChange(e.target.value)
            }
            className="w-full rounded-lg border border-white/10 bg-slate-900/70 px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-indigo-400"
          >
            {MARGIN_PRESETS.map((margin) => (
              <option
                key={margin.id}
                value={margin.id}
                className="bg-slate-900"
              >
                {margin.name}
              </option>
            ))}
          </select>
        </div>

        {/* Custom Margin Controls */}
        {marginPreset === "custom" && (
          <div className="grid grid-cols-2 gap-3">
            {[
              ["top", "Top"],
              ["right", "Right"],
              ["bottom", "Bottom"],
              ["left", "Left"],
            ].map(([side, label]) => (
              <div key={side}>
                <label className="mb-1.5 block text-xs text-slate-400">
                  {label}
                </label>

                <input
                  type="number"
                  min="0"
                  value={customMargins[side]}
                  onChange={(e) =>
                    updateCustomMargin(side, e.target.value)
                  }
                  className="w-full rounded-lg border border-white/10 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 outline-none focus:border-indigo-400"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </details>
  );
}

export {
  PAPER_SIZES,
  ORIENTATIONS,
  MARGIN_PRESETS,
};

export default PageSettings;