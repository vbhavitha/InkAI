import React from "react";
import { SlidersHorizontal } from "lucide-react";


function SliderControl({
  label,
  value,
  min,
  max,
  step,
  onChange,
  suffix = "",
}) {
  return (
    <div className="space-y-2">

      <div className="flex items-center justify-between">

        <label className="text-sm font-medium text-slate-700">
          {label}
        </label>

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
        onChange={(event) =>
          onChange(Number(event.target.value))
        }
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
        </span>

        <span>
          {max}
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
        />


        {/* INK OPACITY */}

        <SliderControl
          label="Ink Opacity"
          value={Math.round(inkOpacity * 100)}
          min={30}
          max={100}
          step={1}
          suffix="%"
          onChange={(value) =>
            setInkOpacity(value / 100)
          }
        />


        {/* =================================================
            NATURAL VARIATION
            ================================================= */}

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
              Add subtle character irregularities.
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
                setNaturalVariation(
                  event.target.checked
                )
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

      </div>

    </div>
  );
}


export default HandwritingControls;