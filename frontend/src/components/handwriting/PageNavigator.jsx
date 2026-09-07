import React from "react";
import {
  ChevronLeft,
  ChevronRight,
  FileText,
} from "lucide-react";

function PageNavigator({
  pages = [],
  selectedPage = 0,
  onPageSelect,
}) {
  const pageCount = pages.length;

  if (pageCount === 0) {
    return null;
  }

  const safeSelectedPage = Math.max(
    0,
    Math.min(selectedPage, pageCount - 1)
  );

  const goToPreviousPage = () => {
    if (safeSelectedPage <= 0) {
      return;
    }

    if (typeof onPageSelect === "function") {
      onPageSelect(safeSelectedPage - 1);
    }
  };

  const goToNextPage = () => {
    if (safeSelectedPage >= pageCount - 1) {
      return;
    }

    if (typeof onPageSelect === "function") {
      onPageSelect(safeSelectedPage + 1);
    }
  };

  const getPageDataUrl = (page) => {
    if (!page) {
      return "";
    }

    /*
     * Supports both:
     *
     * {
     *   pageNumber: 1,
     *   dataUrl: "data:image/png..."
     * }
     *
     * and a direct data URL string.
     */

    if (typeof page === "string") {
      return page;
    }

    return page.dataUrl || "";
  };

  const getPageNumber = (page, index) => {
    if (
      page &&
      typeof page === "object" &&
      page.pageNumber
    ) {
      return page.pageNumber;
    }

    return index + 1;
  };

  return (
    <div
      className="
        border-b
        border-slate-200
        bg-white
        dark:border-slate-800
        dark:bg-slate-900
      "
    >
      {/* =====================================================
          NAVIGATION HEADER
          ===================================================== */}

      <div
        className="
          flex
          items-center
          justify-between
          px-4
          py-2.5
        "
      >
        {/* Page information */}

        <div className="flex items-center gap-2">
          <div
            className="
              flex
              h-7
              w-7
              items-center
              justify-center
              rounded-md
              bg-indigo-50
              dark:bg-indigo-950
            "
          >
            <FileText
              size={14}
              className="text-indigo-600 dark:text-indigo-400"
            />
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">
              Pages
            </p>

            <p className="text-[10px] text-slate-400">
              Page {safeSelectedPage + 1} of{" "}
              {pageCount}
            </p>
          </div>
        </div>

        {/* Previous / Next */}

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={goToPreviousPage}
            disabled={safeSelectedPage === 0}
            className="
              flex
              h-8
              w-8
              items-center
              justify-center
              rounded-lg
              border
              border-slate-200
              bg-white
              text-slate-600
              transition
              hover:bg-slate-50
              disabled:cursor-not-allowed
              disabled:opacity-30
              dark:border-slate-700
              dark:bg-slate-900
              dark:text-slate-300
              dark:hover:bg-slate-800
            "
            title="Previous page"
            aria-label="Previous page"
          >
            <ChevronLeft size={16} />
          </button>

          <span
            className="
              min-w-[58px]
              text-center
              text-xs
              font-medium
              text-slate-600
              dark:text-slate-300
            "
          >
            {safeSelectedPage + 1} / {pageCount}
          </span>

          <button
            type="button"
            onClick={goToNextPage}
            disabled={
              safeSelectedPage ===
              pageCount - 1
            }
            className="
              flex
              h-8
              w-8
              items-center
              justify-center
              rounded-lg
              border
              border-slate-200
              bg-white
              text-slate-600
              transition
              hover:bg-slate-50
              disabled:cursor-not-allowed
              disabled:opacity-30
              dark:border-slate-700
              dark:bg-slate-900
              dark:text-slate-300
              dark:hover:bg-slate-800
            "
            title="Next page"
            aria-label="Next page"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* =====================================================
          PAGE THUMBNAILS
          ===================================================== */}

      <div
        className="
          flex
          gap-3
          overflow-x-auto
          px-4
          pb-3
          pt-1
        "
      >
        {pages.map((page, index) => {
          const pageNumber =
            getPageNumber(page, index);

          const dataUrl =
            getPageDataUrl(page);

          const isSelected =
            index === safeSelectedPage;

          return (
            <button
              key={`${pageNumber}-${index}`}
              type="button"
              onClick={() => {
                if (
                  typeof onPageSelect ===
                  "function"
                ) {
                  onPageSelect(index);
                }
              }}
              className={`
                group
                relative
                shrink-0
                overflow-hidden
                rounded-lg
                border-2
                bg-white
                shadow-sm
                transition-all
                ${
                  isSelected
                    ? "border-indigo-500 shadow-md ring-2 ring-indigo-100"
                    : "border-slate-200 hover:border-indigo-300 hover:shadow"
                }
              `}
              title={`Go to page ${pageNumber}`}
              aria-label={`Go to page ${pageNumber}`}
              aria-current={
                isSelected
                  ? "page"
                  : undefined
              }
            >
              {/* Thumbnail */}

              {dataUrl ? (
                <img
                  src={dataUrl}
                  alt={`Page ${pageNumber}`}
                  className="
                    block
                    h-28
                    w-[78px]
                    object-cover
                    object-top
                    bg-white
                  "
                />
              ) : (
                <div
                  className="
                    flex
                    h-28
                    w-[78px]
                    items-center
                    justify-center
                    bg-slate-50
                  "
                >
                  <FileText
                    size={20}
                    className="text-slate-300"
                  />
                </div>
              )}

              {/* Page number */}

              <div
                className={`
                  absolute
                  bottom-0
                  left-0
                  right-0
                  px-1
                  py-1
                  text-center
                  text-[9px]
                  font-semibold
                  ${
                    isSelected
                      ? "bg-indigo-600 text-white"
                      : "bg-black/50 text-white"
                  }
                `}
              >
                Page {pageNumber}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default PageNavigator;