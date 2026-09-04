import { useEffect } from "react";

function useAutoSave(
  content,
  saveFunction,
  delay = 2000
) {
  useEffect(() => {
    if (!content) {
      return;
    }

    const timeout = setTimeout(() => {
      saveFunction(content);
    }, delay);

    return () => {
      clearTimeout(timeout);
    };
  }, [content, saveFunction, delay]);
}

export default useAutoSave;