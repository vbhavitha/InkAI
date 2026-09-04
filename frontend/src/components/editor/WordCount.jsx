import { useEffect, useState } from "react";

function WordCount({ editor }) {
  const [words, setWords] = useState(0);
  const [characters, setCharacters] = useState(0);

  useEffect(() => {
    if (!editor) {
      return;
    }

    const updateCount = () => {
      const text = editor.state.doc.textContent || "";

      const trimmed = text.trim();

      const wordCount = trimmed
        ? trimmed.split(/\s+/).length
        : 0;

      setWords(wordCount);
      setCharacters(text.length);
    };

    updateCount();

    editor.on("update", updateCount);

    return () => {
      editor.off("update", updateCount);
    };
  }, [editor]);

  return (
    <div className="flex items-center gap-4">
      <span>
        Words: {words}
      </span>

      <span>
        Characters: {characters}
      </span>
    </div>
  );
}

export default WordCount;