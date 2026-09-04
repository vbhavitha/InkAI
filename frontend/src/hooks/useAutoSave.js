import { useCallback, useEffect, useRef, useState } from "react";

const AUTO_SAVE_DELAY = 1500;

function useAutoSave({
  editor,
  documentId = "default",
  documentTitle = "Untitled Document",
}) {
  const [saveStatus, setSaveStatus] = useState("saved");

  const timerRef = useRef(null);

  /*
   * Keep the latest document title available
   * without recreating the save listener.
   */
  const titleRef = useRef(documentTitle);

  useEffect(() => {
    titleRef.current = documentTitle;
  }, [documentTitle]);

  /*
   * =========================================================
   * SAVE DOCUMENT
   * =========================================================
   */

  const saveDocument = useCallback(() => {
    if (!editor) {
      return false;
    }

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

      if (navigator.onLine) {
        setSaveStatus("saved");
      } else {
        setSaveStatus("offline");
      }

      return true;
    } catch (error) {
      console.error("Auto-save failed:", error);

      setSaveStatus("error");

      return false;
    }
  }, [editor, documentId]);

  /*
   * =========================================================
   * DEBOUNCED AUTO SAVE
   * =========================================================
   */

  useEffect(() => {
    if (!editor) {
      return;
    }

    const handleEditorUpdate = () => {
      setSaveStatus("saving");

      /*
       * Cancel the previous save timer.
       */
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      /*
       * Start a new timer.
       *
       * The document is saved only after the user
       * stops typing for 1.5 seconds.
       */
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
   * =========================================================
   * ONLINE / OFFLINE
   * =========================================================
   */

  useEffect(() => {
    if (!editor) {
      return;
    }

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

    window.addEventListener(
      "online",
      handleOnline
    );

    window.addEventListener(
      "offline",
      handleOffline
    );

    /*
     * Show the correct initial state.
     */
    if (!navigator.onLine) {
      setSaveStatus("offline");
    }

    return () => {
      window.removeEventListener(
        "online",
        handleOnline
      );

      window.removeEventListener(
        "offline",
        handleOffline
      );

      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [editor, saveDocument]);

  /*
   * =========================================================
   * RETURN
   * =========================================================
   */

  return {
    saveStatus,
    saveNow: saveDocument,
  };
}

export default useAutoSave;