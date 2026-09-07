import React from "react";

import {
  getPaperConfig,
} from "../../utils/paperLayout";

function WritingArea({
  paperStyle,
  content,
  className = "",
  fontSizeClass = "text-sm",
}) {
  const paper =
    getPaperConfig(paperStyle);

  return (
    <div
      className={`whitespace-pre-wrap ${fontSizeClass} ${className}`}
      style={{
        lineHeight:
          `${paper.lineHeight}px`,

        paddingTop:
          `${paper.baselineOffset}px`,

        marginLeft:
          `${paper.leftMargin}px`,
      }}
    >
      {content ||
        "Your assignment content will appear here as you type."}
    </div>
  );
}

export default WritingArea;