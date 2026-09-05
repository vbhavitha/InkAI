const API_BASE_URL = "http://127.0.0.1:8000";

export function getFontUrl(fontPath) {
  if (!fontPath) {
    return "";
  }

  return `${API_BASE_URL}/fonts/${fontPath}`;
}

export function getStyleFontFamily(styleId) {
  return `InkAI-${styleId}`;
}

export function getFontFileName(fontPath) {
  if (!fontPath) {
    return "";
  }

  return fontPath.split("/").pop();
}