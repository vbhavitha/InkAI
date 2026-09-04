import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

import {
  convertDocumentToHandwritingDocument,
} from "../services/handwritingDocumentService";

function HandwritingGeneratorPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const document = location.state?.document;

  const [selectedStyle, setSelectedStyle] = useState("default");

  const handwritingDocument = useMemo(() => {
    if (!document) return null;

    try {
      return convertDocumentToHandwritingDocument(document);
    } catch (error) {
      console.error(
        "Failed to prepare handwriting document:",
        error
      );

      return null;
    }
  }, [document]);

  const handleGenerate = () => {
    if (!handwritingDocument) {
      return;
    }

    /*
     * Phase 7 rendering will be connected here.
     */
    console.log("Generate handwriting:", {
      document: handwritingDocument,
      style: selectedStyle,
    });
  };

  if (!document) {
    return (
      <>
        <Navbar />

        <main className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-xl font-semibold">
              Document not found
            </h1>

            <button
              type="button"
              onClick={() => navigate("/editor")}
              className="mt-4"
            >
              Return to Editor
            </button>
          </div>
        </main>

        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-slate-100 px-6 py-8">
        <div className="mx-auto max-w-6xl">

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900">
              Generate Handwriting
            </h1>

            <p className="mt-2 text-slate-600">
              Convert your edited document into handwriting.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">

            {/* Document information */}
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <h2 className="font-semibold text-slate-900">
                Document
              </h2>

              <p className="mt-3 text-sm text-slate-600">
                {handwritingDocument?.title}
              </p>

              <div className="mt-5 space-y-2 text-sm text-slate-500">
                <div>
                  Words: {handwritingDocument?.wordCount}
                </div>

                <div>
                  Characters:{" "}
                  {handwritingDocument?.characterCount}
                </div>

                <div>
                  Blocks:{" "}
                  {handwritingDocument?.blocks.length}
                </div>
              </div>
            </div>

            {/* Handwriting styles */}
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <h2 className="font-semibold text-slate-900">
                Handwriting Style
              </h2>

              <select
                value={selectedStyle}
                onChange={(event) =>
                  setSelectedStyle(event.target.value)
                }
                className="mt-4 w-full rounded-lg border border-slate-300 px-3 py-2"
              >
                <option value="default">
                  Default Handwriting
                </option>

                <option value="neat">
                  Neat
                </option>

                <option value="casual">
                  Casual
                </option>

                <option value="cursive">
                  Cursive
                </option>
              </select>
            </div>

            {/* Generate */}
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <h2 className="font-semibold text-slate-900">
                Ready
              </h2>

              <p className="mt-3 text-sm text-slate-600">
                Your document structure has been preserved.
              </p>

              <button
                type="button"
                onClick={handleGenerate}
                className="mt-6 w-full rounded-lg px-4 py-3 font-medium"
              >
                Generate Handwriting
              </button>
            </div>

          </div>

          {/* Structure preview */}
          <div className="mt-6 rounded-xl bg-white p-6 shadow-sm">
            <h2 className="font-semibold text-slate-900">
              Document Structure
            </h2>

            <div className="mt-4 space-y-2">
              {handwritingDocument?.blocks.map(
                (block, index) => (
                  <div
                    key={`${block.type}-${index}`}
                    className="rounded-lg bg-slate-50 px-4 py-3 text-sm"
                  >
                    <span className="font-medium">
                      {block.type}
                    </span>

                    {block.text && (
                      <span className="ml-3 text-slate-600">
                        {block.text.slice(0, 100)}
                      </span>
                    )}
                  </div>
                )
              )}
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </>
  );
}

export default HandwritingGeneratorPage;