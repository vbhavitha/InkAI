import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

import HandwritingSettings from "../components/handwriting/HandwritingSettings";
import HandwritingPreview from "../components/handwriting/HandwritingPreview";
import HandwritingControls from "../components/handwriting/HandwritingControls";

import handwritingPresets from "../data/handwritingPresets";

import {
  generateAssignmentPDF,
} from "../services/assignmentService";

import {
  convertDocumentToHandwritingDocument,
} from "../services/handwritingDocumentService";

import {
  createHandwritingDocument,
  getHandwritingDocument,
  updateHandwritingDocument,
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
 * Structured document blocks remain preserved:
 *
 * - Heading
 * - Paragraph
 * - Bullet list
 * - Ordered list
 * - Table
 * - Image
 * - Page break
 *
 * Phase 7:
 *
 * - Handwriting presets
 * - Multiple pages
 * - Page selection
 * - Naturalness 0–100
 * - Deterministic random seed
 * - Randomize handwriting
 * - Assignment mode
 * - Handwriting preview
 * - PDF generation hook
 * =========================================================
 */


/*
 * =========================================================
 * PRESET HELPERS
 * =========================================================
 */

const getPreset = (presetId) => {
  return handwritingPresets.find(
    (preset) => preset.id === presetId
  );
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


function getDocumentId(
  document,
  handwritingDocument
) {
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
   * =======================================================
   * SOURCE DOCUMENT
   * =======================================================
   */

  const sourceDocument =
    location.state?.document || null;

  const incomingHandwriting =
    location.state?.handwriting ||
    null;

  const incomingAssignment =
    location.state?.assignment ||
    null;


  /*
   * =======================================================
   * CONVERT DOCUMENT
   * =======================================================
   *
   * IMPORTANT:
   *
   * The document remains structured.
   *
   * We do NOT use editor.getText().
   * We do NOT flatten the document.
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
   * =======================================================
   * DOCUMENT ID
   * =======================================================
   */

  const documentId = useMemo(() => {
    return getDocumentId(
      sourceDocument,
      handwritingDocument
    );
  }, [
    sourceDocument,
    handwritingDocument,
  ]);


  /*
   * =======================================================
   * DEFAULT PRESET
   * =======================================================
   */

  const defaultPreset =
    getPreset(
      incomingHandwriting?.style ||
        "school_notebook"
    );


  /*
   * =======================================================
   * PRESET STATE
   * =======================================================
   */

  const [
    selectedPreset,
    setSelectedPreset,
  ] = useState(
    defaultPreset?.id ||
      "school_notebook"
  );


  /*
   * =======================================================
   * HANDWRITING SETTINGS
   * =======================================================
   */

  const [
    selectedFont,
    setSelectedFont,
  ] = useState(
    incomingHandwriting?.font ||
    defaultPreset?.font ||
      "school_notebook"
  );


  const [
    selectedPaper,
    setSelectedPaper,
  ] = useState(
    incomingHandwriting?.paper ||
    defaultPreset?.paper ||
      "ruled"
  );


  const [
    selectedInk,
    setSelectedInk,
  ] = useState(
    incomingHandwriting?.ink ||
    defaultPreset?.ink ||
      "blue"
  );


  /*
   * =======================================================
   * FONT SIZE
   * =======================================================
   */

  const [
    fontSize,
    setFontSize,
  ] = useState(
    incomingHandwriting?.fontSize ??
    defaultPreset?.fontSize ??
      22
  );


  /*
   * =======================================================
   * LETTER SPACING
   * =======================================================
   */

  const [
    letterSpacing,
    setLetterSpacing,
  ] = useState(
    incomingHandwriting?.letterSpacing ??
    defaultPreset?.letterSpacing ??
      0
  );


  /*
   * =======================================================
   * LINE SPACING
   * =======================================================
   */

  const [
    lineSpacing,
    setLineSpacing,
  ] = useState(
    incomingHandwriting?.lineSpacing ??
    defaultPreset?.lineSpacing ??
      1.5
  );


  /*
   * =======================================================
   * WORD SPACING
   * =======================================================
   */

  const [
    wordSpacing,
    setWordSpacing,
  ] = useState(
    incomingHandwriting?.wordSpacing ??
    defaultPreset?.wordSpacing ??
      5
  );


  /*
   * =======================================================
   * INK OPACITY
   * =======================================================
   */

  const [
    inkOpacity,
    setInkOpacity,
  ] = useState(
    incomingHandwriting?.inkOpacity ??
    defaultPreset?.inkOpacity ??
      0.9
  );


  /*
   * =======================================================
   * NATURALNESS
   * =======================================================
   *
   * 0   = very uniform
   * 25  = subtle variation
   * 50  = natural handwriting
   * 75  = clearly human variation
   * 100 = strong irregularity
   */

  const [
    naturalness,
    setNaturalness,
  ] = useState(
    incomingHandwriting?.naturalness ??
    defaultPreset?.naturalness ??
      50
  );


  /*
   * =======================================================
   * NATURAL VARIATION
   * =======================================================
   *
   * Kept for compatibility with
   * existing handwriting renderer.
   */

  const [
    naturalVariation,
    setNaturalVariation,
  ] = useState(
    defaultPreset?.naturalVariation ??
      true
  );


  /*
   * =======================================================
   * DETERMINISTIC RANDOM SEED
   * =======================================================
   *
   * Same:
   *
   * Document ID
   * + Style
   * + Seed
   *
   * produces the same handwriting realization.
   */

  const [
    randomSeed,
    setRandomSeed,
  ] = useState(
    incomingHandwriting?.seed ??
    defaultPreset?.seed ??
      12345
  );


  /*
   * =======================================================
   * GENERATED PAGES
   * =======================================================
   */

  const [
    pages,
    setPages,
  ] = useState([]);


  /*
   * =======================================================
   * SELECTED PAGE
   * =======================================================
   */

  const [
    selectedPage,
    setSelectedPage,
  ] = useState(0);


  /*
   * =======================================================
   * ASSIGNMENT MODE
   * =======================================================
   */

  const [
    assignmentMode,
    setAssignmentMode,
  ] = useState(false);


  const [
    assignmentDetails,
    setAssignmentDetails,
  ] = useState(
    incomingAssignment || {
      studentName: "",
      rollNumber: "",
      subject: "",
      className: "",
      section: "",
      teacherName: "",
      title: "",
      date: "",
    }
  );


  /*
   * =======================================================
   * GENERATION STATE
   * =======================================================
   */

  const [isGenerating, setIsGenerating] =
    useState(false);

  const [isSaving, setIsSaving] =
    useState(false);

  const [saveMessage, setSaveMessage] =
    useState("");

  /*
   * =========================================================
   * APPLY PRESET
   * =========================================================
   */

  const applyPreset = (presetId) => {
    const preset = getPreset(presetId);

    if (!preset) {
      return;
    }

    setSelectedPreset(
      preset.id
    );

    setSelectedFont(
      preset.font
    );

    setSelectedPaper(
      preset.paper
    );

    setSelectedInk(
      preset.ink
    );

    setFontSize(
      preset.fontSize
    );

    setLetterSpacing(
      preset.letterSpacing
    );

    setLineSpacing(
      preset.lineSpacing
    );

    setWordSpacing(
      preset.wordSpacing
    );

    setInkOpacity(
      preset.inkOpacity
    );

    setNaturalness(
      preset.naturalness
    );

    setNaturalVariation(
      preset.naturalVariation ??
        true
    );

    setRandomSeed(
      preset.seed ??
        12345
    );

    setSelectedPage(0);
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
   * It does not change:
   *
   * - document
   * - text
   * - headings
   * - lists
   * - tables
   * - images
   * - formatting
   * - font
   * - paper
   * - ink
   * - naturalness
   */

  const handleRandomize = () => {
    setRandomSeed(
      createRandomSeed()
    );

    setSelectedPage(0);
  };


  /*
   * =========================================================
   * NATURALNESS
   * =========================================================
   */

  const handleNaturalnessChange = (
    value
  ) => {
    const numericValue =
      Number(value);

    const safeValue =
      Math.max(
        0,
        Math.min(
          100,
          Number.isFinite(
            numericValue
          )
            ? numericValue
            : 0
        )
      );

    setNaturalness(
      safeValue
    );

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
    if (
      !Array.isArray(
        generatedPages
      )
    ) {
      return;
    }

    setPages(
      generatedPages
    );

    setSelectedPage(
      (currentPage) => {
        const maxPage =
          Math.max(
            generatedPages.length -
              1,
            0
          );

        return Math.min(
          currentPage,
          maxPage
        );
      }
    );
  };


  /*
   * =========================================================
   * PAGE SELECTION
   * =========================================================
   */

  const handlePageSelect = (
    pageIndex
  ) => {
    if (
      pageIndex < 0 ||
      pageIndex >= pages.length
    ) {
      return;
    }

    setSelectedPage(
      pageIndex
    );
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
    setAssignmentDetails(
      (current) => ({
        ...current,
        [field]: value,
      })
    );
  };


  /*
   * =========================================================
   * GENERATE PDF
   * =========================================================
   *
   * The backend PDF renderer is currently
   * a Phase 7 hook.
   */

  const handleGeneratePDF = async () => {
    if (!handwritingDocument) {
      setSaveMessage("Handwriting document is not available.");
      return;
    }

    if (!documentId) {
      setSaveMessage("Document ID is missing.");
      return;
    }

    try {
      setIsGenerating(true);
      setSaveMessage("");

      const result = await generateAssignmentPDF({
        documentId,
        template: assignmentDetails.template,
        paper: selectedPaper,
        handwritingStyle: selectedPreset,
        ink: selectedInk,
        pageNumbers: assignmentDetails.showPageNumber,

        assignment: assignmentDetails,

        handwriting: {
          style: selectedPreset,
          font: selectedFont,
          paper: selectedPaper,
          ink: selectedInk,

          fontSize,
          lineSpacing,
          letterSpacing,
          wordSpacing,

          inkOpacity,
          naturalness: naturalness / 100,
          naturalVariation,
          seed: randomSeed,
        },
      });

      setGenerationResult(result);
      setShowReadyScreen(true);

      if (result?.download_url) {
        window.open(result.download_url, "_blank");
        setSaveMessage("PDF generated successfully.");
      } else {
        setSaveMessage("PDF generated, but download link was not returned.");
      }

    } catch (error) {
      console.error("PDF generation failed:", error);

      setSaveMessage(
        error?.message || "Failed to generate PDF."
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const saveHandwritingSettings = async () => {
    if (!documentId || !userId) {
      console.warn(
        "Cannot save handwriting settings:",
        "documentId or userId is missing."
      );

      return;
    }

    const payload = {
      documentId,
      userId,
      style: selectedPreset,
      font: selectedFont,
      inkColor: selectedInk,
      paperStyle: selectedPaper,
      fontSize,
      lineSpacing,
      letterSpacing,
      naturalness,
      randomSeed,
    };

    try {
      try {
        await updateHandwritingDocument(
          payload
        );
      } catch (error) {
        if (
          error.message
            ?.toLowerCase()
            .includes("not found")
        ) {
          await createHandwritingDocument(
            payload
          );
        } else {
          throw error;
        }
      }

      console.log(
        "Handwriting settings saved."
      );
    } catch (error) {
      console.error(
        "Failed to save handwriting settings:",
        error
      );
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
              Return to the editor and
              try again.
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
                Convert your saved document
                into handwritten content while
                preserving its formatting.
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

              <h2
                className="
                  text-lg
                  font-semibold
                  text-slate-900
                "
              >
                Handwriting Style
              </h2>


              <p
                className="
                  mt-1
                  text-xs
                  text-slate-500
                "
              >
                Choose a handwriting preset.
              </p>


              <div
                className="
                  mt-4
                  grid
                  grid-cols-1
                  gap-2
                "
              >

                {handwritingPresets.map(
                  (preset) => (
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
                          leading-5
                          text-slate-500
                        "
                      >
                        {preset.description}
                      </div>


                      <div
                        className="
                          mt-2
                          text-[11px]
                          text-slate-400
                        "
                      >
                        {preset.font}
                        {" · "}
                        {preset.ink}
                        {" ink · "}
                        {preset.paper}
                        {" paper"}
                      </div>

                    </button>
                  )
                )}

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

            </div>


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
                        className="block"
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
                          onChange={(
                            event
                          ) =>
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
                  Change the handwriting
                  realization without changing
                  your document.
                </p>

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
                  {
                    handwritingDocument.wordCount
                  }
                </div>

                <div>
                  Characters:{" "}
                  {
                    handwritingDocument.characterCount
                  }
                </div>

                <div>
                  Blocks:{" "}
                  {
                    handwritingDocument.blocks
                      ?.length || 0
                  }
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
                  Headings, lists, tables,
                  images, page breaks, and
                  paragraphs are preserved.
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
                HANDWRITING PREVIEW
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