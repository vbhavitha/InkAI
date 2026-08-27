import { useRef } from "react";
import {
    Upload,
    FileImage,
    FileText,
    Camera
} from "lucide-react";


function UploadZone({
    files,
    addFiles,
    openCamera,
    compact = false
}) {

    const inputRef = useRef(null);


    // ==========================================
    // OPEN FILE PICKER
    // ==========================================

    const openFilePicker = () => {

        if (inputRef.current) {

            inputRef.current.click();

        }

    };


    // ==========================================
    // FILE CHANGE
    // ==========================================

    const handleFileChange = (event) => {

        if (
            event.target.files &&
            event.target.files.length > 0
        ) {

            addFiles(
                event.target.files
            );

        }


        // Allow selecting the same file again

        event.target.value = "";

    };


    // ==========================================
    // DROP
    // ==========================================

    const handleDrop = (event) => {

        event.preventDefault();


        if (
            event.dataTransfer.files &&
            event.dataTransfer.files.length > 0
        ) {

            addFiles(
                event.dataTransfer.files
            );

        }

    };


    // ==========================================
    // DRAG OVER
    // ==========================================

    const handleDragOver = (event) => {

        event.preventDefault();

    };


    return (

        <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className="
                w-full
                border-2
                border-dashed
                border-slate-700
                rounded-3xl
                bg-slate-900
                hover:border-indigo-500
                transition-all
                duration-300
            "
        >

            {/* ==================================
                HIDDEN FILE INPUT
            ================================== */}

            <input
                ref={inputRef}
                type="file"
                multiple
                hidden
                accept="
                    .png,
                    .jpg,
                    .jpeg,
                    .pdf,
                    .webp,
                    .heic,
                    .heif
                "
                onChange={handleFileChange}
            />


            {/* ==================================
                CONTENT
            ================================== */}

            <div
                className={`
                    flex
                    flex-col
                    items-center
                    justify-center
                    px-6

                    ${
                        compact
                            ? "py-16"
                            : "py-24"
                    }
                `}
            >

                {/* UPLOAD ICON */}

                <div
                    className="
                        w-20
                        h-20
                        rounded-full
                        bg-indigo-600/20
                        flex
                        items-center
                        justify-center
                        mb-6
                    "
                >

                    <Upload
                        size={42}
                        className="text-indigo-400"
                    />

                </div>


                {/* TITLE */}

                <h2
                    className="
                        text-3xl
                        font-bold
                        text-white
                        text-center
                    "
                >
                    Drag & Drop Files Here
                </h2>


                {/* DESCRIPTION */}

                <p
                    className="
                        text-slate-400
                        mt-3
                        text-center
                    "
                >
                    Upload handwritten notes or PDFs
                    to begin OCR processing.
                </p>


                {/* BUTTONS */}

                <div
                    className="
                        flex
                        flex-wrap
                        justify-center
                        gap-4
                        mt-10
                    "
                >

                    {/* BROWSE */}

                    <button
                        type="button"
                        onClick={openFilePicker}
                        className="
                            bg-indigo-600
                            hover:bg-indigo-700
                            px-8
                            py-4
                            rounded-xl
                            font-semibold
                            text-white
                            flex
                            items-center
                            gap-3
                            transition
                        "
                    >

                        <FileImage
                            size={20}
                        />

                        Browse Files

                    </button>


                    {/* CAMERA */}

                    <button
                        type="button"
                        onClick={openCamera}
                        className="
                            bg-slate-800
                            hover:bg-slate-700
                            border
                            border-slate-700
                            hover:border-indigo-500
                            px-8
                            py-4
                            rounded-xl
                            font-semibold
                            text-white
                            flex
                            items-center
                            gap-3
                            transition
                        "
                    >

                        <Camera
                            size={20}
                        />

                        Take Photo

                    </button>

                </div>


                {/* INFO */}

                <div
                    className="
                        mt-6
                        text-center
                        text-slate-500
                        text-sm
                        space-y-2
                    "
                >

                    <div
                        className="
                            flex
                            items-center
                            justify-center
                            gap-2
                        "
                    >

                        <FileText
                            size={16}
                        />

                        Maximum upload size:
                        50 MB

                    </div>


                    <p>

                        Paste screenshots instantly
                        using{" "}

                        <span
                            className="
                                text-indigo-400
                                font-semibold
                            "
                        >
                            Ctrl + V
                        </span>

                    </p>

                </div>

            </div>

        </div>

    );

}


export default UploadZone;