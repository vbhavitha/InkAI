import React from "react";

const HANDWRITING_STYLES = [
  {
    id: "school_notebook",
    name: "School Notebook",
    font: "school_notebook",
    paper: "ruled",
    ink: "blue",
    naturalness: 65,
    fontSize: 22,
    lineSpacing: 1.5,
    letterSpacing: 0.5,
    wordSpacing: 5,
    seed: 12345,
  },
  {
    id: "neat_student",
    name: "Neat Student",
    font: "neat_student",
    paper: "ruled",
    ink: "blue",
    naturalness: 50,
    fontSize: 22,
    lineSpacing: 1.5,
    letterSpacing: 0,
    wordSpacing: 4,
    seed: 12345,
  },
  {
    id: "cursive",
    name: "Cursive",
    font: "cursive",
    paper: "plain",
    ink: "black",
    naturalness: 40,
    fontSize: 23,
    lineSpacing: 1.5,
    letterSpacing: 0.5,
    wordSpacing: 5,
    seed: 12345,
  },
  {
    id: "messy_notes",
    name: "Messy Notes",
    font: "casual_handwriting",
    paper: "notebook",
    ink: "blue",
    naturalness: 80,
    fontSize: 22,
    lineSpacing: 1.55,
    letterSpacing: 1,
    wordSpacing: 7,
    seed: 12345,
  },
  {
    id: "pencil",
    name: "Pencil",
    font: "pencil_writing",
    paper: "notebook",
    ink: "pencil",
    naturalness: 55,
    fontSize: 22,
    lineSpacing: 1.5,
    letterSpacing: 0.5,
    wordSpacing: 5,
    seed: 12345,
  },
];

function HandwritingStyleSettings({
  value,
  onChange,
}) {
  const selected =
    HANDWRITING_STYLES.find(
      (style) => style.id === value.style
    ) ||
    HANDWRITING_STYLES[0];

  const updateStyle = (styleId) => {
    const style =
      HANDWRITING_STYLES.find(
        (item) => item.id === styleId
      );

    if (!style) {
      return;
    }

    onChange({
      ...style,
    });
  };

  return (
    <details className="group mt-4 rounded-xl border border-white/10 bg-slate-800/40">
      <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4">
        <div>
          <h3 className="text-sm font-semibold text-white">
            Handwriting Style
          </h3>

          <p className="mt-1 text-xs text-slate-500">
            Configure Phase 7 handwriting rendering.
          </p>
        </div>

        <span className="ml-4 text-xs text-slate-400 transition-transform duration-200 group-open:rotate-180">
          ▼
        </span>
      </summary>

      <div className="border-t border-white/10 px-5 py-5">
        <div className="space-y-4">

          {/* STYLE */}

          <div>
            <label className="mb-2 block text-xs text-slate-400">
              Handwriting Style
            </label>

            <select
              value={selected.id}
              onChange={(event) =>
                updateStyle(
                  event.target.value
                )
              }
              className="w-full rounded-lg border border-white/10 bg-slate-800 px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-500"
            >
              {HANDWRITING_STYLES.map(
                (style) => (
                  <option
                    key={style.id}
                    value={style.id}
                  >
                    {style.name}
                  </option>
                )
              )}
            </select>
          </div>

          {/* INK */}

          <div>
            <label className="mb-2 block text-xs text-slate-400">
              Ink
            </label>

            <select
              value={value.ink}
              onChange={(event) =>
                onChange({
                  ...value,
                  ink:
                    event.target.value,
                })
              }
              className="w-full rounded-lg border border-white/10 bg-slate-800 px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-500"
            >
              <option value="blue">
                Blue
              </option>

              <option value="black">
                Black
              </option>

              <option value="red">
                Red
              </option>

              <option value="pencil">
                Pencil
              </option>
            </select>
          </div>

          {/* PAPER */}

          <div>
            <label className="mb-2 block text-xs text-slate-400">
              Paper
            </label>

            <select
              value={value.paper}
              onChange={(event) =>
                onChange({
                  ...value,
                  paper:
                    event.target.value,
                })
              }
              className="w-full rounded-lg border border-white/10 bg-slate-800 px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-500"
            >
              <option value="plain">
                Plain Paper
              </option>

              <option value="ruled">
                Ruled Notebook
              </option>

              <option value="notebook">
                College Notebook
              </option>

              <option value="graph">
                Graph Paper
              </option>

              <option value="margin">
                Margin Notebook
              </option>
            </select>
          </div>

          {/* NATURALNESS */}

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-xs text-slate-400">
                Naturalness
              </label>

              <span className="text-xs font-medium text-indigo-400">
                {value.naturalness}%
              </span>
            </div>

            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={value.naturalness}
              onChange={(event) =>
                onChange({
                  ...value,
                  naturalness:
                    Number(
                      event.target.value
                    ),
                })
              }
              className="w-full"
            />
          </div>

        </div>
      </div>
    </details>
  );
}

export {
  HANDWRITING_STYLES,
};

export default HandwritingStyleSettings;