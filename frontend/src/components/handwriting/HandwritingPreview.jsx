import React, { useMemo } from "react";

import handwritingFonts from "../../data/handwritingFonts";

import HandwritingCanvas from "./HandwritingCanvas";
import PageNavigator from "./PageNavigator";


/*
 * =========================================================
 * HANDWRITING PREVIEW
 * =========================================================
 *
 * Responsible for:
 *
 * 1. Receiving the structured handwriting document
 * 2. Resolving the selected handwriting font
 * 3. Passing the COMPLETE structured document to the canvas
 * 4. Passing deterministic rendering configuration
 * 5. Displaying the PageNavigator
 * 6. Passing page selection / page generation callbacks
 *
 * IMPORTANT:
 *
 * This component MUST NOT flatten the document into text.
 *
 * Pipeline:
 *
 * TipTap JSON
 *      ↓
 * Document Service
 *      ↓
 * Structured Handwriting Document
 *      ↓
 * HandwritingPreview
 *      ↓
 * ┌───────────────────────┐
 * │    PageNavigator      │
 * └───────────┬───────────┘
 *             ↓
 * ┌───────────────────────┐
 * │   HandwritingCanvas   │
 * └───────────────────────┘
 *
 * Supported structures:
 *
 * - Heading
 * - Paragraph
 * - Bullet list
 * - Ordered list
 * - Table
 * - Image
 * - Manual page break
 *
 * The actual handwriting variation is handled by the
 * deterministic renderer.
 * =========================================================
 */


function HandwritingPreview({
  /*
   * =========================================================
   * STRUCTURED DOCUMENT
   * =========================================================
   */

  document,


  /*
   * =========================================================
   * DOCUMENT ID
   * =========================================================
   *
   * Used for deterministic rendering.
   */

  documentId,


  /*
   * =========================================================
   * SELECTED FONT
   * =========================================================
   */

  font,


  /*
   * =========================================================
   * PAPER / INK
   * =========================================================
   */

  paper,
  ink,


  /*
   * =========================================================
   * BASIC HANDWRITING SETTINGS
   * =========================================================
   */

  fontSize = 22,
  letterSpacing = 0,
  lineSpacing = 1.5,
  wordSpacing = 4,
  inkOpacity = 0.9,
  naturalVariation = true,


  /*
   * =========================================================
   * PHASE 7 — NATURALNESS
   * =========================================================
   *
   * Expected range:
   *
   * 0.0 → 1.0
   *
   * 0.0 = uniform
   * 0.25 = subtle
   * 0.50 = natural
   * 0.75 = noticeable
   * 1.0 = strong
   */

  naturalness = 0.5,


  /*
   * =========================================================
   * DETERMINISTIC RANDOM SEED
   * =========================================================
   */

  seed = 12345,


  /*
   * =========================================================
   * PRESET / STYLE
   * =========================================================
   */

  style = "school_notebook",


  /*
   * =========================================================
   * ASSIGNMENT MODE
   * =========================================================
   */

  assignmentMode = false,

  assignmentDetails = {
    studentName: "",
    rollNumber: "",
    subject: "",
    className: "",
    teacher: "",
    assignmentTitle: "",
  },


  /*
   * =========================================================
   * PAGE CONTROLS
   * =========================================================
   *
   * pages:
   *   Array containing generated page previews.
   *
   * selectedPage:
   *   Zero-based selected page index.
   *
   * onPagesChange:
   *   Called by HandwritingCanvas whenever pages change.
   *
   * onPageSelect:
   *   Called when the user selects a page.
   */

  pages = [],

  selectedPage = 0,

  onPagesChange,

  onPageSelect,
}) {


  /*
   * =========================================================
   * RESOLVE FONT
   * =========================================================
   *
   * Keep this hook before conditional returns.
   */

  const selectedFontObject = useMemo(() => {
    return (
      handwritingFonts.find(
        (item) =>
          item.id === font
      ) ||
      handwritingFonts[0] ||
      null
    );
  }, [font]);


  /*
   * =========================================================
   * DOCUMENT CHECK
   * =========================================================
   */

  if (!document) {
    return (
      <div
        className="
          flex
          min-h-[500px]
          items-center
          justify-center
          rounded-xl
          border
          border-slate-200
          bg-white
          text-sm
          text-slate-500
          dark:border-slate-800
          dark:bg-slate-900
          dark:text-slate-400
        "
      >
        No document available.
      </div>
    );
  }


  /*
   * =========================================================
   * FONT CHECK
   * =========================================================
   */

  if (!selectedFontObject) {
    return (
      <div
        className="
          flex
          min-h-[500px]
          items-center
          justify-center
          rounded-xl
          border
          border-red-200
          bg-red-50
          text-sm
          text-red-600
          dark:border-red-900
          dark:bg-red-950
          dark:text-red-400
        "
      >
        No handwriting font available.
      </div>
    );
  }


  /*
   * =========================================================
   * STABLE DOCUMENT ID
   * =========================================================
   *
   * Preferred:
   *
   * documentId prop
   *      ↓
   * document.id
   *      ↓
   * document._id
   *      ↓
   * fallback
   *
   * This value participates in deterministic rendering.
   */

  const stableDocumentId =
    documentId ||
    document.id ||
    document._id ||
    "inkai-preview-document";


  /*
   * =========================================================
   * NORMALIZE NATURALNESS
   * =========================================================
   *
   * Protect the renderer from invalid values.
   *
   * Expected input:
   *
   * 0.0 → 1.0
   */

  const normalizedNaturalness =
    Math.max(
      0,
      Math.min(
        1,
        Number.isFinite(
          Number(naturalness)
        )
          ? Number(naturalness)
          : 0.5
      )
    );


  /*
   * =========================================================
   * NORMALIZE SEED
   * =========================================================
   *
   * Ensures the renderer always receives a
   * deterministic numeric seed.
   */

  const normalizedSeed =
    Number.isFinite(
      Number(seed)
    )
      ? Number(seed)
      : 12345;


  /*
   * =========================================================
   * SAFE SELECTED PAGE
   * =========================================================
   *
   * Prevents an invalid selected page from being passed
   * to the navigation component or canvas.
   */

  const safeSelectedPage =
    pages.length > 0
      ? Math.max(
          0,
          Math.min(
            Number(selectedPage) || 0,
            pages.length - 1
          )
        )
      : 0;


  /*
   * =========================================================
   * PAGE SELECTION HANDLER
   * =========================================================
   *
   * PageNavigator calls this handler.
   *
   * The parent page remains the source of truth because
   * onPageSelect is forwarded to it.
   */

  const handlePageSelect = (
    pageIndex
  ) => {
    if (
      !Number.isInteger(
        pageIndex
      )
    ) {
      return;
    }

    if (
      pageIndex < 0 ||
      pageIndex >= pages.length
    ) {
      return;
    }

    if (
      typeof onPageSelect ===
      "function"
    ) {
      onPageSelect(
        pageIndex
      );
    }
  };


  /*
   * =========================================================
   * PAGE GENERATION HANDLER
   * =========================================================
   *
   * HandwritingCanvas creates/recreates pages.
   *
   * Forward those pages to the parent.
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

    if (
      typeof onPagesChange ===
      "function"
    ) {
      onPagesChange(
        generatedPages
      );
    }
  };


  /*
   * =========================================================
   * RENDER
   * =========================================================
   */

  return (
    <div
      className="
        overflow-hidden
        rounded-xl
        border
        border-slate-200
        bg-white
        shadow-sm
        dark:border-slate-800
        dark:bg-slate-900
      "
    >

      {/* =====================================================
          PAGE NAVIGATOR
          ===================================================== */}

      <PageNavigator
        pages={
          pages
        }

        selectedPage={
          safeSelectedPage
        }

        onPageSelect={
          handlePageSelect
        }
      />


      {/* =====================================================
          HANDWRITING CANVAS
          ===================================================== */}

      <div
        className="
          bg-slate-100
          p-4
          dark:bg-slate-950
        "
      >

        <HandwritingCanvas

          /*
           * ===================================================
           * STRUCTURED DOCUMENT
           * ===================================================
           *
           * IMPORTANT:
           *
           * We pass the complete structured document.
           *
           * We do NOT pass:
           *
           * text={document.text}
           *
           * and we do NOT flatten the TipTap document.
           */

          document={
            document
          }


          /*
           * ===================================================
           * DOCUMENT ID
           * ===================================================
           */

          documentId={
            stableDocumentId
          }


          /*
           * ===================================================
           * FONT
           * ===================================================
           *
           * HandwritingCanvas expects the resolved
           * handwriting font object.
           */

          style={
            selectedFontObject
          }


          /*
           * ===================================================
           * HANDWRITING STYLE / PRESET
           * ===================================================
           *
           * This is separate from the font object.
           */

          handwritingStyle={
            style
          }


          /*
           * ===================================================
           * BASIC APPEARANCE
           * ===================================================
           */

          fontSize={
            fontSize
          }

          paperStyle={
            paper
          }

          inkStyle={
            ink
          }


          /*
           * ===================================================
           * HANDWRITING CONTROLS
           * ===================================================
           */

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


          /*
           * ===================================================
           * LEGACY NATURAL VARIATION
           * ===================================================
           *
           * Kept for compatibility with the current canvas.
           */

          naturalVariation={
            naturalVariation
          }


          /*
           * ===================================================
           * PHASE 7 — NATURALNESS
           * ===================================================
           */

          naturalness={
            normalizedNaturalness
          }


          /*
           * ===================================================
           * DETERMINISTIC SEED
           * ===================================================
           */

          seed={
            normalizedSeed
          }


          /*
           * ===================================================
           * ASSIGNMENT MODE
           * ===================================================
           */

          assignmentMode={
            assignmentMode
          }

          assignmentDetails={
            assignmentDetails
          }


          /*
           * ===================================================
           * PAGE STATE
           * ===================================================
           */

          selectedPage={
            safeSelectedPage
          }


          /*
           * ===================================================
           * PAGE CALLBACKS
           * ===================================================
           *
           * Canvas → Preview → Generator Page
           */

          onPagesChange={
            handlePagesChange
          }

          onPageSelect={
            handlePageSelect
          }

        />

      </div>

    </div>
  );
}


export default HandwritingPreview;