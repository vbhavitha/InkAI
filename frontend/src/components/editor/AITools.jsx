import { useState } from "react";

import {
  Sparkles,
  ChevronDown,
} from "lucide-react";


function AITools({ editor }) {
  const [open, setOpen] = useState(false);

  const [loading, setLoading] = useState(false);


  const runAI = async (action) => {
    if (!editor) {
      return;
    }

    const { from, to } =
      editor.state.selection;


    if (from === to) {
      alert(
        "Please select some text first."
      );

      return;
    }


    const selectedText =
      editor.state.doc.textBetween(
        from,
        to,
        " "
      );


    if (!selectedText.trim()) {
      return;
    }


    setLoading(true);
    setOpen(false);


    try {
      const response = await fetch(
        "/api/ai/writing",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            action,
            text: selectedText,
          }),
        }
      );


      if (!response.ok) {
        throw new Error(
          "AI request failed."
        );
      }


      const data =
        await response.json();


      /*
       * For now we show the result.
       *
       * Later we'll use the same preview
       * component as Grammar Fix.
       */

      console.log(
        "AI suggestion:",
        data
      );


      alert(
        data.result ||
        data.suggestion ||
        "AI suggestion received."
      );

    } catch (error) {
      console.error(
        "AI writing tool failed:",
        error
      );

      alert(
        "AI tool is currently unavailable."
      );

    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="relative">

      <button
        type="button"
        disabled={loading}
        onMouseDown={(event) => {
          event.preventDefault();

          setOpen(
            (current) => !current
          );
        }}
        className="
          flex
          items-center
          gap-1.5
          h-9
          px-3
          rounded-md
          text-sm
          text-slate-300
          hover:bg-slate-800
          hover:text-white
          disabled:opacity-40
          transition
        "
      >

        <Sparkles size={16} />

        <span>
          {loading
            ? "Working..."
            : "AI Tools"}
        </span>

        <ChevronDown size={14} />

      </button>


      {open && (
        <div
          className="
            absolute
            left-0
            top-full
            mt-1
            z-50
            w-48
            rounded-lg
            border
            border-slate-700
            bg-slate-900
            shadow-xl
            overflow-hidden
          "
        >

          <AIOption
            label="Fix Grammar"
            onClick={() =>
              runAI("grammar")
            }
          />

          <AIOption
            label="Improve Writing"
            onClick={() =>
              runAI("improve")
            }
          />

          <AIOption
            label="Simplify"
            onClick={() =>
              runAI("simplify")
            }
          />

          <AIOption
            label="Expand"
            onClick={() =>
              runAI("expand")
            }
          />

          <AIOption
            label="Summarize"
            onClick={() =>
              runAI("summarize")
            }
          />

          <AIOption
            label="Rewrite"
            onClick={() =>
              runAI("rewrite")
            }
          />

          <AIOption
            label="Translate"
            onClick={() =>
              runAI("translate")
            }
          />

        </div>
      )}

    </div>
  );
}


function AIOption({
  label,
  onClick,
}) {
  return (
    <button
      type="button"
      onMouseDown={(event) => {
        event.preventDefault();

        onClick();
      }}
      className="
        block
        w-full
        px-4
        py-2.5
        text-left
        text-sm
        text-slate-300
        hover:bg-slate-800
        hover:text-white
      "
    >
      {label}
    </button>
  );
}


export default AITools;