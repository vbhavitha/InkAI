import { EditorContent } from "@tiptap/react";

function RichTextEditor({ editor }) {
  if (!editor) {
    return (
      <div className="min-h-[297mm] px-[20mm] py-[20mm] text-slate-400">
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