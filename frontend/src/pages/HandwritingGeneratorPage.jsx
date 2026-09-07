import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

import HandwritingSettings from "../components/handwriting/HandwritingSettings";
import HandwritingPreview from "../components/handwriting/HandwritingPreview";
import HandwritingControls from "../components/handwriting/HandwritingControls";

import {
  convertDocumentToHandwritingDocument,
} from "../services/handwritingDocumentService";


/*
 * =========================================================
 * PHASE 7 — HANDWRITING GENERATOR
 * =========================================================
 *
 * Pipeline:
 *
 * TipTap JSON
 *      ↓
 * Document Service
 *      ↓
 * Structured Handwriting Document
 *      ↓
 * Handwriting Preview
 *      ↓
 * Handwriting Renderer
 *
 * IMPORTANT:
 *
 * We never use editor.getText().
 *
 * Structured blocks are preserved:
 *
 * - Heading
 * - Paragraph
 * - Bullet list
 * - Ordered list
 * - Table
 * - Image
 * - Manual page break
 *
 * Phase 7 additions:
 *
 * - Handwriting presets
 * - Deterministic random seed
 * - Randomize button
 * - Naturalness 0–100
 * - Assignment mode
 * - Preview configuration
 * - Page selection state
 * - PDF generation hook
 * =========================================================
 */


/*
 * =========================================================
 * HANDWRITING PRESETS
 * =========================================================
 */

const HANDWRITING_PRESETS = {
  neat_student: {
    id: "neat_student",
    name: "Neat Student",

    font: "neat",
    variation: 20,

    letterSpacing: 0,
    wordSpacing: 4,
    lineSpacing: 1.5,

    ink: "blue",
    paper: "ruled",

    fontSize: 22,
    inkOpacity: 0.9,
  },

  school_notebook: {
    id: "school_notebook",
    name: "School Notebook",

    font: "notebook",
    variation: 45,

    letterSpacing: 0,
    wordSpacing: 4,
    lineSpacing: 1.5,

    ink: "blue",
    paper: "ruled",

    fontSize: 22,
    inkOpacity: 0.9,
  },

  cursive: {
    id: "cursive",
    name: "Cursive",

    font: "cursive",
    variation: 20,

    letterSpacing: 0.2,
    wordSpacing: 5,
    lineSpacing: 1.55,

    ink: "black",
    paper: "plain",

    fontSize: 23,
    inkOpacity: 0.9,
  },

  messy_notes: {
    id: "messy_notes",
    name: "Messy Notes",

    font: "casual",
    variation: 80,

    letterSpacing: 0.4,
    wordSpacing: 6,
    lineSpacing: 1.65,

    ink: "blue",
    paper: "notebook",

    fontSize: 22,
    inkOpacity: 0.84,
  },

  pencil: {
    id: "pencil",
    name: "Pencil",

    font: "pencil_writing",
    variation: 45,

    letterSpacing: 0,
    wordSpacing: 4,
    lineSpacing: 1.5,

    ink: "gray",
    paper: "notebook",

    fontSize: 22,
    inkOpacity: 0.72,
  },
};


/*
 * =========================================================
 * UTILITY
 * =========================================================
 */

function createRandomSeed() {
  return Math.floor(
    Math.random() * 2147483647
  );
}


function getDocumentId(document, handwritingDocument) {
  return (
    document?.id ||
    document?._id ||
    handwritingDocument?.documentId ||
    "inkai-preview-document"
  );
}


/*
 * =========================================================
 * COMPONENT
 * =========================================================
 */

function HandwritingGeneratorPage() {
  const location = useLocation();
  const navigate = useNavigate();


  /*
   * =========================================================
   * SOURCE DOCUMENT
   * =========================================================
   */

  const sourceDocument =
    location.state?.document || null;


  /*
   * =========================================================
   * CONVERT PHASE 6 DOCUMENT
   * =========================================================
   *
   * IMPORTANT:
   *
   * The document remains structured.
   *
   * We do not flatten it to text.
   */

  const handwritingDocument = useMemo(() => {
    if (!sourceDocument) {
      return null;
    }

    try {
      return convertDocumentToHandwritingDocument(
        sourceDocument
      );
    } catch (error) {
      console.error(
        "Failed to prepare handwriting document:",
        error
      );

      return null;
    }
  }, [sourceDocument]);


  /*
   * =========================================================
   * DOCUMENT ID
   * =========================================================
   */

  const documentId = useMemo(
    () =>
      getDocumentId(
        sourceDocument,
        handwritingDocument
      ),
    [
      sourceDocument,
      handwritingDocument,
    ]
  );


  /*
   * =========================================================
   * PRESET
   * =========================================================
   */

  const [selectedPreset, setSelectedPreset] =
    useState("school_notebook");


  /*
   * =========================================================
   * BASIC HANDWRITING SETTINGS
   * =========================================================
   */

  const [selectedFont, setSelectedFont] =
    useState(
      HANDWRITING_PRESETS.school_notebook.font
    );

  const [selectedPaper, setSelectedPaper] =
    useState(
      HANDWRITING_PRESETS.school_notebook.paper
    );

  const [selectedInk, setSelectedInk] =
    useState(
      HANDWRITING_PRESETS.school_notebook.ink
    );


  /*
   * =========================================================
   * HANDWRITING CONTROLS
   * =========================================================
   */

  const [fontSize, setFontSize] =
    useState(
      HANDWRITING_PRESETS.school_notebook.fontSize
    );

  const [letterSpacing, setLetterSpacing] =
    useState(
      HANDWRITING_PRESETS.school_notebook.letterSpacing
    );

  const [lineSpacing, setLineSpacing] =
    useState(
      HANDWRITING_PRESETS.school_notebook.lineSpacing
    );

  const [wordSpacing, setWordSpacing] =
    useState(
      HANDWRITING_PRESETS.school_notebook.wordSpacing
    );

  const [inkOpacity, setInkOpacity] =
    useState(
      HANDWRITING_PRESETS.school_notebook.inkOpacity
    );


  /*
   * =========================================================
   * NATURALNESS
   * =========================================================
   *
   * 0   = almost perfectly uniform
   * 25  = very subtle variation
   * 50  = natural handwriting
   * 75  = clearly human variation
   * 100 = strong irregularity
   *
   * The renderer is responsible for interpreting this
   * value and applying it to:
   *
   * - rotation
   * - scale
   * - baseline
   * - spacing
   * - glyph selection
   * - ink variation
   */

  const [naturalness, setNaturalness] =
    useState(
      HANDWRITING_PRESETS.school_notebook.variation
    );


  /*
   * =========================================================
   * LEGACY NATURAL VARIATION FLAG
   * =========================================================
   *
   * Kept for compatibility with the current renderer.
   *
   * Naturalness is now the primary control.
   */

  const [naturalVariation, setNaturalVariation] =
    useState(true);


  /*
   * =========================================================
   * DETERMINISTIC RANDOM SEED
   * =========================================================
   *
   * The same:
   *
   * Document ID
   * + Style
   * + Seed
   *
   * should always produce the same handwriting.
   */

  const [randomSeed, setRandomSeed] =
    useState(12345);


  /*
   * =========================================================
   * PAGE STATE
   * =========================================================
   *
   * HandwritingPreview / HandwritingCanvas can update this
   * when multiple pages are generated.
   */

  const [pages, setPages] =
    useState([]);

  const [selectedPage, setSelectedPage] =
    useState(0);


  /*
   * =========================================================
   * ASSIGNMENT MODE
   * =========================================================
   */

  const [assignmentMode, setAssignmentMode] =
    useState(false);

  const [assignmentDetails, setAssignmentDetails] =
    useState({
      studentName: "",
      rollNumber: "",
      subject: "",
      className: "",
      teacher: "",
      assignmentTitle: "",
    });


  /*
   * =========================================================
   * PREVIEW STATUS
   * =========================================================
   */

  const [isGenerating, setIsGenerating] =
    useState(false);


  /*
   * =========================================================
   * PRESET APPLICATION
   * =========================================================
   */

  const applyPreset = (presetId) => {
    const preset =
      HANDWRITING_PRESETS[presetId];

    if (!preset) {
      return;
    }

    setSelectedPreset(presetId);

    setSelectedFont(preset.font);
    setSelectedPaper(preset.paper);
    setSelectedInk(preset.ink);

    setFontSize(preset.fontSize);
    setLetterSpacing(preset.letterSpacing);
    setWordSpacing(preset.wordSpacing);
    setLineSpacing(preset.lineSpacing);
    setInkOpacity(preset.inkOpacity);

    setNaturalness(preset.variation);

    setNaturalVariation(
      preset.variation > 0
    );
  };


  /*
   * =========================================================
   * RANDOMIZE
   * =========================================================
   *
   * IMPORTANT:
   *
   * Randomize changes ONLY the seed.
   *
   * It does NOT change:
   *
   * - document text
   * - headings
   * - lists
   * - tables
   * - images
   * - formatting
   * - selected font
   * - selected paper
   * - selected ink
   *
   * The renderer uses the new seed to produce a different
   * deterministic handwriting realization.
   */

  const handleRandomize = () => {
    setRandomSeed(
      createRandomSeed()
    );

    setSelectedPage(0);
  };


  /*
   * =========================================================
   * NATURALNESS HANDLER
   * =========================================================
   */

  const handleNaturalnessChange = (value) => {
    const numericValue =
      Number(value);

    const safeValue =
      Math.max(
        0,
        Math.min(
          100,
          Number.isFinite(numericValue)
            ? numericValue
            : 0
        )
      );

    setNaturalness(safeValue);

    setNaturalVariation(
      safeValue > 0
    );
  };


  /*
   * =========================================================
   * PAGE CALLBACK
   * =========================================================
   */

  const handlePagesChange = (
    generatedPages
  ) => {
    if (!Array.isArray(generatedPages)) {
      return;
    }

    setPages(generatedPages);

    setSelectedPage((current) =>
      Math.min(
        current,
        Math.max(
          generatedPages.length - 1,
          0
        )
      )
    );
  };


  /*
   * =========================================================
   * PAGE SELECTION
   * =========================================================
   */

  const handlePageSelect = (pageIndex) => {
    if (
      pageIndex < 0 ||
      pageIndex >= pages.length
    ) {
      return;
    }

    setSelectedPage(pageIndex);
  };


  /*
   * =========================================================
   * ASSIGNMENT DETAILS
   * =========================================================
   */

  const updateAssignmentDetail = (
    field,
    value
  ) => {
    setAssignmentDetails((current) => ({
      ...current,
      [field]: value,
    }));
  };


  /*
   * =========================================================
   * GENERATE PDF
   * =========================================================
   *
   * The actual PDF renderer will be connected here.
   *
   * Preview rendering and PDF rendering remain separate.
   */

  const handleGeneratePDF = async () => {
    if (!handwritingDocument) {
      return;
    }

    try {
      setIsGenerating(true);

      /*
       * PDF generation endpoint will be connected in the
       * handwritingService implementation.
       *
       * For now this intentionally does not flatten the
       * document or generate a fake PDF.
       */

      console.log(
        "Generate handwriting PDF",
        {
          documentId,
          style: selectedPreset,
          font: selectedFont,
          ink: selectedInk,
          paper: selectedPaper,
          fontSize,
          naturalness:
            naturalness / 100,
          seed: randomSeed,
          assignmentMode,
          assignmentDetails,
        }
      );

    } catch (error) {
      console.error(
        "Failed to generate handwriting PDF:",
        error
      );
    } finally {
      setIsGenerating(false);
    }
  };


  /*
   * =========================================================
   * DOCUMENT NOT FOUND
   * =========================================================
   */

  if (
    !sourceDocument ||
    !handwritingDocument
  ) {
    return (
      <div className="min-h-screen bg-slate-100">

        <Navbar />

        <main
          className="
            flex
            min-h-[70vh]
            items-center
            justify-center
            px-6
          "
        >
          <div className="text-center">

            <h1
              className="
                text-2xl
                font-bold
                text-slate-900
              "
            >
              Document not found
            </h1>

            <p
              className="
                mt-2
                text-slate-600
              "
            >
              Return to the editor and try again.
            </p>

            <button
              type="button"
              onClick={() =>
                navigate("/editor")
              }
              className="
                mt-6
                rounded-lg
                bg-indigo-600
                px-5
                py-2.5
                text-sm
                font-medium
                text-white
                transition
                hover:bg-indigo-500
              "
            >
              Return to Editor
            </button>

          </div>
        </main>

        <Footer />

      </div>
    );
  }


  /*
   * =========================================================
   * MAIN PAGE
   * =========================================================
   */

  return (
    <div className="min-h-screen bg-slate-100">

      <Navbar />


      {/* =====================================================
          HEADER
          ===================================================== */}

      <header
        className="
          border-b
          border-slate-200
          bg-white
        "
      >
        <div
          className="
            mx-auto
            max-w-[1600px]
            px-6
            py-6
          "
        >

          <div
            className="
              flex
              flex-wrap
              items-center
              justify-between
              gap-4
            "
          >

            <div>

              <h1
                className="
                  text-2xl
                  font-bold
                  text-slate-900
                "
              >
                Generate Handwriting
              </h1>

              <p
                className="
                  mt-1
                  text-sm
                  text-slate-600
                "
              >
                Convert your saved document into
                handwritten content while preserving
                its formatting.
              </p>

            </div>


            {/* DOCUMENT ID */}

            <div
              className="
                rounded-lg
                bg-slate-50
                px-3
                py-2
                text-xs
                text-slate-500
              "
            >
              Document ID:{" "}
              <span
                className="
                  font-medium
                  text-slate-700
                "
              >
                {documentId}
              </span>
            </div>

          </div>

        </div>
      </header>


      {/* =====================================================
          MAIN
          ===================================================== */}

      <main
        className="
          mx-auto
          max-w-[1600px]
          px-6
          py-8
        "
      >

        <div
          className="
            grid
            gap-8
            lg:grid-cols-[340px_1fr]
          "
        >

          {/* =================================================
              LEFT SIDEBAR
              ================================================= */}

          <aside
            className="
              h-fit
              space-y-6
            "
          >

            {/* =================================================
                PRESETS
                ================================================= */}

            <div
              className="
                rounded-xl
                border
                border-slate-200
                bg-white
                p-6
                shadow-sm
              "
            >

              <div
                className="
                  flex
                  items-center
                  justify-between
                "
              >

                <h2
                  className="
                    text-lg
                    font-semibold
                    text-slate-900
                  "
                >
                  Handwriting Style
                </h2>

              </div>


              <div
                className="
                  mt-4
                  grid
                  grid-cols-1
                  gap-2
                "
              >

                {Object.values(
                  HANDWRITING_PRESETS
                ).map((preset) => (

                  <button
                    key={preset.id}
                    type="button"
                    onClick={() =>
                      applyPreset(
                        preset.id
                      )
                    }
                    className={`
                      rounded-lg
                      border
                      px-4
                      py-3
                      text-left
                      transition
                      ${
                        selectedPreset ===
                        preset.id
                          ? `
                            border-indigo-500
                            bg-indigo-50
                            text-indigo-700
                          `
                          : `
                            border-slate-200
                            bg-white
                            text-slate-700
                            hover:bg-slate-50
                          `
                      }
                    `}
                  >

                    <div
                      className="
                        text-sm
                        font-semibold
                      "
                    >
                      {preset.name}
                    </div>

                    <div
                      className="
                        mt-1
                        text-xs
                        text-slate-500
                      "
                    >
                      {preset.font} ·{" "}
                      {preset.ink} ink ·{" "}
                      {preset.paper} paper
                    </div>

                  </button>

                ))}

              </div>

            </div>


            {/* =================================================
                BASIC SETTINGS
                ================================================= */}

            <div
              className="
                rounded-xl
                border
                border-slate-200
                bg-white
                p-6
                shadow-sm
              "
            >

              <h2
                className="
                  text-lg
                  font-semibold
                  text-slate-900
                "
              >
                Handwriting Settings
              </h2>

              <div className="mt-6">

                <HandwritingSettings
                  selectedFont={
                    selectedFont
                  }
                  setSelectedFont={
                    setSelectedFont
                  }

                  selectedPaper={
                    selectedPaper
                  }
                  setSelectedPaper={
                    setSelectedPaper
                  }

                  selectedInk={
                    selectedInk
                  }
                  setSelectedInk={
                    setSelectedInk
                  }
                />

              </div>

            </div>


            {/* =================================================
                HANDWRITING CONTROLS
                ================================================= */}

            <HandwritingControls

              fontSize={
                fontSize
              }

              setFontSize={
                setFontSize
              }

              letterSpacing={
                letterSpacing
              }

              setLetterSpacing={
                setLetterSpacing
              }

              lineSpacing={
                lineSpacing
              }

              setLineSpacing={
                setLineSpacing
              }

              wordSpacing={
                wordSpacing
              }

              setWordSpacing={
                setWordSpacing
              }

              inkOpacity={
                inkOpacity
              }

              setInkOpacity={
                setInkOpacity
              }

              naturalVariation={
                naturalVariation
              }

              setNaturalVariation={
                setNaturalVariation
              }

              /*
               * New Phase 7 controls.
               *
               * Existing HandwritingControls can ignore
               * these until it is updated.
               */

              naturalness={
                naturalness
              }

              setNaturalness={
                handleNaturalnessChange
              }

              onRandomize={
                handleRandomize
              }

              randomSeed={
                randomSeed
              }

            />


            {/* =================================================
                ASSIGNMENT MODE
                ================================================= */}

            <div
              className="
                rounded-xl
                border
                border-slate-200
                bg-white
                p-6
                shadow-sm
              "
            >

              <div
                className="
                  flex
                  items-center
                  justify-between
                  gap-4
                "
              >

                <div>

                  <h3
                    className="
                      text-sm
                      font-semibold
                      text-slate-900
                    "
                  >
                    Assignment Mode
                  </h3>

                  <p
                    className="
                      mt-1
                      text-xs
                      text-slate-500
                    "
                  >
                    Add student and assignment
                    details automatically.
                  </p>

                </div>

                <button
                  type="button"
                  onClick={() =>
                    setAssignmentMode(
                      (current) =>
                        !current
                    )
                  }
                  aria-pressed={
                    assignmentMode
                  }
                  className={`
                    relative
                    h-6
                    w-11
                    rounded-full
                    transition
                    ${
                      assignmentMode
                        ? "bg-indigo-600"
                        : "bg-slate-300"
                    }
                  `}
                >

                  <span
                    className={`
                      absolute
                      top-1
                      h-4
                      w-4
                      rounded-full
                      bg-white
                      shadow
                      transition
                      ${
                        assignmentMode
                          ? "left-6"
                          : "left-1"
                      }
                    `}
                  />

                </button>

              </div>


              {assignmentMode && (
                <div
                  className="
                    mt-5
                    space-y-3
                  "
                >

                  {[
                    [
                      "studentName",
                      "Student Name",
                    ],
                    [
                      "rollNumber",
                      "Roll Number",
                    ],
                    [
                      "subject",
                      "Subject",
                    ],
                    [
                      "className",
                      "Class",
                    ],
                    [
                      "teacher",
                      "Teacher",
                    ],
                    [
                      "assignmentTitle",
                      "Assignment Title",
                    ],
                  ].map(
                    ([
                      field,
                      label,
                    ]) => (

                      <label
                        key={field}
                        className="
                          block
                        "
                      >

                        <span
                          className="
                            mb-1
                            block
                            text-xs
                            font-medium
                            text-slate-600
                          "
                        >
                          {label}
                        </span>

                        <input
                          type="text"
                          value={
                            assignmentDetails[
                              field
                            ]
                          }
                          onChange={(event) =>
                            updateAssignmentDetail(
                              field,
                              event.target
                                .value
                            )
                          }
                          placeholder={
                            label
                          }
                          className="
                            w-full
                            rounded-lg
                            border
                            border-slate-300
                            px-3
                            py-2
                            text-sm
                            text-slate-900
                            outline-none
                            transition
                            focus:border-indigo-500
                            focus:ring-2
                            focus:ring-indigo-100
                          "
                        />

                      </label>

                    )
                  )}

                </div>
              )}

            </div>


            {/* =================================================
                RANDOMIZATION
                ================================================= */}

            <div
              className="
                rounded-xl
                border
                border-slate-200
                bg-white
                p-6
                shadow-sm
              "
            >

              <div
                className="
                  flex
                  items-center
                  justify-between
                  gap-3
                "
              >

                <div>

                  <h3
                    className="
                      text-sm
                      font-semibold
                      text-slate-900
                    "
                  >
                    Handwriting Variation
                  </h3>

                  <p
                    className="
                      mt-1
                      text-xs
                      text-slate-500
                    "
                  >
                    Change the handwriting realization
                    without changing your document.
                  </p>

                </div>

              </div>


              <button
                type="button"
                onClick={
                  handleRandomize
                }
                className="
                  mt-4
                  w-full
                  rounded-lg
                  border
                  border-indigo-200
                  bg-indigo-50
                  px-4
                  py-2.5
                  text-sm
                  font-medium
                  text-indigo-700
                  transition
                  hover:bg-indigo-100
                "
              >
                Randomize Handwriting
              </button>


              <div
                className="
                  mt-3
                  rounded-lg
                  bg-slate-50
                  px-3
                  py-2
                  text-xs
                  text-slate-500
                "
              >
                Seed:{" "}
                <span
                  className="
                    font-mono
                    font-medium
                    text-slate-700
                  "
                >
                  {randomSeed}
                </span>
              </div>

            </div>


            {/* =================================================
                DOCUMENT INFORMATION
                ================================================= */}

            <div
              className="
                rounded-xl
                border
                border-slate-200
                bg-white
                p-6
                shadow-sm
              "
            >

              <h3
                className="
                  text-sm
                  font-semibold
                  text-slate-900
                "
              >
                Document
              </h3>

              <p
                className="
                  mt-2
                  break-words
                  text-sm
                  text-slate-600
                "
              >
                {handwritingDocument.title}
              </p>

              <div
                className="
                  mt-4
                  space-y-2
                  text-xs
                  text-slate-500
                "
              >

                <div>
                  Words:{" "}
                  {handwritingDocument.wordCount}
                </div>

                <div>
                  Characters:{" "}
                  {handwritingDocument.characterCount}
                </div>

                <div>
                  Blocks:{" "}
                  {handwritingDocument.blocks.length}
                </div>

                <div>
                  Pages:{" "}
                  {pages.length || "—"}
                </div>

                <div>
                  Structured formatting:{" "}
                  <span
                    className="
                      font-medium
                      text-emerald-600
                    "
                  >
                    Preserved
                  </span>
                </div>

              </div>

            </div>

          </aside>


          {/* =================================================
              RIGHT PREVIEW
              ================================================= */}

          <section
            className="
              min-w-0
            "
          >

            <div
              className="
                mb-4
                flex
                flex-wrap
                items-center
                justify-between
                gap-4
              "
            >

              <div>

                <h2
                  className="
                    text-lg
                    font-semibold
                    text-slate-900
                  "
                >
                  Preview
                </h2>

                <p
                  className="
                    text-sm
                    text-slate-500
                  "
                >
                  Headings, lists, tables, images,
                  page breaks, and paragraphs are
                  preserved.
                </p>

              </div>


              <button
                type="button"
                onClick={
                  handleGeneratePDF
                }
                disabled={
                  isGenerating ||
                  !handwritingDocument
                }
                className={`
                  rounded-lg
                  px-5
                  py-2.5
                  text-sm
                  font-medium
                  text-white
                  transition
                  ${
                    isGenerating
                      ? `
                        cursor-wait
                        bg-indigo-400
                      `
                      : `
                        bg-indigo-600
                        hover:bg-indigo-500
                      `
                  }
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                `}
              >
                {isGenerating
                  ? "Preparing PDF..."
                  : "Generate PDF"}
              </button>

            </div>


            {/* =================================================
                PAGE NAVIGATION
                ================================================= */}

            {pages.length > 1 && (
              <div
                className="
                  mb-5
                  rounded-xl
                  border
                  border-slate-200
                  bg-white
                  p-4
                  shadow-sm
                "
              >

                <div
                  className="
                    mb-3
                    flex
                    items-center
                    justify-between
                  "
                >

                  <h3
                    className="
                      text-sm
                      font-semibold
                      text-slate-900
                    "
                  >
                    Pages
                  </h3>

                  <span
                    className="
                      text-xs
                      text-slate-500
                    "
                  >
                    Page{" "}
                    {selectedPage + 1}{" "}
                    of{" "}
                    {pages.length}
                  </span>

                </div>


                <div
                  className="
                    flex
                    gap-3
                    overflow-x-auto
                    pb-1
                  "
                >

                  {pages.map(
                    (page, index) => {

                      const pageSource =
                        typeof page ===
                        "string"
                          ? page
                          : page?.dataUrl ||
                            page?.previewUrl ||
                            null;

                      return (
                        <button
                          key={
                            page?.pageNumber ||
                            index
                          }
                          type="button"
                          onClick={() =>
                            handlePageSelect(
                              index
                            )
                          }
                          className={`
                            relative
                            shrink-0
                            overflow-hidden
                            rounded-lg
                            border-2
                            bg-slate-50
                            transition
                            ${
                              selectedPage ===
                              index
                                ? `
                                  border-indigo-500
                                  ring-2
                                  ring-indigo-100
                                `
                                : `
                                  border-slate-200
                                  hover:border-slate-400
                                `
                            }
                          `}
                          aria-label={
                            `Select page ${
                              index + 1
                            }`
                          }
                        >

                          {pageSource ? (
                            <img
                              src={pageSource}
                              alt={
                                `Page ${
                                  index + 1
                                } thumbnail`
                              }
                              className="
                                h-32
                                w-24
                                object-cover
                                object-top
                              "
                            />
                          ) : (
                            <div
                              className="
                                flex
                                h-32
                                w-24
                                items-center
                                justify-center
                                text-xs
                                text-slate-400
                              "
                            >
                              Page{" "}
                              {index + 1}
                            </div>
                          )}

                          <span
                            className="
                              absolute
                              bottom-0
                              left-0
                              right-0
                              bg-white/90
                              py-1
                              text-center
                              text-[10px]
                              font-medium
                              text-slate-600
                            "
                          >
                            {index + 1}
                          </span>

                        </button>
                      );
                    }
                  )}

                </div>

              </div>
            )}


            {/* =================================================
                PREVIEW
                ================================================= */}

            <HandwritingPreview
              document={
                handwritingDocument
              }

              documentId={
                documentId
              }

              font={
                selectedFont
              }

              paper={
                selectedPaper
              }

              ink={
                selectedInk
              }

              fontSize={
                fontSize
              }

              letterSpacing={
                letterSpacing
              }

              lineSpacing={
                lineSpacing
              }

              wordSpacing={
                wordSpacing
              }

              inkOpacity={
                inkOpacity
              }

              naturalVariation={
                naturalVariation
              }

              /*
               * Phase 7 renderer configuration
               */

              naturalness={
                naturalness / 100
              }

              seed={
                randomSeed
              }

              style={
                selectedPreset
              }

              assignmentMode={
                assignmentMode
              }

              assignmentDetails={
                assignmentDetails
              }

              selectedPage={
                selectedPage
              }

              onPagesChange={
                handlePagesChange
              }

              onPageSelect={
                handlePageSelect
              }

            />

          </section>

        </div>

      </main>


      <Footer />

    </div>
  );
}


export default HandwritingGeneratorPage;