import { Image } from "@tiptap/extension-image";

const CustomImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),

      alignment: {
        default: "left",

        parseHTML: (element) => {
          return (
            element.getAttribute("data-alignment") ||
            "left"
          );
        },

        renderHTML: (attributes) => {
          const alignment =
            attributes.alignment || "left";

          let style = "";

          if (alignment === "center") {
            style =
              "display:block;margin-left:auto;margin-right:auto;";
          } else if (alignment === "right") {
            style =
              "display:block;margin-left:auto;margin-right:0;";
          } else {
            style =
              "display:block;margin-left:0;margin-right:auto;";
          }

          return {
            "data-alignment": alignment,
            style,
          };
        },
      },
    };
  },
});

export default CustomImage;