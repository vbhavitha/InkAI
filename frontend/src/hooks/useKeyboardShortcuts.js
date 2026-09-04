import { useEffect } from "react";

function useKeyboardShortcuts({
  editor,
  onFind,
  onSave,
}) {
  useEffect(() => {
    if (!editor) return;

    const handleKeyDown = (event) => {
      const isCtrlOrCmd = event.ctrlKey || event.metaKey;

      if (!isCtrlOrCmd) return;

      const key = event.key.toLowerCase();

      // Ctrl + S → Save
      if (key === "s") {
        event.preventDefault();
        event.stopPropagation();

        onSave?.();
        return;
      }

      // Ctrl + F → Find
      if (key === "f") {
        event.preventDefault();
        event.stopPropagation();

        onFind?.();
        return;
      }

      // Ctrl + A → Select all editor content
      if (key === "a") {
        event.preventDefault();
        event.stopPropagation();

        editor.commands.selectAll();
        return;
      }

      // Ctrl + B → Bold
      if (key === "b") {
        event.preventDefault();
        event.stopPropagation();

        editor.chain().focus().toggleBold().run();
        return;
      }

      // Ctrl + I → Italic
      if (key === "i") {
        event.preventDefault();
        event.stopPropagation();

        editor.chain().focus().toggleItalic().run();
        return;
      }

      // Ctrl + U → Underline
      if (key === "u") {
        event.preventDefault();
        event.stopPropagation();

        editor.chain().focus().toggleUnderline().run();
        return;
      }

      // Ctrl + Z → Undo
      if (key === "z" && !event.shiftKey) {
        event.preventDefault();
        event.stopPropagation();

        editor.chain().focus().undo().run();
        return;
      }

      // Ctrl + Y → Redo
      if (key === "y") {
        event.preventDefault();
        event.stopPropagation();

        editor.chain().focus().redo().run();
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [editor, onFind, onSave]);
}

export default useKeyboardShortcuts;