import React from "react";

const PAGE_SIZES = [
  {
    id: "A4",
    label: "A4",
    description: "210 × 297 mm",
  },
  {
    id: "Letter",
    label: "Letter",
    description: "8.5 × 11 in",
  },
  {
    id: "Legal",
    label: "Legal",
    description: "8.5 × 14 in",
  },
  {
    id: "Custom",
    label: "Custom",
    description: "Set your own size",
  },
];

const MARGIN_PRESETS = [
  {
    id: "normal",
    label: "Normal",
    description: "20 mm",
  },
  {
    id: "narrow",
    label: "Narrow",
    description: "12 mm",
  },
  {
    id: "wide",
    label: "Wide",
    description: "30 mm",
  },
  {
    id: "custom",
    label: "Custom",
    description: "Set individually",
  },
];

function PageSettings({
  paperSize = "A4",
  orientation = "portrait",
  marginPreset = "normal",
  customMargins = {
    top: 20,
    bottom: 20,
    left: 20,
    right: 20,
  },

  onPaperSizeChange,
  onOrientationChange,
  onMarginPresetChange,
  onCustomMarginsChange,
}) {
  const safeMargins = {
    top: customMargins?.top ?? 20,
    bottom: customMargins?.bottom ?? 20,
    left: customMargins?.left ?? 20,
    right: customMargins?.right ?? 20,
  };

  const updateCustomMargin = (field, value) => {
    const numericValue =
      value === ""
        ? ""
        : Number(value);

    onCustomMarginsChange({
      ...safeMargins,
      [field]: numericValue,
    });
  };

  return (
    <div className="rounded-xl border border-white/10 bg-slate-800/40">
      <div className="px-5 py-4">
        <h3 className="text-sm font-semibold text-white">
          Page Settings
        </h3>

        <p className="mt-1 text-xs text-slate-500">
          Configure page size, orientation and margins.
        </p>
      </div>

      <div className="space-y-6 border-t border-white/10 px-5 py-5">

        {/* =====================================================
            PAGE SIZE
        ====================================================== */}

        <div>
          <label className="mb-3 block text-xs font-medium text-slate-400">
            Page Size
          </label>

          <div className="space-y-2">
            {PAGE_SIZES.map((size) => {
              const selected =
                paperSize === size.id;

              return (
                <label
                  key={size.id}
                  className={`
                    flex cursor-pointer items-center
                    justify-between rounded-xl border
                    px-4 py-3 transition
                    ${
                      selected
                        ? "border-indigo-500/60 bg-indigo-500/10"
                        : "border-white/10 bg-slate-900/30 hover:border-white/20"
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="page-size"
                      value={size.id}
                      checked={selected}
                      onChange={() =>
                        onPaperSizeChange(
                          size.id
                        )
                      }
                      className="h-4 w-4 accent-indigo-500"
                    />

                    <div>
                      <div className="text-sm font-medium text-white">
                        {size.label}
                      </div>

                      <div className="mt-0.5 text-xs text-slate-500">
                        {size.description}
                      </div>
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        {/* =====================================================
            CUSTOM PAGE SIZE
        ====================================================== */}

        {paperSize === "Custom" && (
          <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4">
            <div className="mb-3">
              <h4 className="text-xs font-semibold text-white">
                Custom Page Size
              </h4>

              <p className="mt-1 text-xs text-slate-500">
                Enter dimensions in millimetres.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs text-slate-400">
                  Width
                </label>

                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={
                      customMargins?.pageWidthMm ??
                      ""
                    }
                    onChange={(event) => {
                      onCustomMarginsChange({
                        ...safeMargins,
                        pageWidthMm:
                          event.target.value === ""
                            ? ""
                            : Number(
                                event.target.value
                              ),
                      });
                    }}
                    placeholder="210"
                    className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 pr-12 text-sm text-white outline-none focus:border-indigo-500"
                  />

                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">
                    mm
                  </span>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs text-slate-400">
                  Height
                </label>

                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={
                      customMargins?.pageHeightMm ??
                      ""
                    }
                    onChange={(event) => {
                      onCustomMarginsChange({
                        ...safeMargins,
                        pageHeightMm:
                          event.target.value === ""
                            ? ""
                            : Number(
                                event.target.value
                              ),
                      });
                    }}
                    placeholder="297"
                    className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 pr-12 text-sm text-white outline-none focus:border-indigo-500"
                  />

                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">
                    mm
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================
            ORIENTATION
        ====================================================== */}

        <div>
          <label className="mb-3 block text-xs font-medium text-slate-400">
            Orientation
          </label>

          <div className="grid grid-cols-2 gap-3">
            {[
              {
                id: "portrait",
                label: "Portrait",
              },
              {
                id: "landscape",
                label: "Landscape",
              },
            ].map((option) => {
              const selected =
                orientation === option.id;

              return (
                <label
                  key={option.id}
                  className={`
                    flex cursor-pointer items-center
                    gap-3 rounded-xl border px-4 py-3
                    transition
                    ${
                      selected
                        ? "border-indigo-500/60 bg-indigo-500/10"
                        : "border-white/10 bg-slate-900/30 hover:border-white/20"
                    }
                  `}
                >
                  <input
                    type="radio"
                    name="page-orientation"
                    value={option.id}
                    checked={selected}
                    onChange={() =>
                      onOrientationChange(
                        option.id
                      )
                    }
                    className="h-4 w-4 accent-indigo-500"
                  />

                  <span className="text-sm text-white">
                    {option.label}
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        {/* =====================================================
            MARGINS
        ====================================================== */}

        <div>
          <label className="mb-3 block text-xs font-medium text-slate-400">
            Margins
          </label>

          <div className="space-y-2">
            {MARGIN_PRESETS.map((preset) => {
              const selected =
                marginPreset === preset.id;

              return (
                <label
                  key={preset.id}
                  className={`
                    flex cursor-pointer items-center
                    justify-between rounded-xl border
                    px-4 py-3 transition
                    ${
                      selected
                        ? "border-indigo-500/60 bg-indigo-500/10"
                        : "border-white/10 bg-slate-900/30 hover:border-white/20"
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="margin-preset"
                      value={preset.id}
                      checked={selected}
                      onChange={() =>
                        onMarginPresetChange(
                          preset.id
                        )
                      }
                      className="h-4 w-4 accent-indigo-500"
                    />

                    <div>
                      <div className="text-sm font-medium text-white">
                        {preset.label}
                      </div>

                      <div className="mt-0.5 text-xs text-slate-500">
                        {preset.description}
                      </div>
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        {/* =====================================================
            CUSTOM MARGINS
        ====================================================== */}

        {marginPreset === "custom" && (
          <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4">
            <div className="mb-4">
              <h4 className="text-xs font-semibold text-white">
                Custom Margins
              </h4>

              <p className="mt-1 text-xs text-slate-500">
                Enter each margin in millimetres.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                ["top", "Top"],
                ["bottom", "Bottom"],
                ["left", "Left"],
                ["right", "Right"],
              ].map(([field, label]) => (
                <div key={field}>
                  <label className="mb-1.5 block text-xs text-slate-400">
                    {label}
                  </label>

                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={safeMargins[field]}
                      onChange={(event) =>
                        updateCustomMargin(
                          field,
                          event.target.value
                        )
                      }
                      className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 pr-12 text-sm text-white outline-none focus:border-indigo-500"
                    />

                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">
                      mm
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default PageSettings;