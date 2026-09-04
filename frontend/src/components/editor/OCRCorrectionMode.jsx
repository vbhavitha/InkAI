import { useMemo, useState } from "react";

const LOW_CONFIDENCE_THRESHOLD = 0.75;

function OCRCorrectionMode({
  editor,
  words = [],
}) {
  const [enabled, setEnabled] = useState(false);
  const [selectedWord, setSelectedWord] = useState(null);
  const [suggestions, setSuggestions] = useState([]);

  const lowConfidenceWords = useMemo(() => {
    return words.filter(
      (word) =>
        typeof word.confidence === "number" &&
        word.confidence < LOW_CONFIDENCE_THRESHOLD
    );
  }, [words]);

  const findWordInEditor = (word) => {
    if (!editor || !word?.text) return null;

    const text = editor.state.doc.textContent;
    const index = text.indexOf(word.text);

    if (index === -1) return null;

    return {
      from: index + 1,
      to: index + 1 + word.text.length,
    };
  };

  const generateSuggestions = (word) => {
    /*
     * Initial version:
     * Provide simple OCR correction suggestions.
     *
     * Later this can call an AI correction endpoint.
     */

    const text = word.text?.toLowerCase();

    const dictionary = {
      proce55: ["process", "proceeds"],
      phot0synthesis: ["photosynthesis"],
      chl0rophyll: ["chlorophyll"],
      resp1ration: ["respiration"],
      c0nvert: ["convert"],
      ener9y: ["energy"],
    };

    return dictionary[text] || [];
  };

  const selectWord = (word) => {
    if (!editor) return;

    const range = findWordInEditor(word);

    if (!range) {
      console.warn("OCR word not found in editor:", word.text);
      return;
    }

    editor
      .chain()
      .focus()
      .setTextSelection({
        from: range.from,
        to: range.to,
      })
      .run();

    setSelectedWord(word);
    setSuggestions(generateSuggestions(word));
  };

  const replaceWord = (replacement) => {
    if (!editor || !selectedWord) return;

    const range = findWordInEditor(selectedWord);

    if (!range) return;

    editor
      .chain()
      .focus()
      .setTextSelection({
        from: range.from,
        to: range.to,
      })
      .insertContent(replacement)
      .run();

    setSelectedWord(null);
    setSuggestions([]);
  };

  if (!enabled) {
    return (
      <button
        type="button"
        onClick={() => setEnabled(true)}
        className="inkai-toolbar-button"
        title="Enable OCR correction mode"
      >
        ⚠ OCR
      </button>
    );
  }

  return (
    <div className="inkai-ocr-correction-container">
      <button
        type="button"
        onClick={() => {
          setEnabled(false);
          setSelectedWord(null);
          setSuggestions([]);
        }}
        className="inkai-toolbar-button active"
        title="Disable OCR correction mode"
      >
        ⚠ OCR
      </button>

      <div className="inkai-ocr-count">
        {lowConfidenceWords.length} review
      </div>

      {selectedWord && (
        <div className="inkai-ocr-popup">
          <div className="inkai-ocr-popup-header">
            <strong>OCR Confidence</strong>

            <button
              type="button"
              onClick={() => {
                setSelectedWord(null);
                setSuggestions([]);
              }}
            >
              ×
            </button>
          </div>

          <div className="inkai-ocr-confidence">
            {Math.round(selectedWord.confidence * 100)}%
          </div>

          <div className="inkai-ocr-original-label">
            Original recognition
          </div>

          <div className="inkai-ocr-original">
            {selectedWord.text}
          </div>

          <div className="inkai-ocr-suggestions-label">
            Suggestions
          </div>

          {suggestions.length > 0 ? (
            <div className="inkai-ocr-suggestions">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => replaceWord(suggestion)}
                  className="inkai-ocr-suggestion"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          ) : (
            <div className="inkai-ocr-no-suggestions">
              No suggestions available.
            </div>
          )}

          <button
            type="button"
            className="inkai-ocr-ignore"
            onClick={() => {
              setSelectedWord(null);
              setSuggestions([]);
            }}
          >
            Ignore
          </button>
        </div>
      )}
    </div>
  );
}

export default OCRCorrectionMode;