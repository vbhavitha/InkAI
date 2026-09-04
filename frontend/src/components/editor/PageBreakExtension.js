import { Node } from "@tiptap/core";

const PageBreakExtension = Node.create({
  name: "pageBreak",

  group: "block",

  atom: true,

  selectable: true,

  defining: true,

  parseHTML() {
    return [
      {
        tag: 'div[data-page-break]',
      },
    ];
  },

  renderHTML() {
    return [
      "div",
      {
        "data-page-break": "",
        class: "inkai-page-break",
      },
    ];
  },

  addCommands() {
    return {
      insertPageBreak:
        () =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
          });
        },
    };
  },
});

export default PageBreakExtension;