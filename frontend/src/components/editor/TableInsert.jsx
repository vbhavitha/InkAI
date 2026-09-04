import { useState } from "react";
import {
  Table as TableIcon,
  ChevronDown,
} from "lucide-react";

function TableInsert({ editor }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const insertTable = (rows, cols) => {
    if (!editor) {
      return;
    }

    editor
      .chain()
      .focus()
      .insertTable({
        rows,
        cols,
        withHeaderRow: true,
      })
      .run();

    setMenuOpen(false);
  };

  const tableOptions = [
    {
      rows: 2,
      cols: 2,
      label: "2 × 2",
    },
    {
      rows: 3,
      cols: 3,
      label: "3 × 3",
    },
    {
      rows: 4,
      cols: 4,
      label: "4 × 4",
    },
    {
      rows: 5,
      cols: 5,
      label: "5 × 5",
    },
  ];

  if (!editor) {
    return null;
  }

  return (
    <div className="relative">

      {/* =====================================================
          TABLE BUTTON
      ====================================================== */}

      <button
        type="button"
        title="Insert table"
        onMouseDown={(event) => {
          event.preventDefault();

          setMenuOpen(
            (open) => !open
          );
        }}
        className="
          flex
          items-center
          justify-center
          gap-1
          h-9
          px-2
          rounded-md
          text-slate-300
          hover:bg-slate-800
          hover:text-white
          transition
        "
      >
        <TableIcon size={18} />

        <ChevronDown size={13} />
      </button>

      {/* =====================================================
          TABLE MENU
      ====================================================== */}

      {menuOpen && (
        <div
          className="
            absolute
            left-0
            top-full
            mt-1
            z-50
            w-40
            rounded-lg
            border
            border-slate-700
            bg-slate-900
            shadow-xl
            overflow-hidden
          "
        >

          <div
            className="
              px-4
              py-2
              text-xs
              font-semibold
              uppercase
              tracking-wide
              text-slate-500
              border-b
              border-slate-800
            "
          >
            Insert Table
          </div>

          {tableOptions.map((option) => (
            <button
              key={option.label}
              type="button"
              onMouseDown={(event) => {
                event.preventDefault();

                insertTable(
                  option.rows,
                  option.cols
                );
              }}
              className="
                block
                w-full
                px-4
                py-2.5
                text-left
                text-sm
                text-slate-300
                hover:bg-slate-800
                hover:text-white
                transition
              "
            >
              {option.label}
            </button>
          ))}

        </div>
      )}

    </div>
  );
}

export default TableInsert;