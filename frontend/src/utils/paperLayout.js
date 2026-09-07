import {
  PAPER_STYLES,
  MARGIN_OPTIONS,
} from "../components/assignment/PaperSelector";

export function getPaperConfig(paperId = "ruled") {
  return (
    PAPER_STYLES.find((paper) => paper.id === paperId) ||
    PAPER_STYLES.find((paper) => paper.id === "ruled")
  );
}

export function getMarginConfig(marginId = "normal") {
  return (
    MARGIN_OPTIONS.find((margin) => margin.id === marginId) ||
    MARGIN_OPTIONS.find((margin) => margin.id === "normal")
  );
}

export function getEffectiveLeftMargin(
  paperId = "ruled",
  marginId = "normal"
) {
  const paper = getPaperConfig(paperId);
  const margin = getMarginConfig(marginId);

  // Plain / graph paper should keep their normal left position.
  if (!paper.showVerticalMargin) {
    return paper.leftMargin;
  }

  return paper.leftMargin + margin.width;
}

export function getBaselineY(
  paperId = "ruled",
  lineIndex = 0
) {
  const paper = getPaperConfig(paperId);

  return (
    paper.topMargin +
    paper.baselineOffset +
    lineIndex * paper.lineHeight
  );
}

export function getWritingX(
  paperId = "ruled",
  marginId = "normal"
) {
  return getEffectiveLeftMargin(paperId, marginId);
}

export function getLineHeight(paperId = "ruled") {
  return getPaperConfig(paperId).lineHeight;
}

export function getBaselineOffset(paperId = "ruled") {
  return getPaperConfig(paperId).baselineOffset;
}

export function getPaperMargins(
  paperId = "ruled",
  marginId = "normal"
) {
  const paper = getPaperConfig(paperId);

  return {
    top: paper.topMargin,
    right: 50,
    bottom: 56,
    left: getEffectiveLeftMargin(paperId, marginId),
  };
}