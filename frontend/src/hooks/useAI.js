import { useCallback, useState } from "react";

import aiService from "../services/aiService";

export default function useAI() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const execute = useCallback(
    async (operation) => {
      setLoading(true);
      setError(null);

      try {
        const data = await operation();

        setResult(data);

        return data;
      } catch (err) {
        const message =
          err?.message ||
          "AI operation failed.";

        setError(message);

        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const grammarCorrect = useCallback(
    (text) =>
      execute(() =>
        aiService.grammarCorrect(text)
      ),
    [execute]
  );

  const rewrite = useCallback(
    (text, style) =>
      execute(() =>
        aiService.rewrite(text, style)
      ),
    [execute]
  );

  const summarize = useCallback(
    (text, length) =>
      execute(() =>
        aiService.summarize(text, length)
      ),
    [execute]
  );

  const generateFlashcards = useCallback(
    (text, count) =>
      execute(() =>
        aiService.generateFlashcards(
          text,
          count
        )
      ),
    [execute]
  );

  const generateMCQs = useCallback(
    (text, count, difficulty) =>
      execute(() =>
        aiService.generateMCQs(
          text,
          count,
          difficulty
        )
      ),
    [execute]
  );

  const generateQuestions = useCallback(
    (text, count, type, difficulty) =>
      execute(() =>
        aiService.generateQuestions(
          text,
          count,
          type,
          difficulty
        )
      ),
    [execute]
  );

  const explainTopic = useCallback(
    (text, level) =>
      execute(() =>
        aiService.explainTopic(
          text,
          level
        )
      ),
    [execute]
  );

  const translate = useCallback(
    (text, language) =>
      execute(() =>
        aiService.translate(
          text,
          language
        )
      ),
    [execute]
  );

  const generatePresentation =
    useCallback(
      (text) =>
        execute(() =>
          aiService.generatePresentation(text)
        ),
      [execute]
    );

  const convertToMarkdown = useCallback(
    (text) =>
      execute(() =>
        aiService.convertToMarkdown(text)
      ),
    [execute]
  );

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return {
    loading,
    error,
    result,

    grammarCorrect,
    rewrite,
    summarize,
    generateFlashcards,
    generateMCQs,
    generateQuestions,
    explainTopic,
    translate,
    generatePresentation,
    convertToMarkdown,

    reset,
  };
}