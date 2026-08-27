import { useState, useCallback } from "react";
import { validateFiles } from "../utils/fileValidation";
import { compressImage } from "../utils/imageCompression";

export default function useUpload() {

    const [files, setFiles] = useState([]);

    const createFileId = () => {

        return (
            crypto.randomUUID
                ? crypto.randomUUID()
                : `${Date.now()}-${Math.random()}`
        );

    };

    // ==========================================
    // ADD FILES
    // ==========================================

    const addFiles = useCallback((incomingFiles) => {

        if (!incomingFiles) {
            return;
        }

        const fileArray = Array.from(incomingFiles);

        if (fileArray.length === 0) {
            return;
        }

        const validFiles = validateFiles(fileArray);

        if (validFiles.length === 0) {
            return;
        }

        setFiles((prev) => {

            const updated = [
                ...prev,

                ...validFiles.map((file) => ({

                    file,

                    // Frontend-only ID for drag/drop
                    _dndId: createFileId(),

                    // Processed image
                    processedFile: null,

                    // Backend ID
                    id: null,

                    // Upload progress
                    progress: 0,

                    // Upload state
                    status: "waiting",

                    // AbortController
                    controller: null,

                    // Image rotation
                    rotation: 0,

                    // PDF pages
                    pdfPages: []

                }))

            ];

            return updated.slice(0, 50);

        });

    }, []);


    // ==========================================
    // REMOVE FILE
    // ==========================================

    const removeFile = useCallback((index) => {

        setFiles((prev) =>
            prev.filter((_, i) => i !== index)
        );

    }, []);


    // ==========================================
    // UPDATE PROGRESS
    // ==========================================

    const updateProgress = useCallback((index, progress) => {

        setFiles((prev) =>

            prev.map((item, i) =>

                i === index
                    ? {
                        ...item,
                        progress
                    }
                    : item

            )

        );

    }, []);


    // ==========================================
    // UPDATE STATUS
    // ==========================================

    const updateStatus = useCallback((index, status) => {

        setFiles((prev) =>

            prev.map((item, i) =>

                i === index
                    ? {
                        ...item,
                        status
                    }
                    : item

            )

        );

    }, []);


    // ==========================================
    // UPDATE BACKEND ID
    // ==========================================

    const updateFileId = useCallback((index, id) => {

        setFiles((prev) =>

            prev.map((item, i) =>

                i === index
                    ? {
                        ...item,
                        id
                    }
                    : item

            )

        );

    }, []);


    // ==========================================
    // SET CONTROLLER
    // ==========================================

    const setController = useCallback((index, controller) => {

        setFiles((prev) =>

            prev.map((item, i) =>

                i === index
                    ? {
                        ...item,
                        controller
                    }
                    : item

            )

        );

    }, []);


    // ==========================================
    // CANCEL UPLOAD
    // ==========================================

    const cancelUpload = useCallback((index) => {

        setFiles((prev) =>

            prev.map((item, i) => {

                if (i !== index) {
                    return item;
                }

                if (item.controller) {
                    item.controller.abort();
                }

                return {
                    ...item,
                    status: "cancelled"
                };

            })

        );

    }, []);


    // ==========================================
    // ROTATE
    // ==========================================

    const rotateFile = useCallback((index, direction) => {

        setFiles((prev) =>

            prev.map((item, i) => {

                if (i !== index) {
                    return item;
                }

                let rotation = item.rotation || 0;

                if (direction === "right") {
                    rotation += 90;
                }

                if (direction === "left") {
                    rotation -= 90;
                }

                rotation = (rotation + 360) % 360;

                return {
                    ...item,
                    rotation
                };

            })

        );

    }, []);


    // ==========================================
    // SAVE CROPPED FILE
    // ==========================================

    const updateCroppedFile = useCallback(
        (index, croppedFile) => {

            setFiles((prev) =>

                prev.map((item, i) =>

                    i === index
                        ? {
                            ...item,
                            processedFile: croppedFile
                        }
                        : item

                )

            );

        },
        []
    );


    // ==========================================
    // COMPRESS FILE
    // ==========================================

    const compressFile = async (index) => {

        const item = files[index];

        if (!item) {
            return;
        }

        if (!item.file.type.startsWith("image/")) {
            return;
        }

        const sourceFile =
            item.processedFile ||
            item.file;

        const compressedFile =
            await compressImage(sourceFile);

        setFiles((prev) =>

            prev.map((fileItem, i) =>

                i === index
                    ? {
                        ...fileItem,
                        processedFile: compressedFile
                    }
                    : fileItem

            )

        );

        return compressedFile;

    };


    // ==========================================
    // UPDATE PDF PAGES
    // ==========================================

    const updatePdfPages = useCallback(
        (index, pages) => {

            setFiles((prev) =>

                prev.map((item, i) =>

                    i === index
                        ? {
                            ...item,
                            pdfPages: pages
                        }
                        : item

                )

            );

        },
        []
    );

    // ==========================================
    // REORDER FILES
    // ==========================================

    const reorderFiles = (oldIndex, newIndex) => {

        setFiles((prev) => {

            const updated = [...prev];

            const [movedFile] =
                updated.splice(oldIndex, 1);

            updated.splice(
                newIndex,
                0,
                movedFile
            );

            return updated;

        });

    };


    return {

        files,

        addFiles,

        removeFile,

        updateProgress,

        updateStatus,

        updateFileId,

        setController,

        cancelUpload,

        rotateFile,

        updateCroppedFile,

        compressFile,

        updatePdfPages,

        reorderFiles

    };

}