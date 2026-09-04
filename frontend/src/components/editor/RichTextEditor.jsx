import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

function RichTextEditor() {
  const editor = useEditor({
    extensions: [
      StarterKit,
    ],

    content: `
      <h2>InkAI Document</h2>
      <p>Start editing your document here...</p>
    `,

    editorProps: {
      attributes: {
        class:
          "min-h-[600px] p-8 focus:outline-none text-slate-900 bg-white",
      },
    },
  });

  if (!editor) {
    return null;
  }

  return (
    <div className="rounded-xl overflow-hidden border border-slate-700 shadow-lg">
      <EditorContent editor={editor} />
    </div>
  );
}

export default RichTextEditor;