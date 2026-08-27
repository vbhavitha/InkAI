import { toast } from "react-toastify";


// ==========================================
// CONFIGURATION
// ==========================================

const MAX_FILE_SIZE = 50 * 1024 * 1024;

const ALLOWED_TYPES = [
    "image/png",
    "image/jpeg",
    "image/webp",
    "image/heic",
    "image/heif",
    "application/pdf"
];


// ==========================================
// VALIDATE FILES
// ==========================================

export function validateFiles(files) {

    // Always make sure we have an array
    if (!files || !Array.isArray(files)) {

        console.warn(
            "validateFiles received invalid data:",
            files
        );

        return [];

    }


    const validFiles = [];

    let unsupported = 0;

    let oversized = 0;


    // ==========================================
    // CHECK EACH FILE
    // ==========================================

    files.forEach((file) => {

        // Ignore invalid entries
        if (!file) {
            return;
        }


        // Make sure this is actually a File
        if (!(file instanceof File)) {

            console.warn(
                "Invalid clipboard/file object:",
                file
            );

            unsupported++;

            return;

        }


        // ======================================
        // TYPE CHECK
        // ======================================

        if (!ALLOWED_TYPES.includes(file.type)) {

            console.warn(
                "Unsupported file type:",
                file.type,
                file.name
            );

            unsupported++;

            return;

        }


        // ======================================
        // SIZE CHECK
        // ======================================

        if (file.size > MAX_FILE_SIZE) {

            console.warn(
                "File exceeds size limit:",
                file.name,
                file.size
            );

            oversized++;

            return;

        }


        // ======================================
        // VALID FILE
        // ======================================

        validFiles.push(file);

    });


    // ==========================================
    // SUCCESS MESSAGE
    // ==========================================

    if (validFiles.length > 0) {

        toast.success(
            `${validFiles.length} file${
                validFiles.length > 1 ? "s" : ""
            } added successfully`
        );

    }


    // ==========================================
    // UNSUPPORTED FILES
    // ==========================================

    if (unsupported > 0) {

        toast.warning(
            `${unsupported} unsupported file${
                unsupported > 1
                    ? "s were"
                    : " was"
            } skipped`
        );

    }


    // ==========================================
    // LARGE FILES
    // ==========================================

    if (oversized > 0) {

        toast.warning(
            `${oversized} file${
                oversized > 1
                    ? "s exceed"
                    : " exceeds"
            } the 50 MB limit`
        );

    }


    return validFiles;

}