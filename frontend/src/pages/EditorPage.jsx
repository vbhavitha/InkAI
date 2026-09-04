import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import CustomImage from "../components/editor/CustomImage";
import { TableKit } from "@tiptap/extension-table";

import PageBreakExtension from "../components/editor/PageBreakExtension";
import useAutoSave from "../hooks/useAutoSave";
import useKeyboardShortcuts from "../hooks/useKeyboardShortcuts";

import {
  Save,
  MoreHorizontal,
  FileText,
  Edit3,
  Type,
  Plus,
  Wrench,
  ChevronDown,
} from "lucide-react";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

import RichTextEditor from "../components/editor/RichTextEditor";
import EditorToolbar from "../components/editor/EditorToolbar";
import WordCount from "../components/editor/WordCount";
import FindReplace from "../components/editor/FindReplace";
import AutosaveIndicator from "../components/editor/AutosaveIndicator";


function EditorPage() {
  const location = useLocation();
  const navigate = useNavigate();

  /*
   * =========================================================
   * OCR DATA
   * =========================================================
   */

  const ocrResult = location.state?.ocrResult;

  const ocrWords = ocrResult?.words || [];

  const initialText =
    ocrResult?.full_text ||
    location.state?.text ||
    "";


  /*
   * =========================================================
   * DOCUMENT TITLE
   * =========================================================
   */

  const [documentTitle, setDocumentTitle] = useState(
    location.state?.fileName ||
      "Untitled Document"
  );


  /*
   * =========================================================
   * FIND & REPLACE
   * =========================================================
   */

  const [findReplaceOpen, setFindReplaceOpen] =
    useState(false);


  /*
   * =========================================================
   * TIPTAP EDITOR
   *
   * The editor is created here so that:
   *
   * EditorToolbar
   * RichTextEditor
   * WordCount
   * AutoSave
   *
   * all use the same editor instance.
   * =========================================================
   */

  const editor = useEditor({
    extensions: [
      /*
       * Basic editor functionality
       */
      StarterKit,

      /*
       * Text alignment
       */
      TextAlign.configure({
        types: [
          "heading",
          "paragraph",
        ],
      }),

      /*
       * Images
       */
      CustomImage.configure({
        allowBase64: true,

        resize: {
          enabled: true,

          directions: [
            "top",
            "bottom",
            "left",
            "right",
          ],

          minWidth: 50,

          minHeight: 50,

          alwaysPreserveAspectRatio: true,
        },
      }),

      /*
       * Tables
       */
      TableKit.configure({
        table: {
          resizable: true,
        },
      }),

      /*
       * Page breaks
       */
      PageBreakExtension,
    ],

    /*
     * Initial OCR text
     */
    content: initialText
      ? createInitialContent(initialText)
      : "<p></p>",

    /*
     * Editor configuration
     */
    editorProps: {
      attributes: {
        class:
          "inkai-editor-content outline-none text-slate-900 text-base leading-7",

        /*
         * Browser/native spell checking
         */
        spellcheck: "true",
      },
    },
  });


  /*
   * =========================================================
   * AUTO SAVE
   * =========================================================
   */

  const {
    saveStatus,
    lastSavedAt,
    saveNow,
  } = useAutoSave({
    editor,

    documentId:
      location.state?.fileId ||
      ocrResult?.file_id ||
      "default",

    documentTitle,
  });
  useKeyboardShortcuts({
    editor,
    onFind: () => setFindReplaceOpen(true),
    onSave: () => saveNow(),
  });


  /*
   * =========================================================
   * OCR DATA WARNING
   * =========================================================
   */

  useEffect(() => {
    if (
      !ocrResult &&
      !location.state?.text
    ) {
      console.warn(
        "No OCR document data was provided."
      );
    }
  }, [
    ocrResult,
    location.state,
  ]);


  /*
   * =========================================================
   * MANUAL SAVE
   * =========================================================
   */

  const handleSave = () => {
    if (!editor) {
      return;
    }

    saveNow();
  };


  /*
   * =========================================================
   * BACK TO OCR RESULTS
   * =========================================================
   */

  const handleBack = () => {
    navigate("/ocr-results", {
      state: location.state,
    });
  };


  /*
   * =========================================================
   * SAVE STATUS UI
   * =========================================================
   */

  const renderSaveStatus = () => {
    if (saveStatus === "saving") {
      return (
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <span
            className="
              w-2
              h-2
              rounded-full
              bg-yellow-400
              animate-pulse
            "
          />

          <span>
            Saving...
          </span>
        </div>
      );
    }

    if (saveStatus === "offline") {
      return (
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <span className="text-yellow-400">
            ⚠
          </span>

          <span>
            Changes saved locally
          </span>
        </div>
      );
    }

    if (saveStatus === "error") {
      return (
        <div className="flex items-center gap-2 text-sm text-red-400">
          <span>
            ⚠
          </span>

          <span>
            Save failed
          </span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <span className="text-green-400">
          ✓
        </span>

        <span>
          Saved
        </span>
      </div>
    );
  };


  /*
   * =========================================================
   * RENDER
   * =========================================================
   */

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">

      {/* =====================================================
          NAVBAR
      ====================================================== */}

      <Navbar />


      {/* =====================================================
          EDITOR HEADER
      ====================================================== */}

      <header className="border-b border-slate-800 bg-slate-950">

        <div className="max-w-[1600px] mx-auto px-4 sm:px-6">

          <div className="h-16 flex items-center justify-between">

            {/* =================================================
                LEFT
            ================================================== */}

            <div className="flex items-center gap-4">

              <button
                type="button"
                onClick={handleBack}
                className="
                  flex
                  items-center
                  gap-2
                  text-slate-300
                  hover:text-white
                  transition
                "
              >
                <FileText size={20} />

                <span className="font-semibold">
                  InkAI
                </span>
              </button>


              <div className="h-6 w-px bg-slate-700" />


              {/* DOCUMENT TITLE */}

              <input
                type="text"
                value={documentTitle}
                onChange={(event) =>
                  setDocumentTitle(
                    event.target.value
                  )
                }
                className="
                  bg-transparent
                  border-none
                  outline-none
                  text-sm
                  text-slate-300
                  hover:text-white
                  focus:text-white
                  min-w-[180px]
                "
                aria-label="Document title"
              />

            </div>

            <AutosaveIndicator
              status={saveStatus}
              lastSavedAt={lastSavedAt}
            />


            {/* =================================================
                RIGHT
            ================================================== */}

            <div className="flex items-center gap-3">

              {/* SAVE STATUS */}

              {renderSaveStatus()}


              {/* MANUAL SAVE */}

              <button
                type="button"
                onClick={handleSave}
                disabled={!editor}
                className="
                  flex
                  items-center
                  gap-2
                  px-4
                  py-2
                  rounded-lg
                  bg-indigo-600
                  hover:bg-indigo-500
                  disabled:opacity-50
                  disabled:cursor-not-allowed
                  text-white
                  text-sm
                  font-medium
                  transition
                "
              >
                <Save size={16} />

                Save
              </button>


              {/* MORE */}

              <button
                type="button"
                className="
                  p-2
                  rounded-lg
                  hover:bg-slate-800
                  text-slate-400
                  hover:text-white
                  transition
                "
                title="More options"
              >
                <MoreHorizontal size={20} />
              </button>

            </div>

          </div>

        </div>

      </header>


      {/* =====================================================
          MENU BAR
      ====================================================== */}

      <div className="border-b border-slate-800 bg-slate-900">

        <div className="max-w-[1600px] mx-auto px-4 sm:px-6">

          <div className="h-11 flex items-center gap-1">

            <EditorMenuButton
              icon={<FileText size={15} />}
              label="File"
            />

            <EditorMenuButton
              icon={<Edit3 size={15} />}
              label="Edit"
            />

            <EditorMenuButton
              icon={<Type size={15} />}
              label="Format"
            />

            <EditorMenuButton
              icon={<Plus size={15} />}
              label="Insert"
            />

            <EditorMenuButton
              icon={<Wrench size={15} />}
              label="Tools"
            />

          </div>

        </div>

      </div>


      {/* =====================================================
          EDITOR TOOLBAR
      ====================================================== */}

      <div className="border-b border-slate-800 bg-slate-900">

        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 relative">

          <EditorToolbar
            editor={editor}
            ocrWords={ocrWords}
            onFindReplace={() =>
              setFindReplaceOpen(
                (open) => !open
              )
            }
          />


          {/* FIND & REPLACE */}

          {findReplaceOpen && (
            <FindReplace
              editor={editor}
              onClose={() =>
                setFindReplaceOpen(false)
              }
            />
          )}

        </div>

      </div>


      {/* =====================================================
          EDITOR WORKSPACE
      ====================================================== */}

      <main className="flex-1 bg-slate-800">

        <div
          className="
            max-w-[1600px]
            mx-auto
            min-h-[calc(100vh-210px)]
            flex
            justify-center
            px-4
            py-10
            overflow-x-auto
          "
        >

          {/* =================================================
              A4 PAGE
          ================================================== */}

          <div className="inkai-editor-container">

            <div className="inkai-a4-page">

              <RichTextEditor
                editor={editor}
              />

            </div>

          </div>

        </div>

      </main>


      {/* =====================================================
          STATUS BAR
      ====================================================== */}

      <div className="border-t border-slate-800 bg-slate-950">

        <div
          className="
            max-w-[1600px]
            mx-auto
            px-6
            h-10
            flex
            items-center
            justify-between
            text-xs
            text-slate-400
          "
        >

          {/* WORD COUNT */}

          <WordCount
            editor={editor}
          />


          {/* DOCUMENT INFO */}

          <div className="flex items-center gap-5">

            <span>
              Page 1
            </span>

            <span>
              A4
            </span>

            <span>
              English
            </span>

          </div>

        </div>

      </div>


      {/* =====================================================
          FOOTER
      ====================================================== */}

      <Footer />

    </div>
  );
}


/*
 * ============================================================
 * MENU BUTTON
 * ============================================================
 */

function EditorMenuButton({
  icon,
  label,
}) {
  return (
    <button
      type="button"
      className="
        flex
        items-center
        gap-1.5
        px-3
        py-2
        rounded-md
        text-sm
        text-slate-300
        hover:text-white
        hover:bg-slate-800
        transition
      "
    >
      {icon}

      <span>
        {label}
      </span>

      <ChevronDown size={13} />
    </button>
  );
}


/*
 * ============================================================
 * OCR TEXT → HTML
 * ============================================================
 */

function createInitialContent(text) {
  const safeText = escapeHtml(text);

  const paragraphs = safeText
    .split(/\n\s*\n/)
    .map((paragraph) =>
      paragraph.trim()
    )
    .filter(Boolean);

  if (paragraphs.length === 0) {
    return "<p></p>";
  }

  return paragraphs
    .map(
      (paragraph) =>
        `<p>${paragraph.replace(
          /\n/g,
          "<br>"
        )}</p>`
    )
    .join("");
}


/*
 * ============================================================
 * HTML ESCAPE
 * ============================================================
 */

function escapeHtml(text) {
  return String(text)
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    );
}


export default EditorPage;