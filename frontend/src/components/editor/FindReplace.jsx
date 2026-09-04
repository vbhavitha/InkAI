import { useEffect, useState } from "react";

import {
  Search,
  ChevronUp,
  ChevronDown,
  Replace,
  X,
} from "lucide-react";


function FindReplace({
  editor,
  onClose,
}) {
  const [findText, setFindText] = useState("");
  const [replaceText, setReplaceText] = useState("");

  const [matches, setMatches] = useState([]);
  const [currentMatch, setCurrentMatch] = useState(0);


  /*
   * =========================================================
   * FIND MATCHES
   * =========================================================
   */

  const findMatches = (searchText) => {
    if (!editor || !searchText) {
      return [];
    }

    const results = [];

    editor.state.doc.descendants(
      (node, position) => {
        if (!node.isText) {
          return;
        }

        const text = node.text || "";

        let startIndex = 0;

        while (true) {
          const index = text
            .toLowerCase()
            .indexOf(
              searchText.toLowerCase(),
              startIndex
            );

          if (index === -1) {
            break;
          }

          results.push({
            from: position + index,
            to:
              position +
              index +
              searchText.length,
          });

          startIndex =
            index + searchText.length;
        }
      }
    );

    return results;
  };


  /*
   * =========================================================
   * UPDATE SEARCH RESULTS
   * =========================================================
   */

  useEffect(() => {
    const results = findMatches(findText);

    setMatches(results);

    if (results.length === 0) {
      setCurrentMatch(0);
      return;
    }

    setCurrentMatch((current) =>
      Math.min(
        current,
        results.length - 1
      )
    );
  }, [findText, editor]);


  /*
   * =========================================================
   * SELECT MATCH
   * =========================================================
   */

  const selectMatch = (index) => {
    if (!editor || !matches.length) {
      return;
    }

    const match = matches[index];

    if (!match) {
      return;
    }

    editor.commands.setTextSelection({
      from: match.from,
      to: match.to,
    });

    editor.commands.focus();

    setCurrentMatch(index);
  };


  /*
   * =========================================================
   * NEXT
   * =========================================================
   */

  const handleNext = () => {
    if (!matches.length) {
      return;
    }

    const next =
      (currentMatch + 1) %
      matches.length;

    selectMatch(next);
  };


  /*
   * =========================================================
   * PREVIOUS
   * =========================================================
   */

  const handlePrevious = () => {
    if (!matches.length) {
      return;
    }

    const previous =
      (currentMatch - 1 + matches.length) %
      matches.length;

    selectMatch(previous);
  };


  /*
   * =========================================================
   * REPLACE CURRENT
   * =========================================================
   */

  const handleReplace = () => {
    if (!editor || !matches.length) {
      return;
    }

    const match = matches[currentMatch];

    if (!match) {
      return;
    }

    editor
      .chain()
      .focus()
      .insertContentAt(
        {
          from: match.from,
          to: match.to,
        },
        replaceText
      )
      .run();

    /*
     * Recalculate matches after replacement.
     */
    setTimeout(() => {
      const updatedMatches =
        findMatches(findText);

      setMatches(updatedMatches);

      if (updatedMatches.length === 0) {
        setCurrentMatch(0);
        return;
      }

      setCurrentMatch(
        Math.min(
          currentMatch,
          updatedMatches.length - 1
        )
      );
    }, 0);
  };


  /*
   * =========================================================
   * REPLACE ALL
   * =========================================================
   */

  const handleReplaceAll = () => {
    if (!editor || !findText || !matches.length) {
      return;
    }

    /*
     * Replace from the bottom of the document
     * toward the top so positions remain valid.
     */
    const sortedMatches = [...matches].sort(
      (a, b) => b.from - a.from
    );

    const transaction =
      editor.state.tr;

    sortedMatches.forEach((match) => {
      transaction.replaceWith(
        match.from,
        match.to,
        editor.schema.text(replaceText)
      );
    });

    editor.view.dispatch(transaction);

    setMatches([]);
    setCurrentMatch(0);
  };


  /*
   * =========================================================
   * CLOSE
   * =========================================================
   */

  const handleClose = () => {
    setFindText("");
    setReplaceText("");
    setMatches([]);
    setCurrentMatch(0);

    if (onClose) {
      onClose();
    }
  };


  return (
    <div
      className="
        absolute
        right-6
        top-full
        mt-2
        z-50
        w-[360px]
        rounded-xl
        border
        border-slate-700
        bg-slate-900
        shadow-2xl
        p-4
      "
    >

      {/* HEADER */}

      <div className="flex items-center justify-between mb-4">

        <div className="flex items-center gap-2">

          <Search
            size={17}
            className="text-slate-400"
          />

          <h3 className="text-sm font-semibold text-white">
            Find & Replace
          </h3>

        </div>


        <button
          type="button"
          onMouseDown={(event) => {
            event.preventDefault();
            handleClose();
          }}
          className="
            p-1.5
            rounded
            text-slate-400
            hover:text-white
            hover:bg-slate-800
          "
        >
          <X size={16} />
        </button>

      </div>


      {/* FIND */}

      <label className="block text-xs text-slate-400 mb-1">
        Find
      </label>

      <input
        type="text"
        value={findText}
        onChange={(event) =>
          setFindText(event.target.value)
        }
        placeholder="Find text..."
        autoFocus
        className="
          w-full
          h-9
          px-3
          mb-3
          rounded-md
          border
          border-slate-700
          bg-slate-950
          text-sm
          text-white
          outline-none
          focus:border-indigo-500
        "
      />


      {/* REPLACE */}

      <label className="block text-xs text-slate-400 mb-1">
        Replace
      </label>

      <input
        type="text"
        value={replaceText}
        onChange={(event) =>
          setReplaceText(event.target.value)
        }
        placeholder="Replace with..."
        className="
          w-full
          h-9
          px-3
          mb-4
          rounded-md
          border
          border-slate-700
          bg-slate-950
          text-sm
          text-white
          outline-none
          focus:border-indigo-500
        "
      />


      {/* MATCH COUNT */}

      <div className="flex items-center justify-between mb-4">

        <span className="text-xs text-slate-400">

          {matches.length === 0
            ? "No matches"
            : `${currentMatch + 1} of ${matches.length} matches`}

        </span>


        <div className="flex items-center gap-1">

          {/* PREVIOUS */}

          <button
            type="button"
            disabled={!matches.length}
            onMouseDown={(event) => {
              event.preventDefault();
              handlePrevious();
            }}
            className="
              p-1.5
              rounded
              text-slate-300
              hover:bg-slate-800
              disabled:opacity-30
            "
            title="Previous"
          >
            <ChevronUp size={16} />
          </button>


          {/* NEXT */}

          <button
            type="button"
            disabled={!matches.length}
            onMouseDown={(event) => {
              event.preventDefault();
              handleNext();
            }}
            className="
              p-1.5
              rounded
              text-slate-300
              hover:bg-slate-800
              disabled:opacity-30
            "
            title="Next"
          >
            <ChevronDown size={16} />
          </button>

        </div>

      </div>


      {/* ACTIONS */}

      <div className="flex gap-2">

        <button
          type="button"
          disabled={!matches.length}
          onMouseDown={(event) => {
            event.preventDefault();
            handleReplace();
          }}
          className="
            flex-1
            flex
            items-center
            justify-center
            gap-2
            h-9
            rounded-md
            bg-indigo-600
            hover:bg-indigo-500
            disabled:opacity-40
            text-sm
            text-white
          "
        >
          <Replace size={15} />
          Replace
        </button>


        <button
          type="button"
          disabled={!matches.length}
          onMouseDown={(event) => {
            event.preventDefault();
            handleReplaceAll();
          }}
          className="
            flex-1
            h-9
            rounded-md
            border
            border-slate-700
            bg-slate-800
            hover:bg-slate-700
            disabled:opacity-40
            text-sm
            text-slate-200
          "
        >
          Replace All
        </button>

      </div>

    </div>
  );
}


export default FindReplace;