import React, { useMemo } from "react";

import handwritingFonts from "../../data/handwritingFonts";

import HandwritingCanvas from "./HandwritingCanvas";


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
 * 5. Passing page-selection / page-generation callbacks
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
 * HandwritingCanvas
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
  document,

  /*
   * Stable document identifier.
   */
  documentId,

  /*
   * Selected handwriting font.
   */
  font,

  /*
   * Paper / ink.
   */
  paper,
  ink,

  /*
   * Basic handwriting settings.
   */
  fontSize = 22,
  letterSpacing = 0,
  lineSpacing = 1.5,
  wordSpacing = 4,
  inkOpacity = 0.9,
  naturalVariation = true,

  /*
   * =========================================================
   * PHASE 7 SETTINGS
   * =========================================================
   */

  /*
   * Naturalness is normalized to:
   *
   * 0.0 → 1.0
   */
  naturalness = 0.5,

  /*
   * Deterministic randomization seed.
   */
  seed = 12345,

  /*
   * Preset/style identifier.
   *
   * Example:
   * school_notebook
   */
  style = "school_notebook",

  /*
   * Assignment Mode.
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
   */

  /*
   * Currently selected page.
   */
  selectedPage = 0,

  /*
   * Called whenever the renderer creates/recreates pages.
   */
  onPagesChange,

  /*
   * Called when the user selects a page.
   */
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
   * The page normally supplies a value between 0 and 1.
   *
   * This extra protection prevents accidental values such
   * as 50 or -1 from reaching the renderer.
   */

  const normalizedNaturalness = Math.max(
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
   * JavaScript numbers are used because the renderer needs
   * a deterministic numeric seed.
   */

  const normalizedSeed =
    Number.isFinite(
      Number(seed)
    )
      ? Number(seed)
      : 12345;


  /*
   * =========================================================
   * CANVAS
   * =========================================================
   *
   * IMPORTANT:
   *
   * Do NOT pass:
   *
   *      text={...}
   *
   * here.
   *
   * The canvas receives the complete structured document.
   */

  return (
    <HandwritingCanvas

      /*
       * =====================================================
       * STRUCTURED DOCUMENT
       * =====================================================
       *
       * This is the critical Phase 7 change.
       *
       * The renderer can now distinguish:
       *
       * heading
       * paragraph
       * bulletList
       * orderedList
       * table
       * image
       * pageBreak
       */

      document={
        document
      }


      /*
       * =====================================================
       * DOCUMENT ID
       * =====================================================
       */

      documentId={
        stableDocumentId
      }


      /*
       * =====================================================
       * FONT
       * =====================================================
       */

      style={
        selectedFontObject
      }


      /*
       * =====================================================
       * PRESET / STYLE ID
       * =====================================================
       *
       * This is separate from the resolved font object.
       *
       * The deterministic renderer can therefore use:
       *
       * Document ID
       * + Style
       * + Seed
       */

      handwritingStyle={
        style
      }


      /*
       * =====================================================
       * BASIC APPEARANCE
       * =====================================================
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
       * =====================================================
       * HANDWRITING CONTROLS
       * =====================================================
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
       * =====================================================
       * LEGACY NATURAL VARIATION
       * =====================================================
       *
       * Kept for compatibility with the existing canvas.
       */

      naturalVariation={
        naturalVariation
      }


      /*
       * =====================================================
       * PHASE 7 NATURALNESS
       * =====================================================
       *
       * 0.0 → uniform
       * 0.25 → subtle
       * 0.50 → natural
       * 0.75 → noticeable
       * 1.0 → strong
       */

      naturalness={
        normalizedNaturalness
      }


      /*
       * =====================================================
       * DETERMINISTIC RANDOM SEED
       * =====================================================
       *
       * Randomize in the parent changes this value.
       *
       * The document itself does NOT change.
       */

      seed={
        normalizedSeed
      }


      /*
       * =====================================================
       * ASSIGNMENT MODE
       * =====================================================
       */

      assignmentMode={
        assignmentMode
      }

      assignmentDetails={
        assignmentDetails
      }


      /*
       * =====================================================
       * PAGE NAVIGATION
       * =====================================================
       */

      selectedPage={
        selectedPage
      }

      onPagesChange={
        onPagesChange
      }

      onPageSelect={
        onPageSelect
      }

    />
  );
}


export default HandwritingPreview;