import { useCallback, useEffect, useRef, useState } from "react";

const AUTO_SAVE_DELAY = 1500;

function useAutoSave({
  editor,
  documentId = "default",
  documentTitle = "Untitled Document",
}) {
  const [saveStatus, setSaveStatus] = useState("saved");
  const [lastSavedAt, setLastSavedAt] = useState(null);

  const timerRef = useRef(null);
  const titleRef = useRef(documentTitle);

  useEffect(() => {
    titleRef.current = documentTitle;
  }, [documentTitle]);

  const saveDocument = useCallback(() => {
    if (!editor) return false;

    try {
      const documentData = {
        id: documentId,
        title: titleRef.current,
        content: editor.getJSON(),
        text: editor.getText(),
        updatedAt: new Date().toISOString(),
      };

      localStorage.setItem(
        `inkai-document-${documentId}`,
        JSON.stringify(documentData)
      );

      const savedTime = new Date();

      setLastSavedAt(savedTime);
      setSaveStatus(navigator.onLine ? "saved" : "offline");

      return true;
    } catch (error) {
      console.error("Auto-save failed:", error);

      setSaveStatus("error");

      return false;
    }
  }, [editor, documentId]);

  /*
   * Autosave after the user stops typing.
   */
  useEffect(() => {
    if (!editor) return;

    const handleEditorUpdate = () => {
      setSaveStatus("saving");

      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      timerRef.current = setTimeout(() => {
        saveDocument();
      }, AUTO_SAVE_DELAY);
    };

    editor.on("update", handleEditorUpdate);

    return () => {
      editor.off("update", handleEditorUpdate);

      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [editor, saveDocument]);

  /*
   * Handle online/offline changes.
   */
  useEffect(() => {
    if (!editor) return;

    const handleOnline = () => {
      setSaveStatus("saving");

      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      timerRef.current = setTimeout(() => {
        saveDocument();
      }, 300);
    };

    const handleOffline = () => {
      setSaveStatus("offline");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    if (!navigator.onLine) {
      setSaveStatus("offline");
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);

      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [editor, saveDocument]);

  return {
    saveStatus,
    lastSavedAt,
    saveNow: saveDocument,
  };
}

export default useAutoSave;