import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import UploadZone from "../components/UploadZone";
import FilePreview from "../components/FilePreview";
import CropModal from "../components/CropModal";
import CameraModal from "../components/CameraModal";
import PageSidebar from "../components/PageSidebar";

import useUpload from "../hooks/useUpload";

import {
    uploadFile,
    deleteFile
} from "../services/uploadService";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";


function UploadPage() {

    const navigate = useNavigate();

    const {

        files,

        addFiles,

        removeFile,

        updateProgress,

        updateStatus,

        setController,

        cancelUpload,

        updateFileId,

        rotateFile,

        updateCroppedFile,

        compressFile,

        updatePdfPages,

        reorderFiles

    } = useUpload();


    const [uploading, setUploading] =
        useState(false);


    // ==========================================
    // CROP MODAL STATE
    // ==========================================

    const [cropIndex, setCropIndex] =
        useState(null);


    // ==========================================
    // OPEN CROP
    // ==========================================

    const openCrop = (index) => {

        setCropIndex(index);

    };


    // ==========================================
    // CLOSE CROP
    // ==========================================

    const closeCrop = () => {

        setCropIndex(null);

    };


    // ==========================================
    // SAVE CROP
    // ==========================================

    const saveCrop = (croppedFile) => {

        if (cropIndex === null) {
            return;
        }


        updateCroppedFile(
            cropIndex,
            croppedFile
        );


        setCropIndex(null);

    };

    // ==========================================
    // COMPRESS FILE
    // ==========================================


    const handleCompress = async (index) => {

        try {

            await compressFile(index);

        }

        catch (error) {

            console.error(
                "Compression failed:",
                error
            );

            alert(
                "Unable to compress this image."
            );

        }

    };

    // ==========================================
    // CAMERA UPLOAD
    // ==========================================

    const [cameraOpen, setCameraOpen] =
    useState(false);

    const openCamera = () => {

        setCameraOpen(true);

    };


    const closeCamera = () => {

        setCameraOpen(false);

    };

    const handleCameraCapture = (file) => {

        addFiles([file]);

    };

    // ==========================================
    // PASTE SCREENSHOT - CTRL + V
    // ==========================================

    useEffect(() => {

    const handlePaste = (event) => {

        console.log("=================================");
        console.log("PASTE EVENT FIRED");
        console.log("=================================");


        const clipboardData =
            event.clipboardData;


        if (!clipboardData) {

            console.log(
                "No clipboardData"
            );

            return;

        }


        const items =
            clipboardData.items;


        console.log(
            "Clipboard items:",
            items
        );


        if (!items || items.length === 0) {

            console.log(
                "No clipboard items"
            );

            return;

        }


        for (
            let i = 0;
            i < items.length;
            i++
        ) {

            const item = items[i];


            console.log(
                "Clipboard item:",
                item.type
            );


            if (
                item.type &&
                item.type.startsWith("image/")
            ) {

                console.log(
                    "IMAGE FOUND:",
                    item.type
                );


                const blob =
                    item.getAsFile();


                console.log(
                    "Blob:",
                    blob
                );


                if (!blob) {

                    console.error(
                        "Could not convert clipboard item to file"
                    );

                    return;

                }


                const extension =
                    blob.type === "image/jpeg"
                        ? "jpg"
                        : blob.type === "image/webp"
                            ? "webp"
                            : "png";


                const pastedFile =
                    new File(

                        [blob],

                        `screenshot-${Date.now()}.${extension}`,

                        {
                            type: blob.type,
                            lastModified: Date.now()
                        }

                    );


                console.log(
                    "CREATED FILE:",
                    pastedFile
                );


                console.log(
                    "BEFORE addFiles()"
                );


                addFiles([
                    pastedFile
                ]);


                console.log(
                    "AFTER addFiles()"
                );


                event.preventDefault();

                return;

            }

        }


        console.log(
            "No image found in clipboard"
        );

    };


    window.addEventListener(
        "paste",
        handlePaste
    );


    return () => {

        window.removeEventListener(
            "paste",
            handlePaste
        );

    };

}, [addFiles]);


    // ==========================================
    // RETRY UPLOAD
    // ==========================================

    const retryUpload = async (index) => {

        const controller =
            new AbortController();


        setController(
            index,
            controller
        );


        updateStatus(
            index,
            "uploading"
        );


        updateProgress(
            index,
            0
        );


        try {

            /*
            Upload processed file if it exists.

            Otherwise upload original file.
            */

            const fileToUpload =
                files[index].processedFile ||
                files[index].file;


            const result =
                await uploadFile(

                    fileToUpload,

                    controller,

                    (percent) => {

                        updateProgress(
                            index,
                            percent
                        );

                    }

                );


            // Save backend ID

            updateFileId(
                index,
                result.id
            );


            updateStatus(
                index,
                "uploaded"
            );

        }

        catch (error) {

            console.error(
                "Retry upload failed:",
                error
            );


            if (

                error.name === "CanceledError" ||

                error.code === "ERR_CANCELED"

            ) {

                updateStatus(
                    index,
                    "cancelled"
                );

            }

            else {

                updateStatus(
                    index,
                    "failed"
                );

            }

        }

    };


    // ==========================================
    // MAIN UPLOAD
    // ==========================================

    const handleUpload = async () => {

        if (files.length === 0) {

            alert(
                "Please select at least one file."
            );

            return;

        }


        setUploading(true);


        for (
            let i = 0;
            i < files.length;
            i++
        ) {

            /*
            Don't upload already uploaded files.
            */

            if (
                files[i].status === "uploaded"
            ) {

                continue;

            }


            const controller =
                new AbortController();


            setController(
                i,
                controller
            );


            try {

                updateStatus(
                    i,
                    "uploading"
                );


                /*
                IMPORTANT

                If the user cropped the image:

                    processedFile

                will be used.

                Otherwise:

                    original file

                will be used.
                */

                const fileToUpload =
                    files[i].processedFile ||
                    files[i].file;


                const result =
                    await uploadFile(

                        fileToUpload,

                        controller,

                        (percent) => {

                            updateProgress(
                                i,
                                percent
                            );

                        }

                    );


                /*
                Save backend file ID.
                */

                updateFileId(
                    i,
                    result.id
                );


                /*
                Mark as uploaded.
                */

                updateStatus(
                    i,
                    "uploaded"
                );

            }

            catch (error) {

                console.error(
                    `Upload failed for ${files[i].file.name}:`,
                    error
                );


                if (

                    error.name === "CanceledError" ||

                    error.code === "ERR_CANCELED"

                ) {

                    updateStatus(
                        i,
                        "cancelled"
                    );

                }

                else {

                    updateStatus(
                        i,
                        "failed"
                    );

                }

            }

        }


        setUploading(false);

    };


    // ==========================================
    // DELETE FILE
    // ==========================================

    const handleDelete = async (index) => {

        const selectedFile =
            files[index];


        if (!selectedFile) {
            return;
        }


        // ======================================
        // CURRENTLY UPLOADING
        // ======================================

        if (
            selectedFile.status === "uploading"
        ) {

            cancelUpload(index);

            removeFile(index);

            return;

        }


        // ======================================
        // NOT UPLOADED
        // ======================================

        if (!selectedFile.id) {

            removeFile(index);

            return;

        }


        // ======================================
        // DELETE FROM BACKEND
        // ======================================

        try {

            await deleteFile(
                selectedFile.id
            );


            removeFile(index);

        }

        catch (error) {

            console.error(
                "Delete failed:",
                error
            );

            alert(
                "Unable to delete the file."
            );

        }

    };

    // ==========================================
    // CONTINUE TO OCR
    // ==========================================

    const handleContinue = () => {
        const uploadedFiles = files.filter(
            (file) => file.status === "uploaded" && file.id
        );

        if (uploadedFiles.length === 0) {
            alert(
                "Please upload at least one file before continuing to OCR."
            );

            return;
        }

        navigate("/ocr", {
            state: {
                files: uploadedFiles.map((file) => ({
                    id: file.id,
                    name: file.file.name,
                    type: file.file.type,
                })),
            },
        });
    };


    // ==========================================
    // UI
    // ==========================================

    return (

        <div
            className="
                min-h-screen
                bg-slate-950
                flex
                flex-col
            "
        >

            <Navbar />


            <main className="flex-1">

                <section
                    className="
                        max-w-7xl
                        mx-auto
                        px-6
                        py-12
                    "
                >

                    {/* PAGE TITLE */}

                    <h1
                        className="
                            text-4xl
                            font-bold
                            text-white
                        "
                    >
                        Upload Documents
                    </h1>


                    <p
                        className="
                            text-slate-400
                            mt-3
                        "
                    >
                        Upload handwritten notes or PDFs
                        to begin OCR processing.
                    </p>


                    {/* UPLOAD ZONE */}

                    <div className="mt-10">

                        {files.length > 0 ? (

                            <div
                                className="
                                    grid
                                    lg:grid-cols-[280px_1fr]
                                    gap-8
                                    items-start
                                "
                            >

                                {/* ================================
                                    PAGE SIDEBAR
                                ================================= */}

                                <PageSidebar
                                    files={files}
                                    reorderFiles={reorderFiles}
                                />


                                {/* ================================
                                    UPLOAD ZONE
                                ================================= */}

                                <div className="min-w-0">

                                    <UploadZone
                                        files={files}
                                        addFiles={addFiles}
                                        openCamera={openCamera}
                                    />

                                </div>

                            </div>

                        ) : (

                            /* =====================================
                                EMPTY STATE
                                No sidebar until files are selected
                            ====================================== */

                            <UploadZone
                                files={files}
                                addFiles={addFiles}
                                openCamera={openCamera}
                            />

                        )}

                    </div>


                    {/* FILE PREVIEW */}

                    <FilePreview

                        files={files}

                        removeFile={removeFile}

                        cancelUpload={cancelUpload}

                        retryUpload={retryUpload}

                        handleDelete={handleDelete}

                        rotateFile={rotateFile}

                        openCrop={openCrop}

                        handleCompress={handleCompress}

                    />


                    {/* UPLOAD BUTTON */}

                    {files.length > 0 && (

                        <div
                            className="
                                flex
                                justify-center
                                mt-8
                            "
                        >

                            <button

                                onClick={handleUpload}

                                disabled={uploading}

                                className={`
                                    px-8
                                    py-3
                                    rounded-xl
                                    text-white
                                    font-semibold
                                    transition

                                    ${
                                        uploading

                                            ? "bg-slate-600 cursor-not-allowed"

                                            : "bg-indigo-600 hover:bg-indigo-700"
                                    }
                                `}

                            >

                                {uploading

                                    ? "Uploading..."

                                    : "Upload Files"

                                }

                            </button>

                        </div>

                    )}

                    {/* ==========================================
                        CONTINUE TO OCR
                    ========================================== */}

                    <div className="flex justify-center mt-10 pb-6">

                        <button
                            type="button"
                            onClick={handleContinue}
                            className="
                                px-10
                                py-4
                                rounded-xl
                                bg-emerald-600
                                hover:bg-emerald-700
                                text-white
                                font-semibold
                                text-lg
                                transition-all
                                duration-200
                                shadow-lg
                                shadow-emerald-500/20
                            "
                        >

                            Continue to OCR

                        </button>

                    </div>

                </section>

            </main>


            <Footer />


            {/* ==================================
                CROP MODAL
            ================================== */}

            {cropIndex !== null &&
                files[cropIndex] && (

                <CropModal

                    file={
                        files[cropIndex].file
                    }

                    onClose={
                        closeCrop
                    }

                    onSave={
                        saveCrop
                    }

                />

            )}

            {cameraOpen && (

                <CameraModal
                    onClose={closeCamera}
                    onCapture={handleCameraCapture}
                />

            )}

        </div>

    );

}


export default UploadPage;