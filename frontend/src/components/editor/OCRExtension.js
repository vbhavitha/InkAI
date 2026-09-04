import { Extension } from "@tiptap/core";

const OCRExtension = Extension.create({
  name: "ocrCorrection",

  addProseMirrorPlugins() {
    return [];
  },
});

export default OCRExtension;