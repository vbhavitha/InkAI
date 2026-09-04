import { useEffect, useState } from "react";

function WordCount({ editor }) {
  const [wordCount, setWordCount] = useState(0);
  const [characterCount, setCharacterCount] = useState(0);
  const [characterCountNoSpaces, setCharacterCountNoSpaces] =
    useState(0);

  useEffect(() => {
    if (!editor) {
      return;
    }

    const updateCounts = () => {
      const text = editor.state.doc.textContent || "";

      /*
       * ============================================
       * WORD COUNT
       * ============================================
       */

      const trimmedText = text.trim();

      const words = trimmedText
        ? trimmedText.split(/\s+/).length
        : 0;


      /*
       * ============================================
       * CHARACTER COUNT
       * ============================================
       */

      const characters = text.length;


      /*
       * ============================================
       * CHARACTER COUNT WITHOUT SPACES
       * ============================================
       *
       * Removes:
       * - spaces
       * - tabs
       * - line breaks
       */

      const charactersWithoutSpaces =
        text.replace(/\s/g, "").length;


      /*
       * Update React state
       */

      setWordCount(words);
      setCharacterCount(characters);
      setCharacterCountNoSpaces(
        charactersWithoutSpaces
      );
    };


    /*
     * Calculate immediately when editor loads.
     */

    updateCounts();


    /*
     * Recalculate automatically whenever
     * the document changes.
     */

    editor.on("update", updateCounts);


    /*
     * Cleanup listener when component
     * is removed.
     */

    return () => {
      editor.off("update", updateCounts);
    };
  }, [editor]);


  return (
    <div className="flex items-center gap-5">

      <span>
        Words: {wordCount}
      </span>

      <span>
        Characters: {characterCount}
      </span>

      <span>
        Characters excluding spaces:{" "}
        {characterCountNoSpaces}
      </span>

    </div>
  );
}

export default WordCount;