import React from "react";
import { Dices, SlidersHorizontal } from "lucide-react";

function SliderControl({
  label,
  value,
  min,
  max,
  step,
  onChange,
  suffix = "",
  description,
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <label className="text-sm font-medium text-slate-700">
            {label}
          </label>

          {description && (
            <p className="mt-0.5 text-[11px] text-slate-400">
              {description}
            </p>
          )}
        </div>

        <span className="text-xs font-medium text-slate-500">
          {value}
          {suffix}
        </span>
      </div>

      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="
          h-1.5
          w-full
          cursor-pointer
          appearance-none
          rounded-lg
          bg-slate-200
          accent-indigo-600
        "
      />

      <div className="flex justify-between text-[10px] text-slate-400">
        <span>
          {min}
          {suffix}
        </span>

        <span>
          {max}
          {suffix}
        </span>
      </div>
    </div>
  );
}

function HandwritingControls({
  fontSize,
  setFontSize,

  letterSpacing,
  setLetterSpacing,

  lineSpacing,
  setLineSpacing,

  wordSpacing,
  setWordSpacing,

  inkOpacity,
  setInkOpacity,

  naturalVariation,
  setNaturalVariation,

  naturalness = 50,
  setNaturalness,

  onRandomize,
  randomSeed,
}) {
  return (
    <div
      className="
        rounded-xl
        border
        border-slate-200
        bg-white
        p-6
        shadow-sm
      "
    >
      {/* =====================================================
          HEADER
          ===================================================== */}

      <div className="mb-6 flex items-center gap-3">
        <div
          className="
            flex
            h-9
            w-9
            items-center
            justify-center
            rounded-lg
            bg-indigo-50
          "
        >
          <SlidersHorizontal
            size={18}
            className="text-indigo-600"
          />
        </div>

        <div>
          <h3 className="text-sm font-semibold text-slate-900">
            Handwriting Controls
          </h3>

          <p className="text-xs text-slate-500">
            Fine-tune the handwritten appearance.
          </p>
        </div>
      </div>

      {/* =====================================================
          SLIDERS
          ===================================================== */}

      <div className="space-y-6">
        {/* FONT SIZE */}

        <SliderControl
          label="Font Size"
          value={fontSize}
          min={14}
          max={40}
          step={1}
          suffix=" px"
          onChange={setFontSize}
          description="Controls the handwriting size."
        />

        {/* LETTER SPACING */}

        <SliderControl
          label="Letter Spacing"
          value={letterSpacing}
          min={-2}
          max={8}
          step={0.5}
          suffix=" px"
          onChange={setLetterSpacing}
          description="Space between individual characters."
        />

        {/* LINE SPACING */}

        <SliderControl
          label="Line Spacing"
          value={lineSpacing}
          min={1}
          max={2.5}
          step={0.1}
          suffix="×"
          onChange={setLineSpacing}
          description="Vertical distance between lines."
        />

        {/* WORD SPACING */}

        <SliderControl
          label="Word Spacing"
          value={wordSpacing}
          min={0}
          max={20}
          step={1}
          suffix=" px"
          onChange={setWordSpacing}
          description="Additional space between words."
        />

        {/* INK OPACITY */}

        <SliderControl
          label="Ink Opacity"
          value={Math.round(inkOpacity * 100)}
          min={30}
          max={100}
          step={1}
          suffix="%"
          onChange={(value) => setInkOpacity(value / 100)}
          description="Controls how dark the handwriting appears."
        />

        {/* =====================================================
            NATURALNESS
            ===================================================== */}

        <div className="space-y-3">
          <SliderControl
            label="Naturalness"
            value={naturalness}
            min={0}
            max={100}
            step={1}
            suffix="%"
            onChange={setNaturalness}
            description="Controls realistic handwriting imperfections."
          />

          <div className="flex justify-between text-[10px] text-slate-400">
            <span>Perfectly uniform</span>
            <span>Highly natural</span>
          </div>
        </div>

        {/* =====================================================
            NATURAL VARIATION TOGGLE
            ===================================================== */}

        <div
          className="
            flex
            items-center
            justify-between
            rounded-xl
            border
            border-slate-200
            bg-slate-50
            p-4
          "
        >
          <div>
            <p className="text-sm font-medium text-slate-800">
              Natural Variation
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Enable character-level handwriting variation.
            </p>
          </div>

          <label
            className="
              relative
              inline-flex
              cursor-pointer
              items-center
            "
          >
            <input
              type="checkbox"
              checked={naturalVariation}
              onChange={(event) =>
                setNaturalVariation(event.target.checked)
              }
              className="peer sr-only"
            />

            <div
              className="
                h-6
                w-11
                rounded-full
                bg-slate-300
                transition
                peer-checked:bg-indigo-600
              "
            >
              <div
                className="
                  absolute
                  left-[3px]
                  top-[3px]
                  h-5
                  w-5
                  rounded-full
                  bg-white
                  shadow-sm
                  transition
                  peer-checked:translate-x-5
                "
              />
            </div>
          </label>
        </div>

        {/* =====================================================
            RANDOMIZE
            ===================================================== */}

        <div
          className="
            rounded-xl
            border
            border-indigo-100
            bg-indigo-50/60
            p-4
          "
        >
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-800">
                Randomize Handwriting
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                Generate a new handwriting variation without changing
                your text or settings.
              </p>

              {randomSeed !== undefined && (
                <p className="mt-2 truncate font-mono text-[10px] text-slate-400">
                  Seed: {randomSeed}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={onRandomize}
              disabled={!onRandomize}
              className="
                flex
                shrink-0
                items-center
                gap-2
                rounded-lg
                bg-indigo-600
                px-4
                py-2.5
                text-xs
                font-semibold
                text-white
                shadow-sm
                transition
                hover:bg-indigo-700
                active:scale-[0.98]
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              <Dices size={15} />

              Randomize
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HandwritingControls;