const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://127.0.0.1:8000";

async function request(endpoint, body) {
  const response = await fetch(
    `${API_BASE_URL}/api/ai${endpoint}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );

  let data = {};

  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new Error(
      data.detail ||
      "AI request failed."
    );
  }

  return data;
}


// ------------------------------------------------------------
// Grammar
// ------------------------------------------------------------

export async function grammarCorrect(text) {
  return request("/grammar", {
    text,
  });
}


// ------------------------------------------------------------
// Rewrite
// ------------------------------------------------------------

export async function rewrite(text, style = "simple") {
  return request("/rewrite", {
    text,
    style,
  });
}


// ------------------------------------------------------------
// Summary
// ------------------------------------------------------------

export async function summarize(
  text,
  length = "short"
) {
  return request("/summarize", {
    text,
    length,
  });
}


// ------------------------------------------------------------
// Flashcards
// ------------------------------------------------------------

export async function generateFlashcards(
  text,
  count = 10
) {
  return request("/flashcards", {
    text,
    count,
  });
}


// ------------------------------------------------------------
// MCQs
// ------------------------------------------------------------

export async function generateMCQs(
  text,
  count = 10,
  difficulty = "medium"
) {
  return request("/mcqs", {
    text,
    count,
    difficulty,
  });
}


// ------------------------------------------------------------
// Questions
// ------------------------------------------------------------

export async function generateQuestions(
  text,
  count = 10,
  type = "exam",
  difficulty = "medium"
) {
  return request("/questions", {
    text,
    count,
    type,
    difficulty,
  });
}


// ------------------------------------------------------------
// Explanation
// ------------------------------------------------------------

export async function explainTopic(
  text,
  level = "college_student"
) {
  return request("/explain", {
    text,
    level,
  });
}


// ------------------------------------------------------------
// Translation
// ------------------------------------------------------------

export async function translate(
  text,
  targetLanguage
) {
  return request("/translate", {
    text,
    target_language: targetLanguage,
  });
}


// ------------------------------------------------------------
// Presentation
// ------------------------------------------------------------

export async function generatePresentation(text) {
  const response = await fetch(
    `${API_BASE_URL}/api/ai/presentation`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
      }),
    }
  );

  if (!response.ok) {
    let message = "Presentation generation failed.";

    try {
      const data = await response.json();
      message = data.detail || message;
    } catch {
      // Ignore JSON parsing failure.
    }

    throw new Error(message);
  }

  return response.blob();
}


// ------------------------------------------------------------
// Markdown
// ------------------------------------------------------------

export async function convertToMarkdown(text) {
  return request("/markdown", {
    text,
  });
}


const aiService = {
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
};

export default aiService;