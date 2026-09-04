import { EditorContent } from "@tiptap/react";

function RichTextEditor({ editor }) {
  if (!editor) {
    return (
      <div className="inkai-editor-loading">
        Loading editor...
      </div>
    );
  }

  return (
    <EditorContent
      editor={editor}
    />
  );
}

export default RichTextEditor;