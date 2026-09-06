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
 * 1. Receiving the saved document
 * 2. Resolving the selected handwriting font
 * 3. Converting document blocks into plain text
 * 4. Passing stable document information to the canvas
 *
 * IMPORTANT:
 *
 * This component does NOT generate random variation.
 *
 * The actual glyph variation is handled by the
 * deterministic variation engine.
 *
 * Preview and download must use the same:
 *
 *      documentId
 *      page number
 *      character index
 *
 * so that the generated handwriting remains identical.
 * =========================================================
 */

function HandwritingPreview({
  document,

  /*
   * Stable document identifier.
   *
   * This should normally come from the saved document.
   */
  documentId,

  font,
  paper,
  ink,

  fontSize = 22,
  letterSpacing = 0,
  lineSpacing = 1.5,
  wordSpacing = 4,
  inkOpacity = 0.9,
  naturalVariation = true,
}) {


  /*
   * =========================================================
   * RESOLVE FONT
   * =========================================================
   *
   * IMPORTANT:
   *
   * Keep hooks before any conditional return.
   *
   * This prevents React's Rules of Hooks from being violated
   * if the document changes from null → available.
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
   * CONVERT DOCUMENT TO TEXT
   * =========================================================
   *
   * The handwriting canvas currently works with text.
   *
   * Convert the structured document into a readable
   * handwritten text representation.
   */

  const handwritingText = useMemo(() => {

    if (!document) {
      return "";
    }

    const blocks =
      document.blocks || [];

    const textParts = [];


    blocks.forEach((block) => {

      if (!block) {
        return;
      }


      /*
       * =====================================================
       * HEADING
       * =====================================================
       */

      if (
        block.type ===
        "heading"
      ) {

        textParts.push(
          block.text || ""
        );

        textParts.push("");

        return;
      }


      /*
       * =====================================================
       * PARAGRAPH
       * =====================================================
       */

      if (
        block.type ===
        "paragraph"
      ) {

        textParts.push(
          block.text || ""
        );

        textParts.push("");

        return;
      }


      /*
       * =====================================================
       * BULLET LIST
       * =====================================================
       */

      if (
        block.type ===
        "bulletList"
      ) {

        const items =
          block.items || [];


        items.forEach((item) => {

          const itemText =
            item.content
              ?.map(
                (child) =>
                  child.text || ""
              )
              .join("") || "";


          textParts.push(
            `• ${itemText}`
          );
        });


        textParts.push("");

        return;
      }


      /*
       * =====================================================
       * ORDERED LIST
       * =====================================================
       */

      if (
        block.type ===
        "orderedList"
      ) {

        const items =
          block.items || [];


        items.forEach(
          (item, index) => {

            const itemText =
              item.content
                ?.map(
                  (child) =>
                    child.text || ""
                )
                .join("") || "";


            textParts.push(
              `${index + 1}. ${itemText}`
            );
          }
        );


        textParts.push("");

        return;
      }


      /*
       * =====================================================
       * PAGE BREAK
       * =====================================================
       *
       * The canvas currently represents a page break
       * using blank lines.
       */

      if (
        block.type ===
        "pageBreak"
      ) {

        textParts.push("");
        textParts.push("");
        textParts.push("");

        return;
      }


      /*
       * =====================================================
       * IMAGE
       * =====================================================
       *
       * Images are intentionally skipped for now.
       *
       * Image rendering can be added later to the
       * handwriting page renderer.
       */

      if (
        block.type ===
        "image"
      ) {
        return;
      }

    });


    return textParts.join("\n");

  }, [document]);


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
   * Step 15
   *
   * The backend variation engine needs a stable identifier.
   *
   * Preferred order:
   *
   *      documentId prop
   *          ↓
   *      document.id
   *          ↓
   *      document._id
   *          ↓
   *      fallback
   *
   * IMPORTANT:
   *
   * This fallback is only for documents that don't yet have
   * a database ID.
   *
   * A real saved document should always have an ID.
   */

  const stableDocumentId =
    documentId ||
    document.id ||
    document._id ||
    "inkai-preview-document";


  /*
   * =========================================================
   * CANVAS
   * =========================================================
   */

  return (
    <HandwritingCanvas
      /*
       * Text
       */
      text={handwritingText}

      /*
       * Stable document identity
       *
       * Used by the deterministic glyph variation engine.
       */
      documentId={
        stableDocumentId
      }

      /*
       * Font
       */
      style={
        selectedFontObject
      }

      /*
       * Basic appearance
       */
      fontSize={fontSize}

      paperStyle={paper}

      inkStyle={ink}

      /*
       * Handwriting controls
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
       * Step 13–17
       *
       * Enables deterministic:
       *
       * - glyph variation
       * - scale variation
       * - baseline variation
       * - rotation
       * - tiny spacing variation
       * - future font variant selection
       */
      naturalVariation={
        naturalVariation
      }
    />
  );
}


export default HandwritingPreview;