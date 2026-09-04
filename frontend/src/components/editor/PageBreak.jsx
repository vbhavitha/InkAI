import { FilePlus2 } from "lucide-react";

function PageBreak({ editor }) {
  if (!editor) {
    return null;
  }

  const insertPageBreak = (event) => {
    event.preventDefault();

    editor
      .chain()
      .focus()
      .insertPageBreak()
      .run();
  };

  return (
    <button
      type="button"
      title="Insert page break"
      onMouseDown={insertPageBreak}
      className="
        flex
        items-center
        justify-center
        gap-2
        h-9
        px-3
        rounded-md
        text-slate-300
        hover:bg-slate-800
        hover:text-white
        transition
      "
    >
      <FilePlus2 size={18} />

      <span className="hidden xl:inline">
        Page Break
      </span>
    </button>
  );
}

export default PageBreak;