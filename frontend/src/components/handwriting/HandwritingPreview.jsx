function HandwritingPreview({
  document,
  font,
  paper,
}) {
  if (!document) {
    return (
      <div className="text-slate-500">
        No document available.
      </div>
    );
  }

  return (
    <div className="flex justify-center">

      <div
        className={`
          w-[210mm]
          min-h-[297mm]
          bg-white
          p-[20mm]
          shadow-xl
          ${paper === "ruled" ? "inkai-paper-ruled" : ""}
          ${paper === "notebook" ? "inkai-paper-notebook" : ""}
        `}
      >

        <div
          className="inkai-handwriting-preview"
          data-font={font}
        >

          {document.blocks.map(
            (block, index) => {

              if (
                block.type ===
                "heading"
              ) {
                return (
                  <h2
                    key={index}
                    className="mb-4"
                  >
                    {block.text}
                  </h2>
                );
              }


              if (
                block.type ===
                "paragraph"
              ) {
                return (
                  <p
                    key={index}
                    className="mb-4"
                  >
                    {block.text}
                  </p>
                );
              }


              if (
                block.type ===
                "bulletList"
              ) {
                return (
                  <ul
                    key={index}
                    className="mb-4 list-disc pl-6"
                  >
                    {block.items.map(
                      (item, itemIndex) => (
                        <li
                          key={itemIndex}
                        >
                          {item.content
                            ?.map(
                              (child) =>
                                child.text || ""
                            )
                            .join("")}
                        </li>
                      )
                    )}
                  </ul>
                );
              }


              if (
                block.type ===
                "orderedList"
              ) {
                return (
                  <ol
                    key={index}
                    className="mb-4 list-decimal pl-6"
                  >
                    {block.items.map(
                      (item, itemIndex) => (
                        <li
                          key={itemIndex}
                        >
                          {item.content
                            ?.map(
                              (child) =>
                                child.text || ""
                            )
                            .join("")}
                        </li>
                      )
                    )}
                  </ol>
                );
              }


              if (
                block.type ===
                "image"
              ) {
                return (
                  <img
                    key={index}
                    src={block.src}
                    alt={block.alt}
                    className="mb-4 max-w-full"
                    style={{
                      marginLeft:
                        block.alignment ===
                        "center"
                          ? "auto"
                          : block.alignment ===
                            "right"
                            ? "auto"
                            : "0",

                      marginRight:
                        block.alignment ===
                        "center"
                          ? "auto"
                          : block.alignment ===
                            "right"
                            ? "0"
                            : "auto",

                      width:
                        block.width
                          ? `${block.width}px`
                          : undefined,
                    }}
                  />
                );
              }


              if (
                block.type ===
                "pageBreak"
              ) {
                return (
                  <div
                    key={index}
                    className="h-8"
                  />
                );
              }


              return null;
            }
          )}

        </div>

      </div>

    </div>
  );
}

export default HandwritingPreview;