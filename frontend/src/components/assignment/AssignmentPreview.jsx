import React from "react";

function getAlignmentClass(alignment) {
  if (alignment === "left") return "text-left";
  if (alignment === "right") return "text-right";
  return "text-center";
}

function renderTextMarks(node) {
  let className = "";

  if (node.marks?.some((mark) => mark.type === "bold")) {
    className += " font-bold";
  }

  if (node.marks?.some((mark) => mark.type === "italic")) {
    className += " italic";
  }

  if (node.marks?.some((mark) => mark.type === "underline")) {
    className += " underline";
  }

  if (node.marks?.some((mark) => mark.type === "strike")) {
    className += " line-through";
  }

  return className;
}

function StructuredNode({ node }) {
  if (!node) return null;

  switch (node.type) {
    case "heading":
      return (
        <h2
          className={`mb-4 font-semibold text-slate-900 ${
            node.attrs?.level === 1
              ? "text-2xl"
              : node.attrs?.level === 2
                ? "text-xl"
                : "text-lg"
          }`}
        >
          {(node.content || []).map((child, index) => (
            <React.Fragment key={index}>
              {child.text || ""}
            </React.Fragment>
          ))}
        </h2>
      );

    case "paragraph":
      return (
        <p className="mb-4 min-h-[28px] leading-7 text-slate-800">
          {(node.content || []).map((child, index) => {
            if (child.type === "hardBreak") {
              return <br key={index} />;
            }

            return (
              <span
                key={index}
                className={renderTextMarks(child)}
              >
                {child.text || ""}
              </span>
            );
          })}
        </p>
      );

    case "bulletList":
      return (
        <ul className="mb-4 list-disc space-y-2 pl-7 leading-7 text-slate-800">
          {(node.content || []).map((item, index) => (
            <li key={index}>
              {(item.content || []).map((child, childIndex) => (
                <StructuredNode
                  key={childIndex}
                  node={child}
                />
              ))}
            </li>
          ))}
        </ul>
      );

    case "orderedList":
      return (
        <ol className="mb-4 list-decimal space-y-2 pl-7 leading-7 text-slate-800">
          {(node.content || []).map((item, index) => (
            <li key={index}>
              {(item.content || []).map((child, childIndex) => (
                <StructuredNode
                  key={childIndex}
                  node={child}
                />
              ))}
            </li>
          ))}
        </ol>
      );

    case "table":
      return (
        <div className="mb-5 overflow-hidden rounded border border-slate-300">
          <table className="w-full border-collapse text-sm">
            <tbody>
              {(node.content || []).map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {(row.content || []).map((cell, cellIndex) => (
                    <td
                      key={cellIndex}
                      className="border border-slate-300 p-2 align-top"
                    >
                      {(cell.content || []).map(
                        (child, childIndex) => (
                          <StructuredNode
                            key={childIndex}
                            node={child}
                          />
                        )
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case "image":
      return (
        <div className="mb-5 flex justify-center">
          <img
            src={node.attrs?.src}
            alt={node.attrs?.alt || "Document image"}
            className="max-h-[300px] max-w-full object-contain"
          />
        </div>
      );

    case "hardBreak":
      return <br />;

    case "pageBreak":
      return null;

    default:
      return (
        <>
          {(node.content || []).map((child, index) => (
            <StructuredNode
              key={index}
              node={child}
            />
          ))}
        </>
      );
  }
}

function AssignmentPreview({
  data,
  phase6Document,
  pageNumber = 1,
  totalPages = 1,
}) {
  const structuredBlocks =
    phase6Document?.content?.content ||
    phase6Document?.blocks ||
    [];

  return (
    <div className="relative mx-auto w-full max-w-[794px] bg-white text-slate-900 shadow-2xl">
      {/* Paper */}
      <div className="relative min-h-[1123px] px-14 pb-24 pt-12">

        {/* Header */}
        <div className="mb-8">
          {data.showName && data.studentName && (
            <div className="text-sm">
              <strong>Name:</strong> {data.studentName}
            </div>
          )}

          {data.showRollNumber && data.rollNumber && (
            <div className="text-sm">
              <strong>Roll No:</strong> {data.rollNumber}
            </div>
          )}

          {data.showClass && data.className && (
            <div className="text-sm">
              <strong>Class:</strong> {data.className}
            </div>
          )}

          {data.showSection && data.section && (
            <div className="text-sm">
              <strong>Section:</strong> {data.section}
            </div>
          )}

          {data.showSubject && data.subject && (
            <div className="text-sm">
              <strong>Subject:</strong> {data.subject}
            </div>
          )}

          {data.showDate && data.date && (
            <div className="text-sm">
              <strong>Date:</strong> {data.date}
            </div>
          )}

          {data.showTeacher && data.teacherName && (
            <div className="text-sm">
              <strong>Teacher:</strong> {data.teacherName}
            </div>
          )}
        </div>

        {/* Title */}
        {data.title && (
          <div
            className={`mb-8 ${getAlignmentClass(
              data.titleAlignment
            )}`}
          >
            <h1 className="text-2xl font-bold tracking-wide">
              {data.title}
            </h1>
          </div>
        )}

        {/* Divider */}
        <div className="mb-8 border-b border-slate-300" />

        {/* Structured Phase 6 Content */}
        <div className="text-[16px] leading-7">
          {structuredBlocks.map((node, index) => (
            <StructuredNode
              key={index}
              node={node}
            />
          ))}

          {!structuredBlocks.length && data.content && (
            <div className="whitespace-pre-wrap leading-7">
              {data.content}
            </div>
          )}
        </div>

        {/* Footer */}
        {(data.showFooter || data.showPageNumber) && (
          <div className="absolute bottom-5 left-14 right-14 border-t border-slate-300 pt-2 text-[10px] text-slate-500">
            {data.showPageNumber && (
              <div
                className={
                  data.pageNumberPosition === "left"
                    ? "text-left"
                    : data.pageNumberPosition === "right"
                      ? "text-right"
                      : "text-center"
                }
              >
                Page {pageNumber} of {totalPages}
              </div>
            )}

            {data.showFooter && data.footerText && (
              <div className="mt-1 text-center">
                {data.footerText}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default AssignmentPreview;