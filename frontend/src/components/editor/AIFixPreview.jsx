import { Check, X } from "lucide-react";

function AIFixPreview({
  original,
  suggested,
  onApply,
  onCancel,
}) {
  return (
    <div
      className="
        absolute
        right-6
        top-full
        mt-2
        z-50
        w-[420px]
        rounded-xl
        border
        border-slate-700
        bg-slate-900
        shadow-2xl
        p-4
      "
    >

      {/* Header */}

      <div className="mb-4">
        <h3 className="text-sm font-semibold text-white">
          ✨ Grammar Suggestion
        </h3>

        <p className="text-xs text-slate-400 mt-1">
          Review the suggested correction before applying it.
        </p>
      </div>


      {/* Original */}

      <div className="mb-4">

        <div className="text-xs font-medium text-slate-400 mb-1">
          Original
        </div>

        <div
          className="
            rounded-lg
            border
            border-slate-700
            bg-slate-950
            p-3
            text-sm
            text-slate-300
            leading-6
          "
        >
          {original}
        </div>

      </div>


      {/* Arrow */}

      <div className="text-center text-slate-500 mb-3">
        ↓
      </div>


      {/* Suggested */}

      <div className="mb-4">

        <div className="text-xs font-medium text-slate-400 mb-1">
          Suggested
        </div>

        <div
          className="
            rounded-lg
            border
            border-indigo-500/40
            bg-indigo-500/10
            p-3
            text-sm
            text-white
            leading-6
          "
        >
          {suggested}
        </div>

      </div>


      {/* Buttons */}

      <div className="flex gap-2">

        <button
          type="button"
          onMouseDown={(event) => {
            event.preventDefault();
            onApply();
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
            text-sm
            text-white
          "
        >
          <Check size={15} />
          Apply
        </button>


        <button
          type="button"
          onMouseDown={(event) => {
            event.preventDefault();
            onCancel();
          }}
          className="
            flex-1
            flex
            items-center
            justify-center
            gap-2
            h-9
            rounded-md
            border
            border-slate-700
            bg-slate-800
            hover:bg-slate-700
            text-sm
            text-slate-200
          "
        >
          <X size={15} />
          Cancel
        </button>

      </div>

    </div>
  );
}

export default AIFixPreview;