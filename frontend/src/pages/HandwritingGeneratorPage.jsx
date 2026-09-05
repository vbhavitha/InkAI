import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

import HandwritingSettings from "../components/handwriting/HandwritingSettings";
import HandwritingPreview from "../components/handwriting/HandwritingPreview";

import {
  convertDocumentToHandwritingDocument,
} from "../services/handwritingDocumentService";

import PaperSelector from "../components/handwriting/PaperSelector";
import InkSelector from "../components/handwriting/InkSelector";


function HandwritingGeneratorPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const document =
    location.state?.document || null;


  /*
   * =========================================================
   * HANDWRITING SETTINGS
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
   * CONVERT PHASE 6 DOCUMENT
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

  if (!document || !handwritingDocument) {
    return (
      <div className="min-h-screen bg-slate-100">

        <Navbar />

        <main className="flex min-h-[70vh] items-center justify-center px-6">

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
   * RENDER
   * =========================================================
   */

  return (
    <div className="min-h-screen bg-slate-100">

      <Navbar />


      {/* HEADER */}

      <header className="border-b border-slate-200 bg-white">

        <div className="mx-auto max-w-[1600px] px-6 py-6">

          <h1 className="text-2xl font-bold text-slate-900">
            Generate Handwriting
          </h1>

          <p className="mt-1 text-sm text-slate-600">
            Convert your saved document into
            handwritten content.
          </p>

        </div>

      </header>


      {/* MAIN */}

      <main className="mx-auto max-w-[1600px] px-6 py-8">

        <div className="grid gap-8 lg:grid-cols-[320px_1fr]">


          {/* SETTINGS */}

          <aside className="h-fit rounded-xl border border-slate-200 bg-white p-6 shadow-sm">

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


            {/* DOCUMENT INFO */}

            <div className="mt-8 border-t border-slate-200 pt-6">

              <h3 className="text-sm font-semibold text-slate-900">
                Document
              </h3>

              <p className="mt-2 text-sm text-slate-600">
                {handwritingDocument.title}
              </p>

              <div className="mt-4 space-y-2 text-xs text-slate-500">

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


          {/* PREVIEW */}

          <section>

            <div className="mb-4 flex items-center justify-between">

              <div>

                <h2 className="text-lg font-semibold text-slate-900">
                  Preview
                </h2>

                <p className="text-sm text-slate-500">
                  Your document structure is preserved.
                </p>

              </div>

              <button
                type="button"
                disabled
                className="
                  rounded-lg
                  bg-indigo-600
                  px-5
                  py-2.5
                  text-sm
                  font-medium
                  text-white
                  opacity-50
                  cursor-not-allowed
                "
              >
                Generate PDF
              </button>

            </div>

            <HandwritingPreview
              document={handwritingDocument}
              font={selectedFont}
              paper={selectedPaper}
            />

          </section>

        </div>

      </main>


      <Footer />

    </div>
  );
}

export default HandwritingGeneratorPage;