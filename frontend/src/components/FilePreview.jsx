import {
    FileText,
    X,
    RotateCcw,
    RotateCw
} from "lucide-react";

import { useEffect, useState } from "react";


function FilePreview({
    files,
    removeFile,
    cancelUpload,
    retryUpload,
    handleDelete,
    rotateFile,
    openCrop,
    handleCompress
}) {

    if (files.length === 0) {
        return null;
    }


    // ==========================================
    // TOTAL ORIGINAL SIZE
    // ==========================================

    const totalSize = files.reduce(
        (sum, item) =>
            sum + (item.file?.size || 0),
        0
    );


    return (

        <div className="mt-10">

            {/* ================================= */}
            {/* HEADER */}
            {/* ================================= */}

            <div className="flex justify-between items-center mb-6">

                <h2 className="text-2xl font-bold text-white">

                    Selected Files

                    <span className="ml-2 text-indigo-400">

                        ({files.length})

                    </span>

                </h2>


                <p className="text-slate-400">

                    {files.length} file
                    {files.length > 1 ? "s" : ""}

                    {" • "}

                    {(totalSize / 1024 / 1024).toFixed(2)} MB

                </p>

            </div>


            {/* ================================= */}
            {/* FILE GRID */}
            {/* ================================= */}

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">

                {files.map((file, index) => (

                    <FileCard
                        key={index}
                        file={file}
                        index={index}
                        removeFile={removeFile}
                        cancelUpload={cancelUpload}
                        retryUpload={retryUpload}
                        handleDelete={handleDelete}
                        rotateFile={rotateFile}
                        openCrop={openCrop}
                        handleCompress={handleCompress}
                    />

                ))}

            </div>

        </div>

    );

}


// ======================================================
// FILE CARD
// ======================================================

function FileCard({
    file,
    index,
    removeFile,
    cancelUpload,
    retryUpload,
    handleDelete,
    rotateFile,
    openCrop,
    handleCompress
}) {

    // ==========================================
    // SAFETY CHECK
    // ==========================================

    if (!file || !file.file) {
        return null;
    }


    // ==========================================
    // CURRENT FILE
    // ==========================================

    /*
        Original file:

        file.file

        Processed/cropped/compressed file:

        file.processedFile

        Preview should always show the
        latest processed version if available.
    */

    const displayFile =
        file.processedFile ||
        file.file;


    // ==========================================
    // FILE TYPE
    // ==========================================

    const isImage =
        displayFile.type?.startsWith("image/");

    const isPdf =
        displayFile.type === "application/pdf";


    // ==========================================
    // OBJECT URL
    // ==========================================

    const [previewUrl, setPreviewUrl] =
        useState(null);


    useEffect(() => {

        if (!isImage) {

            setPreviewUrl(null);

            return;

        }


        const url =
            URL.createObjectURL(displayFile);


        setPreviewUrl(url);


        return () => {

            URL.revokeObjectURL(url);

        };

    }, [
        displayFile,
        isImage
    ]);


    // ==========================================
    // RENDER
    // ==========================================

    return (

        <div
            className="
                group
                relative
                bg-slate-900
                rounded-2xl
                overflow-hidden
                border
                border-slate-800
                hover:border-indigo-500
                hover:-translate-y-1
                hover:shadow-2xl
                hover:shadow-indigo-500/20
                transition-all
                duration-300
            "
        >

            {/* ================================= */}
            {/* DELETE BUTTON */}
            {/* ================================= */}

            <button
                type="button"
                onClick={() => handleDelete(index)}
                className="
                    absolute
                    top-3
                    right-3
                    w-10
                    h-10
                    rounded-full
                    bg-slate-900/70
                    backdrop-blur-sm
                    hover:bg-red-600
                    opacity-0
                    group-hover:opacity-100
                    flex
                    items-center
                    justify-center
                    transition-all
                    duration-300
                    z-20
                "
            >

                <X
                    size={18}
                    className="text-white"
                />

            </button>


            {/* ================================= */}
            {/* PREVIEW */}
            {/* ================================= */}

            {isImage ? (

                <div
                    className="
                        w-full
                        h-64
                        bg-slate-800
                        flex
                        items-center
                        justify-center
                        overflow-hidden
                    "
                >

                    {previewUrl ? (

                        <img
                            src={previewUrl}
                            alt={displayFile.name}
                            className="
                                max-w-full
                                max-h-full
                                object-contain
                                transition-transform
                                duration-500
                            "
                            style={{
                                transform:
                                    `rotate(${file.rotation || 0}deg)`
                            }}
                        />

                    ) : (

                        <div className="text-slate-500">
                            Loading preview...
                        </div>

                    )}

                </div>

            ) : isPdf ? (

                <div
                    className="
                        h-64
                        bg-gradient-to-br
                        from-red-500/20
                        via-slate-800
                        to-slate-900
                        flex
                        flex-col
                        items-center
                        justify-center
                        px-6
                        text-center
                    "
                >

                    <div
                        className="
                            w-24
                            h-24
                            rounded-full
                            bg-red-500/20
                            flex
                            items-center
                            justify-center
                            border
                            border-red-500/30
                        "
                    >

                        <FileText
                            size={56}
                            className="text-red-500"
                        />

                    </div>


                    <h3
                        className="
                            mt-6
                            text-2xl
                            font-bold
                            text-white
                        "
                    >
                        PDF
                    </h3>


                    <p
                        className="
                            mt-2
                            text-slate-300
                            text-sm
                        "
                    >
                        Portable Document Format
                    </p>

                </div>

            ) : (

                <div
                    className="
                        h-64
                        bg-slate-800
                        flex
                        items-center
                        justify-center
                        text-slate-400
                    "
                >

                    Unsupported File

                </div>

            )}


            {/* ================================= */}
            {/* DETAILS */}
            {/* ================================= */}

            <div className="p-5">

                {/* FILE NUMBER */}

                <span
                    className="
                        inline-block
                        bg-indigo-600
                        text-white
                        text-xs
                        px-3
                        py-1
                        rounded-full
                    "
                >
                    File {index + 1}
                </span>


                {/* FILE NAME */}

                <h3
                    className="
                        font-semibold
                        text-white
                        text-lg
                        truncate
                        mt-3
                    "
                    title={file.file.name}
                >
                    {file.file.name}
                </h3>


                {/* ================================= */}
                {/* STATUS */}
                {/* ================================= */}

                <div className="mt-4">

                    {/* WAITING */}

                    {file.status === "waiting" && (

                        <p className="text-slate-500 text-sm">
                            Waiting...
                        </p>

                    )}


                    {/* UPLOADING */}

                    {file.status === "uploading" && (

                        <>

                            <div
                                className="
                                    w-full
                                    h-2
                                    bg-slate-700
                                    rounded-full
                                    overflow-hidden
                                "
                            >

                                <div
                                    className="
                                        h-full
                                        bg-indigo-500
                                        transition-all
                                        duration-300
                                    "
                                    style={{
                                        width:
                                            `${file.progress || 0}%`
                                    }}
                                />

                            </div>


                            <div
                                className="
                                    flex
                                    items-center
                                    justify-between
                                    mt-3
                                "
                            >

                                <p
                                    className="
                                        text-indigo-400
                                        text-sm
                                    "
                                >
                                    Uploading...
                                    {" "}
                                    {file.progress || 0}%
                                </p>


                                <button
                                    type="button"
                                    onClick={() =>
                                        cancelUpload(index)
                                    }
                                    className="
                                        px-3
                                        py-1
                                        rounded
                                        bg-red-600
                                        hover:bg-red-700
                                        text-white
                                        text-xs
                                    "
                                >
                                    Cancel
                                </button>

                            </div>

                        </>

                    )}


                    {/* UPLOADED */}

                    {file.status === "uploaded" && (

                        <p
                            className="
                                text-emerald-400
                                text-sm
                                font-medium
                            "
                        >
                            ✓ Uploaded Successfully
                        </p>

                    )}


                    {/* CANCELLED */}

                    {file.status === "cancelled" && (

                        <p
                            className="
                                text-yellow-400
                                text-sm
                            "
                        >
                            Cancelled
                        </p>

                    )}


                    {/* FAILED */}

                    {file.status === "failed" && (

                        <div className="mt-2">

                            <p
                                className="
                                    text-red-400
                                    text-sm
                                    font-medium
                                "
                            >
                                ✗ Upload Failed
                            </p>


                            <button
                                type="button"
                                onClick={() =>
                                    retryUpload(index)
                                }
                                className="
                                    mt-3
                                    px-4
                                    py-2
                                    rounded-lg
                                    bg-indigo-600
                                    hover:bg-indigo-700
                                    text-white
                                    text-sm
                                    transition
                                "
                            >
                                Retry Upload
                            </button>

                        </div>

                    )}

                </div>


                {/* ================================= */}
                {/* FILE SIZE */}
                {/* ================================= */}

                <div className="mt-4 space-y-1">

                    <p
                        className="
                            text-slate-400
                            text-sm
                        "
                    >
                        Original:
                        {" "}
                        {(file.file.size / 1024 / 1024).toFixed(2)}
                        {" MB"}
                    </p>


                    {file.processedFile && (

                        <p
                            className="
                                text-emerald-400
                                text-sm
                                font-medium
                            "
                        >
                            Current:
                            {" "}
                            {(file.processedFile.size / 1024 / 1024).toFixed(2)}
                            {" MB"}
                        </p>

                    )}

                </div>


                {/* ================================= */}
                {/* PDF BADGE */}
                {/* ================================= */}

                {isPdf && (

                    <div className="mt-3">

                        <span
                            className="
                                inline-block
                                bg-red-500/20
                                text-red-400
                                text-xs
                                px-3
                                py-1
                                rounded-full
                                border
                                border-red-500/30
                            "
                        >
                            PDF
                        </span>

                    </div>

                )}


                {/* ================================= */}
                {/* IMAGE ACTIONS */}
                {/* ================================= */}

                {isImage && (

                    <>

                        {/* ROTATION */}

                        <div className="mt-5">

                            <div
                                className="
                                    flex
                                    items-center
                                    justify-between
                                    gap-3
                                "
                            >

                                {/* ROTATE LEFT */}

                                <button
                                    type="button"
                                    onClick={() =>
                                        rotateFile(
                                            index,
                                            "left"
                                        )
                                    }
                                    disabled={
                                        file.status === "uploading"
                                    }
                                    className="
                                        flex
                                        items-center
                                        justify-center
                                        gap-2
                                        px-3
                                        py-2
                                        rounded-lg
                                        bg-slate-800
                                        hover:bg-slate-700
                                        text-slate-300
                                        hover:text-white
                                        transition
                                        disabled:opacity-40
                                        disabled:cursor-not-allowed
                                        text-sm
                                    "
                                >

                                    <RotateCcw size={16} />

                                    Rotate Left

                                </button>


                                {/* ROTATION */}

                                <span
                                    className="
                                        text-xs
                                        text-slate-500
                                        whitespace-nowrap
                                    "
                                >
                                    {file.rotation || 0}°
                                </span>


                                {/* ROTATE RIGHT */}

                                <button
                                    type="button"
                                    onClick={() =>
                                        rotateFile(
                                            index,
                                            "right"
                                        )
                                    }
                                    disabled={
                                        file.status === "uploading"
                                    }
                                    className="
                                        flex
                                        items-center
                                        justify-center
                                        gap-2
                                        px-3
                                        py-2
                                        rounded-lg
                                        bg-slate-800
                                        hover:bg-slate-700
                                        text-slate-300
                                        hover:text-white
                                        transition
                                        disabled:opacity-40
                                        disabled:cursor-not-allowed
                                        text-sm
                                    "
                                >

                                    Rotate Right

                                    <RotateCw size={16} />

                                </button>

                            </div>

                        </div>


                        {/* CROP */}

                        <button
                            type="button"
                            onClick={() =>
                                openCrop(index)
                            }
                            disabled={
                                file.status === "uploading"
                            }
                            className="
                                w-full
                                mt-3
                                px-4
                                py-2
                                rounded-lg
                                bg-indigo-600/20
                                hover:bg-indigo-600
                                border
                                border-indigo-500/30
                                hover:border-indigo-500
                                text-indigo-300
                                hover:text-white
                                transition
                                disabled:opacity-40
                                disabled:cursor-not-allowed
                                text-sm
                                font-medium
                            "
                        >
                            Crop Image
                        </button>


                        {/* COMPRESS */}

                        <button
                            type="button"
                            onClick={() =>
                                handleCompress(index)
                            }
                            disabled={
                                file.status === "uploading"
                            }
                            className="
                                w-full
                                mt-3
                                px-4
                                py-2
                                rounded-lg
                                bg-emerald-600/20
                                hover:bg-emerald-600
                                border
                                border-emerald-500/30
                                hover:border-emerald-500
                                text-emerald-300
                                hover:text-white
                                transition
                                disabled:opacity-40
                                disabled:cursor-not-allowed
                                text-sm
                                font-medium
                            "
                        >
                            Compress Image
                        </button>

                    </>

                )}

            </div>

        </div>

    );

}


export default FilePreview;