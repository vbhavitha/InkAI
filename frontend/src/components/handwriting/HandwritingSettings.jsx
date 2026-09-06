import handwritingFonts from "../../data/handwritingFonts";
import handwritingPaperStyles from "../../data/handwritingPaper";
import InkSelector from "./InkSelector";

function HandwritingSettings({
  selectedFont,
  setSelectedFont,
  selectedPaper,
  setSelectedPaper,
  selectedInk,
  setSelectedInk,
}) {
  return (
    <div className="space-y-6">

      {/* =====================================================
          FONT
          ===================================================== */}

      <div>
        <label
          htmlFor="handwriting-font"
          className="block text-sm font-medium text-slate-700"
        >
          Handwriting Font
        </label>

        <select
          id="handwriting-font"
          value={selectedFont}
          onChange={(event) =>
            setSelectedFont(event.target.value)
          }
          className="
            mt-2
            w-full
            rounded-lg
            border
            border-slate-300
            bg-white
            px-3
            py-2
            text-sm
            outline-none
            transition
            focus:border-indigo-500
            focus:ring-1
            focus:ring-indigo-500
          "
        >
          {handwritingFonts.map((font) => (
            <option
              key={font.id}
              value={font.id}
            >
              {font.name}
            </option>
          ))}
        </select>
      </div>


      {/* =====================================================
          PAPER
          ===================================================== */}

      <div>
        <label
          htmlFor="handwriting-paper"
          className="block text-sm font-medium text-slate-700"
        >
          Paper Style
        </label>

        <select
          id="handwriting-paper"
          value={selectedPaper}
          onChange={(event) =>
            setSelectedPaper(event.target.value)
          }
          className="
            mt-2
            w-full
            rounded-lg
            border
            border-slate-300
            bg-white
            px-3
            py-2
            text-sm
            outline-none
            transition
            focus:border-indigo-500
            focus:ring-1
            focus:ring-indigo-500
          "
        >
          {handwritingPaperStyles.map((paper) => (
            <option
              key={paper.id}
              value={paper.id}
            >
              {paper.name}
            </option>
          ))}
        </select>
      </div>


      {/* =====================================================
          INK
          ===================================================== */}

      <div>
        <InkSelector
          selectedInk={selectedInk}
          onInkChange={setSelectedInk}
        />
      </div>

    </div>
  );
}

export default HandwritingSettings;