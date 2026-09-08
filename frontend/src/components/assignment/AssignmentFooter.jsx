function AssignmentFooter({
  showFooter = true,
  footerText = "",
  showPageNumber = true,
  pageNumber = 1,
  totalPages = 1,
  pageNumberPosition = "center",
}) {
  if (
    !showFooter &&
    !showPageNumber
  ) {
    return null;
  }

  const positionClass =
    pageNumberPosition === "left"
      ? "justify-start"
      : pageNumberPosition === "right"
        ? "justify-end"
        : "justify-center";

  return (
    <div
      className="
        absolute
        bottom-5
        left-8
        right-8
        border-t
        border-slate-300
        pt-2
        text-[10px]
        text-slate-500
      "
    >

      {showPageNumber && (
        <div
          className={`flex ${positionClass}`}
        >
          <span>
            Page {pageNumber} of {totalPages}
          </span>
        </div>
      )}

      {showFooter && footerText && (
        <div className="mt-1 text-center">
          {footerText}
        </div>
      )}

    </div>
  );
}

export default AssignmentFooter;