export function ocrToTiptap(ocrResult) {
  try {
    if (!ocrResult || typeof ocrResult !== "object") {
      return {
        type: "doc",
        content: [
          {
            type: "paragraph",
          },
        ],
      };
    }

    const paragraphs = Array.isArray(ocrResult.paragraphs)
      ? ocrResult.paragraphs
      : [];

    if (paragraphs.length > 0) {
      const content = paragraphs
        .map((paragraph) => {
          const text = String(paragraph?.text || "").trim();

          if (!text) {
            return null;
          }

          return {
            type: "paragraph",
            content: [
              {
                type: "text",
                text,
              },
            ],
          };
        })
        .filter(Boolean);

      if (content.length > 0) {
        return {
          type: "doc",
          content,
        };
      }
    }

    // Fallback to full_text
    const fullText = String(ocrResult.full_text || "").trim();

    if (fullText) {
      const paragraphsFromText = fullText
        .split(/\n\s*\n/)
        .map((text) => text.trim())
        .filter(Boolean)
        .map((text) => ({
          type: "paragraph",
          content: [
            {
              type: "text",
              text,
            },
          ],
        }));

      return {
        type: "doc",
        content:
          paragraphsFromText.length > 0
            ? paragraphsFromText
            : [
                {
                  type: "paragraph",
                  content: [
                    {
                      type: "text",
                      text: fullText,
                    },
                  ],
                },
              ],
      };
    }

    return {
      type: "doc",
      content: [
        {
          type: "paragraph",
        },
      ],
    };
  } catch (error) {
    console.error("OCR → TipTap conversion failed:", error);

    return {
      type: "doc",
      content: [
        {
          type: "paragraph",
        },
      ],
    };
  }
}