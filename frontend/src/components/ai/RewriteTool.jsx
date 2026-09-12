import { useState } from "react";
import useAI from "../../hooks/useAI";
import AIResult from "./AIResult";

const styles = [
  "simple",
  "professional",
  "academic",
  "exam_notes",
  "detailed",
  "concise",
];

export default function RewriteTool({
  text = "",
}) {
  const [input, setInput] = useState(text);
  const [style, setStyle] = useState("simple");

  const {
    rewrite,
    loading,
    error,
    result,
  } = useAI();

  async function handleRewrite() {
    if (!input.trim()) return;

    await rewrite(input, style);
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

      <select
        value={style}
        onChange={(event) =>
          setStyle(event.target.value)
        }
        className="rounded-lg border px-3 py-2"
      >
        {styles.map((item) => (
          <option key={item} value={item}>
            {item.replace("_", " ")}
          </option>
        ))}
      </select>

      <button
        type="button"
        onClick={handleRewrite}
        disabled={loading || !input.trim()}
        className="rounded-lg border px-4 py-2"
      >
        {loading ? "Rewriting..." : "Rewrite"}
      </button>

      <AIResult
        result={result}
        loading={loading}
        error={error}
      />
    </div>
  );
}