import { useEffect, useState } from "react";

import {
  Bold,
  Italic,
  Underline,
  Undo2,
  Redo2,
  ChevronDown,
  List,
  ListOrdered,
  Search,
} from "lucide-react";

import AITools from "./AITools";
import ImageInsert from "./ImageInsert";
import TableInsert from "./TableInsert";
import PageBreak from "./PageBreak";

function EditorToolbar({
  editor,
  onFindReplace,
}) {
  const [, forceUpdate] = useState(0);

  const [headingMenuOpen, setHeadingMenuOpen] =
    useState(false);

  /*
   * =========================================================
   * UPDATE TOOLBAR
   * =========================================================
   */

  useEffect(() => {
    if (!editor) {
      return;
    }

    const updateToolbar = () => {
      forceUpdate((value) => value + 1);
    };

    editor.on("selectionUpdate", updateToolbar);
    editor.on("transaction", updateToolbar);

    return () => {
      editor.off("selectionUpdate", updateToolbar);
      editor.off("transaction", updateToolbar);
    };
  }, [editor]);

  /*
   * =========================================================
   * EDITOR CHECK
   * =========================================================
   */

  if (!editor) {
    return (
      <div className="h-12 bg-slate-900" />
    );
  }

  /*
   * =========================================================
   * HEADING
   * =========================================================
   */

  const getCurrentHeading = () => {
    if (
      editor.isActive("heading", {
        level: 1,
      })
    ) {
      return "Heading 1";
    }

    if (
      editor.isActive("heading", {
        level: 2,
      })
    ) {
      return "Heading 2";
    }

    if (
      editor.isActive("heading", {
        level: 3,
      })
    ) {
      return "Heading 3";
    }

    return "Normal";
  };

  const setNormal = (event) => {
    event.preventDefault();

    editor
      .chain()
      .focus()
      .setParagraph()
      .run();

    setHeadingMenuOpen(false);
  };

  const setHeading = (level, event) => {
    event.preventDefault();

    editor
      .chain()
      .focus()
      .toggleHeading({
        level,
      })
      .run();

    setHeadingMenuOpen(false);
  };

  /*
   * =========================================================
   * BOLD
   * =========================================================
   */

  const handleBold = (event) => {
    event.preventDefault();

    editor
      .chain()
      .focus()
      .toggleBold()
      .run();
  };

  /*
   * =========================================================
   * ITALIC
   * =========================================================
   */

  const handleItalic = (event) => {
    event.preventDefault();

    editor
      .chain()
      .focus()
      .toggleItalic()
      .run();
  };

  /*
   * =========================================================
   * UNDERLINE
   * =========================================================
   */

  const handleUnderline = (event) => {
    event.preventDefault();

    editor
      .chain()
      .focus()
      .toggleUnderline()
      .run();
  };

  /*
   * =========================================================
   * BULLET LIST
   * =========================================================
   */

  const handleBulletList = (event) => {
    event.preventDefault();

    editor
      .chain()
      .focus()
      .toggleBulletList()
      .run();
  };

  /*
   * =========================================================
   * NUMBERED LIST
   * =========================================================
   */

  const handleOrderedList = (event) => {
    event.preventDefault();

    editor
      .chain()
      .focus()
      .toggleOrderedList()
      .run();
  };

  /*
   * =========================================================
   * UNDO
   * =========================================================
   */

  const handleUndo = (event) => {
    event.preventDefault();

    editor
      .chain()
      .focus()
      .undo()
      .run();
  };

  /*
   * =========================================================
   * REDO
   * =========================================================
   */

  const handleRedo = (event) => {
    event.preventDefault();

    editor
      .chain()
      .focus()
      .redo()
      .run();
  };

  /*
   * =========================================================
   * RENDER
   * =========================================================
   */

  return (
    <div className="flex items-center gap-1 p-2 bg-slate-900">

      {/* =====================================================
          HEADING DROPDOWN
      ====================================================== */}

      <div className="relative">

        <button
          type="button"
          title="Text style"
          onMouseDown={(event) => {
            event.preventDefault();

            setHeadingMenuOpen(
              (open) => !open
            );
          }}
          className="
            flex
            items-center
            gap-1
            h-9
            px-3
            rounded-md
            text-sm
            text-slate-300
            hover:bg-slate-800
            hover:text-white
            transition
          "
        >
          <span>
            {getCurrentHeading()}
          </span>

          <ChevronDown size={14} />
        </button>

        {headingMenuOpen && (
          <div
            className="
              absolute
              left-0
              top-full
              mt-1
              z-50
              w-40
              rounded-lg
              border
              border-slate-700
              bg-slate-900
              shadow-xl
              overflow-hidden
            "
          >

            {/* NORMAL */}

            <button
              type="button"
              onMouseDown={setNormal}
              className="
                block
                w-full
                px-4
                py-2
                text-left
                text-sm
                text-slate-300
                hover:bg-slate-800
                hover:text-white
              "
            >
              Normal
            </button>

            {/* HEADING 1 */}

            <button
              type="button"
              onMouseDown={(event) =>
                setHeading(1, event)
              }
              className="
                block
                w-full
                px-4
                py-2
                text-left
                text-lg
                font-bold
                text-slate-200
                hover:bg-slate-800
              "
            >
              Heading 1
            </button>

            {/* HEADING 2 */}

            <button
              type="button"
              onMouseDown={(event) =>
                setHeading(2, event)
              }
              className="
                block
                w-full
                px-4
                py-2
                text-left
                text-base
                font-semibold
                text-slate-200
                hover:bg-slate-800
              "
            >
              Heading 2
            </button>

            {/* HEADING 3 */}

            <button
              type="button"
              onMouseDown={(event) =>
                setHeading(3, event)
              }
              className="
                block
                w-full
                px-4
                py-2
                text-left
                text-sm
                font-semibold
                text-slate-200
                hover:bg-slate-800
              "
            >
              Heading 3
            </button>

          </div>
        )}

      </div>

      {/* SEPARATOR */}

      <div className="w-px h-6 bg-slate-700 mx-1" />

      {/* =====================================================
          BOLD
      ====================================================== */}

      <button
        type="button"
        title="Bold"
        onMouseDown={handleBold}
        className={`
          flex
          items-center
          justify-center
          w-9
          h-9
          rounded-md
          transition
          ${
            editor.isActive("bold")
              ? "bg-indigo-600 text-white"
              : "text-slate-300 hover:bg-slate-800"
          }
        `}
      >
        <Bold size={18} />
      </button>

      {/* =====================================================
          ITALIC
      ====================================================== */}

      <button
        type="button"
        title="Italic"
        onMouseDown={handleItalic}
        className={`
          flex
          items-center
          justify-center
          w-9
          h-9
          rounded-md
          transition
          ${
            editor.isActive("italic")
              ? "bg-indigo-600 text-white"
              : "text-slate-300 hover:bg-slate-800"
          }
        `}
      >
        <Italic size={18} />
      </button>

      {/* =====================================================
          UNDERLINE
      ====================================================== */}

      <button
        type="button"
        title="Underline"
        onMouseDown={handleUnderline}
        className={`
          flex
          items-center
          justify-center
          w-9
          h-9
          rounded-md
          transition
          ${
            editor.isActive("underline")
              ? "bg-indigo-600 text-white"
              : "text-slate-300 hover:bg-slate-800"
          }
        `}
      >
        <Underline size={18} />
      </button>

      {/* SEPARATOR */}

      <div className="w-px h-6 bg-slate-700 mx-2" />

      {/* =====================================================
          BULLET LIST
      ====================================================== */}

      <button
        type="button"
        title="Bullet list"
        onMouseDown={handleBulletList}
        className={`
          flex
          items-center
          justify-center
          w-9
          h-9
          rounded-md
          transition
          ${
            editor.isActive("bulletList")
              ? "bg-indigo-600 text-white"
              : "text-slate-300 hover:bg-slate-800"
          }
        `}
      >
        <List size={18} />
      </button>

      {/* =====================================================
          NUMBERED LIST
      ====================================================== */}

      <button
        type="button"
        title="Numbered list"
        onMouseDown={handleOrderedList}
        className={`
          flex
          items-center
          justify-center
          w-9
          h-9
          rounded-md
          transition
          ${
            editor.isActive("orderedList")
              ? "bg-indigo-600 text-white"
              : "text-slate-300 hover:bg-slate-800"
          }
        `}
      >
        <ListOrdered size={18} />
      </button>

      {/* SEPARATOR */}

      <div className="w-px h-6 bg-slate-700 mx-2" />

      {/* =====================================================
          UNDO
      ====================================================== */}

      <button
        type="button"
        title="Undo"
        onMouseDown={handleUndo}
        disabled={!editor.can().undo()}
        className="
          flex
          items-center
          justify-center
          w-9
          h-9
          rounded-md
          text-slate-300
          hover:bg-slate-800
          disabled:opacity-30
          disabled:cursor-not-allowed
          transition
        "
      >
        <Undo2 size={18} />
      </button>

      {/* =====================================================
          REDO
      ====================================================== */}

      <button
        type="button"
        title="Redo"
        onMouseDown={handleRedo}
        disabled={!editor.can().redo()}
        className="
          flex
          items-center
          justify-center
          w-9
          h-9
          rounded-md
          text-slate-300
          hover:bg-slate-800
          disabled:opacity-30
          disabled:cursor-not-allowed
          transition
        "
      >
        <Redo2 size={18} />
      </button>

      {/* SEPARATOR */}

      <div className="w-px h-6 bg-slate-700 mx-2" />

      {/* =====================================================
          FIND & REPLACE
      ====================================================== */}

      <button
        type="button"
        title="Find and Replace"
        onMouseDown={(event) => {
          event.preventDefault();

          if (onFindReplace) {
            onFindReplace();
          }
        }}
        className="
          flex
          items-center
          justify-center
          w-9
          h-9
          rounded-md
          text-slate-300
          hover:bg-slate-800
          transition
        "
      >
        <Search size={18} />
      </button>

      {/* SEPARATOR */}

      <div className="w-px h-6 bg-slate-700 mx-2" />

      {/* =====================================================
          INSERT IMAGE
      ====================================================== */}

      <ImageInsert editor={editor} />

      {/* =====================================================
          INSERT TABLE
      ====================================================== */}

      <TableInsert editor={editor} />

      {/* PAGE BREAK */}

      <PageBreak editor={editor} />

      {/* =====================================================
          AI TOOLS
      ====================================================== */}

      <AITools editor={editor} />

    </div>
  );
}

export default EditorToolbar;