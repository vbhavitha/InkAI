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
  const selectedFontData =
    handwritingFonts.find((font) => font.id === selectedFont) ||
    handwritingFonts[0];

  const selectedPaperData =
    handwritingPaperStyles.find(
      (paper) => paper.id === selectedPaper
    ) || handwritingPaperStyles[0];

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
          onChange={(event) => setSelectedFont(event.target.value)}
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
            <option key={font.id} value={font.id}>
              {font.name}
            </option>
          ))}
        </select>

        {/* Font preview */}

        {selectedFontData && (
          <div
            className="
              mt-3
              rounded-lg
              border
              border-slate-200
              bg-slate-50
              p-4
            "
          >
            <p className="mb-2 text-[10px] font-medium uppercase tracking-wide text-slate-400">
              Preview
            </p>

            <p
              className="text-xl text-slate-800"
              style={{
                fontFamily: selectedFontData.cssFamily
                  ? selectedFontData.cssFamily
                  : "cursive",
              }}
            >
              The quick brown fox jumps over the lazy dog.
            </p>
          </div>
        )}
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
          onChange={(event) => setSelectedPaper(event.target.value)}
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
            <option key={paper.id} value={paper.id}>
              {paper.name}
            </option>
          ))}
        </select>

        {/* Paper preview */}

        {selectedPaperData && (
          <div
            className={`
              relative
              mt-3
              h-20
              overflow-hidden
              rounded-lg
              border
              border-slate-200
              bg-white
              ${getPaperPreviewClass(selectedPaperData.id)}
            `}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="rounded bg-white/70 px-2 py-1 text-xs text-slate-500">
                {selectedPaperData.name}
              </span>
            </div>
          </div>
        )}
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

/**
 * Small visual preview for paper styles.
 *
 * This is only a UI preview.
 * The actual paper rendering is handled by HandwritingCanvas.
 */
function getPaperPreviewClass(paperId) {
  switch (paperId) {
    case "ruled":
      return `
        bg-[repeating-linear-gradient(
          to_bottom,
          #ffffff 0px,
          #ffffff 23px,
          #dbeafe 24px,
          #ffffff 25px
        )]
      `;

    case "notebook":
      return `
        bg-[repeating-linear-gradient(
          to_bottom,
          #fdfcf8 0px,
          #fdfcf8 23px,
          #bfdbfe 24px,
          #fdfcf8 25px
        )]
      `;

    case "graph":
      return `
        bg-[linear-gradient(
          #e2e8f0 1px,
          transparent 1px
        ),
        linear-gradient(
          90deg,
          #e2e8f0 1px,
          transparent 1px
        )]
        bg-[size:12px_12px]
      `;

    case "plain":
    default:
      return "bg-[#fffef9]";
  }
}

export default HandwritingSettings;