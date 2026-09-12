import { useState } from "react";
import useAI from "../../hooks/useAI";
import AIResult from "./AIResult";

export default function GrammarTool({
  text = "",
}) {
  const [input, setInput] = useState(text);

  const {
    grammarCorrect,
    loading,
    error,
    result,
  } = useAI();

  async function handleCorrect() {
    if (!input.trim()) return;

    await grammarCorrect(input);
  }

  return (
    <div className="space-y-4">
      <textarea
        value={input}
        onChange={(event) =>
          setInput(event.target.value)
        }
        placeholder="Enter your notes..."
        className="min-h-40 w-full rounded-xl border p-4"
      />

      <button
        type="button"
        onClick={handleCorrect}
        disabled={loading || !input.trim()}
        className="rounded-lg border px-4 py-2"
      >
        {loading
          ? "Correcting..."
          : "Correct Grammar"}
      </button>

      <AIResult
        result={result}
        loading={loading}
        error={error}
      />
    </div>
  );
}