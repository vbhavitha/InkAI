import React from "react";

function SectionTitle({ title, description }) {
  return (
    <div className="mb-4">
      <h3 className="text-sm font-semibold text-white">
        {title}
      </h3>
      {description ? (
        <p className="mt-1 text-xs text-slate-500">
          {description}
        </p>
      ) : null}
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  label,
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4">
      <span className="text-sm text-slate-300">
        {label}
      </span>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 rounded-full transition ${
          checked
            ? "bg-indigo-600"
            : "bg-slate-600"
        }`}
      >
        <span
          className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition ${
            checked
              ? "left-6"
              : "left-1"
          }`}
        />
      </button>
    </label>
  );
}

export default function PageSettings({
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

  headerEnabled = false,
  headerText = "",
  headerPosition = "center",

  onHeaderEnabledChange,
  onHeaderTextChange,
  onHeaderPositionChange,

  showFooter = true,
  footerText = "InkAI",
  footerPosition = "center",

  onShowFooterChange,
  onFooterTextChange,
  onFooterPositionChange,

  showPageNumber = true,
  pageNumberPosition = "center",
  pageNumberShowTotal = false,

  onShowPageNumberChange,
  onPageNumberPositionChange,
  onPageNumberShowTotalChange,
}) {
  const updateMargin = (key, value) => {
    onCustomMarginsChange?.({
      ...customMargins,
      [key]: Number(value),
    });
  };

  return (
    <div className="space-y-4">
      {/* =====================================================
          PAGE SIZE
      ====================================================== */}
      <div className="rounded-xl border border-white/10 bg-slate-800/40 p-5">
        <SectionTitle
          title="Page Settings"
          description="Choose the PDF page size, orientation and margins."
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-xs text-slate-400">
              Page Size
            </label>

            <select
              value={paperSize}
              onChange={(event) =>
                onPaperSizeChange?.(
                  event.target.value
                )
              }
              className="w-full rounded-lg border border-white/10 bg-slate-800 px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-500"
            >
              <option value="A4">
                A4
              </option>
              <option value="Letter">
                Letter
              </option>
              <option value="Legal">
                Legal
              </option>
              <option value="A5">
                A5
              </option>
              <option value="Custom">
                Custom
              </option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-xs text-slate-400">
              Orientation
            </label>

            <select
              value={orientation}
              onChange={(event) =>
                onOrientationChange?.(
                  event.target.value
                )
              }
              className="w-full rounded-lg border border-white/10 bg-slate-800 px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-500"
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

        <div className="mt-4">
          <label className="mb-2 block text-xs text-slate-400">
            Margins
          </label>

          <select
            value={marginPreset}
            onChange={(event) =>
              onMarginPresetChange?.(
                event.target.value
              )
            }
            className="w-full rounded-lg border border-white/10 bg-slate-800 px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-500"
          >
            <option value="normal">
              Normal
            </option>
            <option value="narrow">
              Narrow
            </option>
            <option value="wide">
              Wide
            </option>
            <option value="custom">
              Custom
            </option>
          </select>
        </div>

        {marginPreset === "custom" ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {[
              ["top", "Top"],
              ["right", "Right"],
              ["bottom", "Bottom"],
              ["left", "Left"],
            ].map(([key, label]) => (
              <label
                key={key}
                className="block"
              >
                <span className="mb-2 block text-xs text-slate-400">
                  {label}
                </span>

                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={
                      customMargins?.[key] ??
                      0
                    }
                    onChange={(event) =>
                      updateMargin(
                        key,
                        event.target.value
                      )
                    }
                    className="w-full rounded-lg border border-white/10 bg-slate-800 px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-500"
                  />

                  <span className="text-xs text-slate-500">
                    pt
                  </span>
                </div>
              </label>
            ))}
          </div>
        ) : null}
      </div>

      {/* =====================================================
          STEP 10 — HEADER
      ====================================================== */}
      <div className="rounded-xl border border-white/10 bg-slate-800/40 p-5">
        <SectionTitle
          title="Header"
          description="Display an optional assignment header on every PDF page."
        />

        <Toggle
          checked={headerEnabled}
          onChange={
            onHeaderEnabledChange ||
            (() => {})
          }
          label="Enable Header"
        />

        {headerEnabled ? (
          <div className="mt-4 space-y-4">
            <div>
              <label className="mb-2 block text-xs text-slate-400">
                Header Text
              </label>

              <textarea
                rows={2}
                value={headerText}
                onChange={(event) =>
                  onHeaderTextChange?.(
                    event.target.value
                  )
                }
                placeholder="Computer Networks Assignment"
                className="w-full resize-none rounded-lg border border-white/10 bg-slate-800 px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs text-slate-400">
                Position
              </label>

              <select
                value={headerPosition}
                onChange={(event) =>
                  onHeaderPositionChange?.(
                    event.target.value
                  )
                }
                className="w-full rounded-lg border border-white/10 bg-slate-800 px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-500"
              >
                <option value="left">
                  Left
                </option>
                <option value="center">
                  Center
                </option>
                <option value="right">
                  Right
                </option>
              </select>
            </div>
          </div>
        ) : null}
      </div>

      {/* =====================================================
          STEP 11 — FOOTER
      ====================================================== */}
      <div className="rounded-xl border border-white/10 bg-slate-800/40 p-5">
        <SectionTitle
          title="Footer"
          description="Display optional footer text on every PDF page."
        />

        <Toggle
          checked={showFooter}
          onChange={
            onShowFooterChange ||
            (() => {})
          }
          label="Enable Footer"
        />

        {showFooter ? (
          <div className="mt-4 space-y-4">
            <div>
              <label className="mb-2 block text-xs text-slate-400">
                Footer Text
              </label>

              <input
                type="text"
                value={footerText}
                onChange={(event) =>
                  onFooterTextChange?.(
                    event.target.value
                  )
                }
                placeholder="InkAI — Assignment"
                className="w-full rounded-lg border border-white/10 bg-slate-800 px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs text-slate-400">
                Position
              </label>

              <select
                value={footerPosition}
                onChange={(event) =>
                  onFooterPositionChange?.(
                    event.target.value
                  )
                }
                className="w-full rounded-lg border border-white/10 bg-slate-800 px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-500"
              >
                <option value="left">
                  Left
                </option>
                <option value="center">
                  Center
                </option>
                <option value="right">
                  Right
                </option>
              </select>
            </div>
          </div>
        ) : null}
      </div>

      {/* =====================================================
          STEP 12 — PAGE NUMBERS
      ====================================================== */}
      <div className="rounded-xl border border-white/10 bg-slate-800/40 p-5">
        <SectionTitle
          title="Page Numbers"
          description="Configure page numbering independently from footer text."
        />

        <Toggle
          checked={showPageNumber}
          onChange={
            onShowPageNumberChange ||
            (() => {})
          }
          label="Enable Page Numbers"
        />

        {showPageNumber ? (
          <div className="mt-4 space-y-4">
            <div>
              <label className="mb-2 block text-xs text-slate-400">
                Position
              </label>

              <select
                value={pageNumberPosition}
                onChange={(event) =>
                  onPageNumberPositionChange?.(
                    event.target.value
                  )
                }
                className="w-full rounded-lg border border-white/10 bg-slate-800 px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-500"
              >
                <option value="left">
                  Bottom Left
                </option>
                <option value="center">
                  Bottom Center
                </option>
                <option value="right">
                  Bottom Right
                </option>
              </select>
            </div>

            <Toggle
              checked={pageNumberShowTotal}
              onChange={
                onPageNumberShowTotalChange ||
                (() => {})
              }
              label="Show Total Pages (Page 1 of 5)"
            />

            <div className="rounded-lg border border-white/10 bg-black/10 px-3 py-2.5 text-xs text-slate-500">
              {pageNumberShowTotal
                ? "Example: Page 1 of 5"
                : "Example: Page 1"}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
