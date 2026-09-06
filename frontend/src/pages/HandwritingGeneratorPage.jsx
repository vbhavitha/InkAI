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


function HandwritingGeneratorPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const document =
    location.state?.document || null;


  /*
   * =========================================================
   * BASIC HANDWRITING SETTINGS
   * =========================================================
   */

  const [selectedFont, setSelectedFont] =
    useState("inkai-default");

  const [selectedPaper, setSelectedPaper] =
    useState("plain");

  const [selectedInk, setSelectedInk] =
    useState("blue");


  /*
   * =========================================================
   * HANDWRITING CONTROLS
   * =========================================================
   */

  const [fontSize, setFontSize] =
    useState(22);

  const [letterSpacing, setLetterSpacing] =
    useState(0);

  const [lineSpacing, setLineSpacing] =
    useState(1.5);

  const [wordSpacing, setWordSpacing] =
    useState(4);

  const [inkOpacity, setInkOpacity] =
    useState(0.9);

  const [naturalVariation, setNaturalVariation] =
    useState(true);


  /*
   * =========================================================
   * CONVERT DOCUMENT
   * =========================================================
   */

  const handwritingDocument = useMemo(() => {

    if (!document) {
      return null;
    }

    try {

      return convertDocumentToHandwritingDocument(
        document
      );

    } catch (error) {

      console.error(
        "Failed to prepare handwriting document:",
        error
      );

      return null;
    }

  }, [document]);


  /*
   * =========================================================
   * DOCUMENT NOT FOUND
   * =========================================================
   */

  if (
    !document ||
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

            <h1 className="text-2xl font-bold text-slate-900">
              Document not found
            </h1>

            <p className="mt-2 text-slate-600">
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

          <h1 className="text-2xl font-bold text-slate-900">
            Generate Handwriting
          </h1>

          <p className="mt-1 text-sm text-slate-600">
            Convert your saved document into handwritten
            content.
          </p>

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

          <aside className="h-fit space-y-6">

            {/* BASIC SETTINGS */}

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

              <h2 className="text-lg font-semibold text-slate-900">
                Handwriting Settings
              </h2>

              <div className="mt-6">

                <HandwritingSettings
                  selectedFont={selectedFont}
                  setSelectedFont={setSelectedFont}

                  selectedPaper={selectedPaper}
                  setSelectedPaper={setSelectedPaper}

                  selectedInk={selectedInk}
                  setSelectedInk={setSelectedInk}
                />

              </div>

            </div>


            {/* HANDWRITING CONTROLS */}

            <HandwritingControls
              fontSize={fontSize}
              setFontSize={setFontSize}

              letterSpacing={letterSpacing}
              setLetterSpacing={setLetterSpacing}

              lineSpacing={lineSpacing}
              setLineSpacing={setLineSpacing}

              wordSpacing={wordSpacing}
              setWordSpacing={setWordSpacing}

              inkOpacity={inkOpacity}
              setInkOpacity={setInkOpacity}

              naturalVariation={naturalVariation}
              setNaturalVariation={
                setNaturalVariation
              }
            />


            {/* DOCUMENT INFORMATION */}

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

              <h3 className="text-sm font-semibold text-slate-900">
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

              </div>

            </div>

          </aside>


          {/* =================================================
              RIGHT PREVIEW
              ================================================= */}

          <section className="min-w-0">

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

                <h2 className="text-lg font-semibold text-slate-900">
                  Preview
                </h2>

                <p className="text-sm text-slate-500">
                  Adjust the controls to customize your
                  handwriting.
                </p>

              </div>


              <button
                type="button"
                disabled
                className="
                  cursor-not-allowed
                  rounded-lg
                  bg-indigo-600
                  px-5
                  py-2.5
                  text-sm
                  font-medium
                  text-white
                  opacity-50
                "
              >
                Generate PDF
              </button>

            </div>


            <HandwritingPreview
              document={handwritingDocument}

              font={selectedFont}

              paper={selectedPaper}

              ink={selectedInk}

              fontSize={fontSize}

              letterSpacing={letterSpacing}

              lineSpacing={lineSpacing}

              wordSpacing={wordSpacing}

              inkOpacity={inkOpacity}

              naturalVariation={
                naturalVariation
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