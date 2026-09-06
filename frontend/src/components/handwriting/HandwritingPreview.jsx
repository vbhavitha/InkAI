import React, { useMemo } from "react";

import handwritingFonts from "../../data/handwritingFonts";

import HandwritingCanvas from "./HandwritingCanvas";


function HandwritingPreview({
  document,
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
   * RESOLVE FONT
   * =========================================================
   *
   * selectedFont is an ID such as:
   *
   * "inkai-default"
   *
   * HandwritingCanvas needs the complete font object.
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
   * CONVERT BLOCKS TO TEXT
   * =========================================================
   */

  const handwritingText = useMemo(() => {

    const blocks =
      document.blocks || [];

    const textParts = [];


    blocks.forEach((block) => {

      if (!block) {
        return;
      }


      /*
       * HEADING
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
       * PARAGRAPH
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
       * BULLET LIST
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
       * ORDERED LIST
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
       * PAGE BREAK
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
       * IMAGE
       *
       * Images remain unsupported in the canvas
       * renderer for now.
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
   * CANVAS
   * =========================================================
   */

  return (
    <HandwritingCanvas
      text={handwritingText}

      style={selectedFontObject}

      fontSize={fontSize}

      paperStyle={paper}

      inkStyle={ink}

      letterSpacing={letterSpacing}

      lineSpacing={lineSpacing}

      wordSpacing={wordSpacing}

      inkOpacity={inkOpacity}

      naturalVariation={
        naturalVariation
      }
    />
  );
}


export default HandwritingPreview;