import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import {
  useEditor,
} from "@tiptap/react";

import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";

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


function EditorPage() {
  const location = useLocation();
  const navigate = useNavigate();

  /*
   * =========================================================
   * OCR DATA
   * =========================================================
   */

  const ocrResult = location.state?.ocrResult;

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
    location.state?.fileName || "Untitled Document"
  );


  /*
   * =========================================================
   * SAVE STATUS
   * =========================================================
   */

  const [saveStatus, setSaveStatus] = useState("Saved");

  const [findReplaceOpen, setFindReplaceOpen] = useState(false);


  /*
   * =========================================================
   * TIPTAP EDITOR
   *
   * IMPORTANT:
   * The editor is created HERE instead of inside
   * RichTextEditor.
   *
   * This means Toolbar, Editor and WordCount all receive
   * the exact same editor instance.
   * =========================================================
   */

  const editor = useEditor({
    extensions: [
      StarterKit,

      TextAlign.configure({
        types: [
          "heading",
          "paragraph",
        ],
      }),
    ],

    content: initialText
      ? createInitialContent(initialText)
      : "<p></p>",

    editorProps: {
      attributes: {
        class:
          "min-h-[297mm] px-[20mm] py-[20mm] outline-none text-slate-900 text-base leading-7",
      },
    },
  });


  /*
   * =========================================================
   * OCR DATA WARNING
   * =========================================================
   */

  useEffect(() => {
    if (!ocrResult && !location.state?.text) {
      console.warn(
        "No OCR document data was provided."
      );
    }
  }, [ocrResult, location.state]);


  /*
   * =========================================================
   * SAVE
   * =========================================================
   */

  const handleSave = () => {
    if (!editor) {
      return;
    }

    setSaveStatus("Saving...");

    const documentContent = editor.getJSON();

    console.log("Document to save:", {
      title: documentTitle,
      content: documentContent,
    });

    setTimeout(() => {
      setSaveStatus("Saved");
    }, 800);
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


  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">

      <Navbar />


      {/* =====================================================
          EDITOR HEADER
      ====================================================== */}

      <header className="border-b border-slate-800 bg-slate-950">

        <div className="max-w-[1600px] mx-auto px-4 sm:px-6">

          <div className="h-16 flex items-center justify-between">

            {/* LEFT */}

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


              <input
                type="text"
                value={documentTitle}
                onChange={(event) =>
                  setDocumentTitle(event.target.value)
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


            {/* RIGHT */}

            <div className="flex items-center gap-3">

              {/* SAVE STATUS */}

              <div className="flex items-center gap-2 text-sm text-slate-400">

                <span
                  className={`
                    w-2
                    h-2
                    rounded-full
                    ${
                      saveStatus === "Saving..."
                        ? "bg-yellow-400 animate-pulse"
                        : "bg-green-400"
                    }
                  `}
                />

                <span>
                  {saveStatus}
                </span>

              </div>


              {/* SAVE */}

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
            onFindReplace={() =>
              setFindReplaceOpen((open) => !open)
            }
          />

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

          {/* A4 PAGE */}

          <div
            className="
              bg-white
              text-slate-900
              shadow-2xl
              w-[210mm]
              min-h-[297mm]
              shrink-0
              relative
            "
          >

            <RichTextEditor
              editor={editor}
            />

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

          <WordCount
            editor={editor}
          />


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
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  if (paragraphs.length === 0) {
    return "<p></p>";
  }

  return paragraphs
    .map(
      (paragraph) =>
        `<p>${paragraph.replace(/\n/g, "<br>")}</p>`
    )
    .join("");
}


function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


export default EditorPage;