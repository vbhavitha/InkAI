import { useEffect, useRef, useState } from "react";
import {
  Image as ImageIcon,
  Upload,
  Clipboard,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Trash2,
} from "lucide-react";

function ImageInsert({ editor }) {
  const fileInputRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [imageSelected, setImageSelected] = useState(false);

  /*
   * =========================================================
   * CHECK IMAGE SELECTION
   * =========================================================
   */

  useEffect(() => {
    if (!editor) return;

    const updateSelection = () => {
      setImageSelected(editor.isActive("image"));
    };

    updateSelection();

    editor.on("selectionUpdate", updateSelection);
    editor.on("transaction", updateSelection);

    return () => {
      editor.off("selectionUpdate", updateSelection);
      editor.off("transaction", updateSelection);
    };
  }, [editor]);

  /*
   * =========================================================
   * INSERT IMAGE
   * =========================================================
   */

  const insertImage = (file) => {
    if (!file || !file.type.startsWith("image/")) {
      alert("Please select a valid image file.");
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      editor
        .chain()
        .focus()
        .setImage({
          src: reader.result,
          alt: file.name,
          title: file.name,
        })
        .run();
    };

    reader.readAsDataURL(file);

    setMenuOpen(false);
  };

  /*
   * =========================================================
   * FILE UPLOAD
   * =========================================================
   */

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];

    if (file) {
      insertImage(file);
    }

    event.target.value = "";
  };

  /*
   * =========================================================
   * PASTE IMAGE
   * =========================================================
   */

  useEffect(() => {
    if (!editor) return;

    const handlePaste = (event) => {
      const items = event.clipboardData?.items;

      if (!items) return;

      for (const item of items) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();

          if (file) {
            event.preventDefault();
            insertImage(file);
          }

          break;
        }
      }
    };

    const editorElement = editor.view.dom;

    editorElement.addEventListener(
      "paste",
      handlePaste
    );

    return () => {
      editorElement.removeEventListener(
        "paste",
        handlePaste
      );
    };
  }, [editor]);

  /*
   * =========================================================
   * ALIGN IMAGE
   * =========================================================
   */

  const alignImage = (alignment) => {
    if (!editor || !editor.isActive("image")) {
      return;
    }

    editor
      .chain()
      .focus()
      .updateAttributes("image", {
        alignment,
      })
      .run();
  };

  /*
   * =========================================================
   * DELETE IMAGE
   * =========================================================
   */

  const deleteImage = () => {
    if (!editor || !editor.isActive("image")) {
      return;
    }

    editor
      .chain()
      .focus()
      .deleteSelection()
      .run();
  };

  /*
   * =========================================================
   * RENDER
   * =========================================================
   */

  if (!editor) {
    return null;
  }

  return (
    <div className="relative flex items-center">

      {/* =====================================================
          MAIN IMAGE BUTTON
      ====================================================== */}

      <button
        type="button"
        title="Insert image"
        onMouseDown={(event) => {
          event.preventDefault();

          setMenuOpen(
            (open) => !open
          );
        }}
        className={`
          flex
          items-center
          justify-center
          gap-1
          h-9
          px-2
          rounded-md
          transition
          ${
            imageSelected
              ? "bg-indigo-600 text-white"
              : "text-slate-300 hover:bg-slate-800 hover:text-white"
          }
        `}
      >
        <ImageIcon size={18} />
      </button>

      {/* =====================================================
          INSERT IMAGE MENU
      ====================================================== */}

      {menuOpen && (
        <div
          className="
            absolute
            left-0
            top-full
            mt-2
            z-50
            w-48
            rounded-lg
            border
            border-slate-700
            bg-slate-900
            shadow-xl
            overflow-hidden
          "
        >

          {/* UPLOAD IMAGE */}

          <button
            type="button"
            onMouseDown={(event) => {
              event.preventDefault();

              fileInputRef.current?.click();
            }}
            className="
              flex
              items-center
              gap-3
              w-full
              px-4
              py-3
              text-sm
              text-slate-300
              hover:bg-slate-800
              hover:text-white
            "
          >
            <Upload size={17} />
            Upload Image
          </button>

          {/* PASTE IMAGE */}

          <div
            className="
              flex
              items-center
              gap-3
              px-4
              py-3
              text-sm
              text-slate-400
              border-t
              border-slate-800
            "
          >
            <Clipboard size={17} />
            Paste Image
          </div>

        </div>
      )}

      {/* =====================================================
          HIDDEN FILE INPUT
      ====================================================== */}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* =====================================================
          IMAGE CONTROLS
      ====================================================== */}

      {imageSelected && (
        <div
          className="
            flex
            items-center
            gap-1
            ml-2
            pl-2
            border-l
            border-slate-700
          "
        >

          {/* LEFT */}

          <button
            type="button"
            title="Align left"
            onMouseDown={(event) => {
              event.preventDefault();
              alignImage("left");
            }}
            className="
              flex
              items-center
              justify-center
              w-8
              h-8
              rounded-md
              text-slate-300
              hover:bg-slate-800
              hover:text-white
            "
          >
            <AlignLeft size={16} />
          </button>

          {/* CENTER */}

          <button
            type="button"
            title="Align center"
            onMouseDown={(event) => {
              event.preventDefault();
              alignImage("center");
            }}
            className="
              flex
              items-center
              justify-center
              w-8
              h-8
              rounded-md
              text-slate-300
              hover:bg-slate-800
              hover:text-white
            "
          >
            <AlignCenter size={16} />
          </button>

          {/* RIGHT */}

          <button
            type="button"
            title="Align right"
            onMouseDown={(event) => {
              event.preventDefault();
              alignImage("right");
            }}
            className="
              flex
              items-center
              justify-center
              w-8
              h-8
              rounded-md
              text-slate-300
              hover:bg-slate-800
              hover:text-white
            "
          >
            <AlignRight size={16} />
          </button>

          {/* DELETE */}

          <button
            type="button"
            title="Delete image"
            onMouseDown={(event) => {
              event.preventDefault();
              deleteImage();
            }}
            className="
              flex
              items-center
              justify-center
              w-8
              h-8
              rounded-md
              text-red-400
              hover:bg-red-500/10
              hover:text-red-300
            "
          >
            <Trash2 size={16} />
          </button>

        </div>
      )}

    </div>
  );
}

export default ImageInsert;