/*
 * ============================================================
 * INKAI — ASSIGNMENT QUALITY UTILITIES
 * ============================================================
 *
 * STEP 33
 *
 * Performs a lightweight pre-generation quality check.
 *
 * The check does NOT modify the assignment.
 * It only verifies that the assignment is ready to generate.
 * ============================================================
 */

/**
 * Safely determine whether structured TipTap content
 * contains usable content.
 */
export function hasAssignmentContent(document) {
  if (!document) {
    return false;
  }

  const content =
    document?.content?.content ||
    document?.content ||
    document?.blocks ||
    [];

  if (!Array.isArray(content)) {
    return false;
  }

  function nodeHasContent(node) {
    if (!node) {
      return false;
    }

    if (
      node.type === "text" &&
      typeof node.text === "string" &&
      node.text.trim()
    ) {
      return true;
    }

    if (Array.isArray(node.content)) {
      return node.content.some(nodeHasContent);
    }

    return false;
  }

  return content.some(nodeHasContent);
}

/**
 * Validate the assignment metadata.
 */
export function hasStudentInformation(assignment) {
  if (!assignment) {
    return false;
  }

  return Boolean(
    assignment.studentName?.trim() &&
      assignment.subject?.trim()
  );
}

/**
 * Validate page/layout configuration.
 */
export function isAssignmentLayoutValid(assignment) {
  if (!assignment) {
    return false;
  }

  const validPaperSizes = [
    "A4",
    "A5",
    "Letter",
  ];

  const validOrientations = [
    "portrait",
    "landscape",
  ];

  const validMargins = [
    "normal",
    "narrow",
    "wide",
    "custom",
  ];

  const validPaperStyles = [
    "plain",
    "ruled",
    "college",
    "graph",
    "margin",
    "notebook",
  ];

  const paperSize =
    assignment.paperSize || "A4";

  const orientation =
    assignment.orientation || "portrait";

  const marginPreset =
    assignment.marginPreset || "normal";

  const paperStyle =
    assignment.paperStyle || "ruled";

  return (
    validPaperSizes.includes(paperSize) &&
    validOrientations.includes(orientation) &&
    validMargins.includes(marginPreset) &&
    validPaperStyles.includes(paperStyle)
  );
}

/**
 * Validate handwriting configuration.
 */
export function hasHandwritingStyle(handwriting) {
  if (!handwriting) {
    return false;
  }

  return Boolean(
    handwriting.style ||
      handwriting.font
  );
}

/**
 * Check whether pagination appears valid.
 *
 * The pagination service is responsible for actual layout
 * calculation. This helper checks the returned structure and
 * recognises explicit overflow flags when provided.
 */
export function hasNoContentOverflow(paginationResult) {
  if (!paginationResult) {
    return false;
  }

  const pages = paginationResult?.pages;

  if (!Array.isArray(pages) || pages.length === 0) {
    return false;
  }

  /*
   * If the backend explicitly reports overflow,
   * respect that information.
   */
  if (
    paginationResult?.hasOverflow === true ||
    paginationResult?.overflow === true
  ) {
    return false;
  }

  for (const page of pages) {
    if (!page) {
      return false;
    }

    if (
      page?.hasOverflow === true ||
      page?.overflow === true
    ) {
      return false;
    }
  }

  return true;
}

/**
 * Complete Assignment Quality Check.
 */
export function runAssignmentQualityCheck({
  document,
  assignment,
  handwriting,
  paginationResult,
}) {
  const contentAvailable =
    hasAssignmentContent(document);

  const studentInformation =
    hasStudentInformation(assignment);

  const pageLayoutValid =
    isAssignmentLayoutValid(assignment);

  const handwritingSelected =
    hasHandwritingStyle(handwriting);

  const noContentOverflow =
    hasNoContentOverflow(
      paginationResult
    );

  const checks = {
    contentAvailable,
    studentInformation,
    pageLayoutValid,
    handwritingSelected,
    noContentOverflow,
  };

  const isReady =
    Object.values(checks).every(Boolean);

  return {
    ...checks,
    isReady,
  };
}