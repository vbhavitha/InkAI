import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    Check,
    Loader2,
    AlertCircle,
    FileText,
    RefreshCw,
    Upload,
} from "lucide-react";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";


const API_BASE_URL = "http://127.0.0.1:8000";


const PROCESSING_STEPS = [
    {
        key: "preparing",
        label: "Preparing document",
    },
    {
        key: "detecting",
        label: "Detecting text",
    },
    {
        key: "recognizing",
        label: "Recognizing handwriting",
    },
    {
        key: "analyzing",
        label: "Analyzing structure",
    },
    {
        key: "preparing_text",
        label: "Preparing editable text",
    },
];


function OCRPage() {

    const location = useLocation();

    const navigate = useNavigate();


    // ==========================================
    // FILES FROM UPLOAD PAGE
    // ==========================================

    const uploadedFiles =
        location.state?.files || [];


    // ==========================================
    // STATE
    // ==========================================

    const [currentFileIndex, setCurrentFileIndex] =
        useState(0);

    const [currentStep, setCurrentStep] =
        useState(0);

    const [processing, setProcessing] =
        useState(true);

    const [error, setError] =
        useState(null);

    const [retryKey, setRetryKey] = 
        useState(0);


    // ==========================================
    // RUN OCR
    // ==========================================

    useEffect(() => {

        let cancelled = false;


        const runOCR = async () => {

            // --------------------------------------
            // NO FILE
            // --------------------------------------

            if (!uploadedFiles.length) {

                setProcessing(false);

                setError({
                    type: "no-file",
                    message:
                        "No uploaded document was found.",
                });

                return;
            }


            const file =
                uploadedFiles[currentFileIndex];


            // --------------------------------------
            // MISSING FILE ID
            // --------------------------------------

            if (!file?.id) {

                setProcessing(false);

                setError({
                    type: "failure",
                    message:
                        "The uploaded file could not be identified.",
                });

                return;
            }


            try {

                setError(null);

                setProcessing(true);

                setCurrentStep(0);


                // ==================================
                // STEP 1
                // Preparing document
                // ==================================

                setCurrentStep(0);

                await wait(700);


                if (cancelled) {
                    return;
                }


                // ==================================
                // STEP 2
                // Detecting text
                // ==================================

                setCurrentStep(1);

                await wait(800);


                if (cancelled) {
                    return;
                }


                // ==================================
                // STEP 3
                // Recognizing handwriting
                // ==================================

                setCurrentStep(2);


                const response =
                    await fetch(
                        `${API_BASE_URL}/api/ocr/process/${file.id}?language=en`,
                        {
                            method: "POST",
                        }
                    );


                if (cancelled) {
                    return;
                }


                // ==================================
                // HTTP ERROR
                // ==================================

                if (!response.ok) {

                    let errorMessage =
                        "Something went wrong while reading this document.";

                    let errorType =
                        "failure";


                    try {

                        const errorData =
                            await response.json();


                        const detail =
                            errorData?.detail;


                        if (typeof detail === "string") {

                            errorMessage =
                                detail;

                        }
                        else if (
                            Array.isArray(detail)
                        ) {

                            errorMessage =
                                detail
                                    .map(
                                        (item) =>
                                            item?.msg
                                    )
                                    .filter(Boolean)
                                    .join(", ");

                        }

                    }
                    catch {
                        // Ignore invalid JSON
                    }


                    /*
                     * Detect common "no processed image"
                     * situations.
                     */

                    if (
                        errorMessage
                            .toLowerCase()
                            .includes(
                                "processed image not found"
                            )
                    ) {

                        errorType =
                            "processing";

                    }


                    throw new OCROperationError(
                        errorMessage,
                        errorType
                    );
                }


                // ==================================
                // GET OCR RESULT
                // ==================================

                const result =
                    await response.json();


                if (cancelled) {
                    return;
                }


                // ==================================
                // CHECK NO TEXT DETECTED
                // ==================================

                const words =
                    Array.isArray(result?.words)
                        ? result.words
                        : [];


                const fullText =
                    typeof result?.full_text === "string"
                        ? result.full_text.trim()
                        : "";


                if (
                    words.length === 0 &&
                    !fullText
                ) {

                    setProcessing(false);

                    setError({
                        type: "no-text",
                        message:
                            "We couldn't detect readable text on this page.",
                    });

                    return;
                }


                // ==================================
                // STEP 4
                // Analyzing structure
                // ==================================

                setCurrentStep(3);

                await wait(500);


                if (cancelled) {
                    return;
                }


                // ==================================
                // STEP 5
                // Preparing editable text
                // ==================================

                setCurrentStep(4);

                await wait(500);


                if (cancelled) {
                    return;
                }


                // ==================================
                // OCR COMPLETE
                // ==================================

                setProcessing(false);


                // ==================================
                // NAVIGATE TO RESULTS
                // ==================================

                navigate(
                    "/ocr-results",
                    {
                        state: {

                            ocrResult:
                                result,

                            fileId:
                                file.id,

                            fileName:
                                file.name,

                            imageUrl:
                                null,
                        },
                    }
                );

            }
            catch (err) {

                if (cancelled) {
                    return;
                }


                console.error(
                    "OCR processing failed:",
                    err
                );


                setProcessing(false);


                // ==================================
                // KNOWN OCR ERROR
                // ==================================

                if (
                    err instanceof OCROperationError
                ) {

                    setError({
                        type:
                            err.type ||
                            "failure",

                        message:
                            err.message,
                    });

                    return;
                }


                // ==================================
                // NETWORK / UNKNOWN ERROR
                // ==================================

                setError({
                    type: "failure",

                    message:
                        "Something went wrong while reading this document. Please try again.",
                });
            }
        };


        runOCR();


        return () => {

            cancelled = true;

        };

    }, [
        currentFileIndex,
        navigate,
        retryKey,
    ]);


    // ==========================================
    // RETRY OCR
    // ==========================================

    const handleRetry = () => {

        setError(null);

        setCurrentStep(0);

        setProcessing(true);

        setRetryKey((value) => value + 1);

    };


    // ==========================================
    // RETRY HELPER
    // ==========================================

    function runRetry() {

        /*
         * A small state change forces the effect
         * to execute again.
         */

        setCurrentStep(
            (step) => step === 0 ? 1 : 0
        );

        setTimeout(() => {

            setCurrentStep(0);

            setProcessing(true);

        }, 50);
    }


    // ==========================================
    // GO TO UPLOAD
    // ==========================================

    const handleGoToUpload = () => {

        navigate("/upload");

    };


    // ==========================================
    // BACK
    // ==========================================

    const handleBack = () => {

        if (processing) {
            return;
        }

        navigate("/upload");

    };


    // ==========================================
    // ERROR SCREEN
    // ==========================================

    if (error) {

        return (

            <div
                className="
                    min-h-screen
                    bg-slate-950
                    text-white
                    flex
                    flex-col
                "
            >

                <Navbar />


                <main
                    className="
                        flex-1
                        flex
                        items-center
                        justify-center
                        px-6
                        py-12
                    "
                >

                    <div
                        className="
                            w-full
                            max-w-lg
                            text-center
                        "
                    >

                        {/* ==================================
                            ICON
                        ================================== */}

                        <div
                            className={`
                                w-20
                                h-20
                                mx-auto
                                rounded-2xl
                                flex
                                items-center
                                justify-center
                                mb-6

                                ${
                                    error.type === "no-text"
                                        ? "bg-amber-500/10 border border-amber-500/20"
                                        : "bg-red-500/10 border border-red-500/20"
                                }
                            `}
                        >

                            {error.type === "no-text" ? (

                                <FileText
                                    className="
                                        w-10
                                        h-10
                                        text-amber-400
                                    "
                                />

                            ) : (

                                <AlertCircle
                                    className="
                                        w-10
                                        h-10
                                        text-red-400
                                    "
                                />

                            )}

                        </div>


                        {/* ==================================
                            TITLE
                        ================================== */}

                        <h1
                            className="
                                text-2xl
                                md:text-3xl
                                font-bold
                            "
                        >

                            {error.type === "no-text"
                                ? "No readable text detected"
                                : error.type === "processing"
                                ? "Document processing failed"
                                : error.type === "no-file"
                                ? "No document found"
                                : "OCR Processing Failed"}

                        </h1>


                        {/* ==================================
                            DESCRIPTION
                        ================================== */}

                        <p
                            className="
                                text-slate-400
                                mt-4
                                leading-7
                            "
                        >

                            {error.type === "no-text" ? (

                                <>
                                    We couldn't detect readable
                                    text on this page.
                                    <br />

                                    Try improving the image or
                                    using Auto Enhance.
                                </>

                            ) : error.type === "processing" ? (

                                <>
                                    The document could not be
                                    prepared for OCR.
                                    <br />

                                    Please process the image again
                                    and retry.
                                </>

                            ) : error.type === "no-file" ? (

                                <>
                                    No uploaded document is
                                    available for OCR.
                                    <br />

                                    Please upload a document first.
                                </>

                            ) : (

                                <>
                                    Something went wrong while
                                    reading this document.
                                    <br />

                                    Please try again.
                                </>

                            )}

                        </p>


                        {/* ==================================
                            TECHNICAL ERROR
                        ================================== */}

                        {error.message &&
                            error.message !==
                                "Something went wrong while reading this document." &&
                            error.message !==
                                "No uploaded document was found." && (

                                <details
                                    className="
                                        mt-5
                                        text-left
                                        rounded-xl
                                        bg-slate-900
                                        border
                                        border-slate-800
                                        p-4
                                    "
                                >

                                    <summary
                                        className="
                                            text-xs
                                            text-slate-500
                                            cursor-pointer
                                        "
                                    >
                                        Technical details
                                    </summary>


                                    <p
                                        className="
                                            text-xs
                                            text-slate-500
                                            mt-3
                                            break-words
                                        "
                                    >
                                        {error.message}
                                    </p>

                                </details>
                            )}


                        {/* ==================================
                            ACTIONS
                        ================================== */}

                        <div
                            className="
                                flex
                                flex-col
                                sm:flex-row
                                justify-center
                                gap-3
                                mt-8
                            "
                        >

                            {error.type !== "no-file" && (

                                <button
                                    onClick={handleRetry}
                                    className="
                                        flex
                                        items-center
                                        justify-center
                                        gap-2
                                        px-5
                                        py-3
                                        rounded-xl
                                        bg-indigo-600
                                        hover:bg-indigo-500
                                        transition
                                        font-medium
                                    "
                                >

                                    <RefreshCw
                                        className="
                                            w-4
                                            h-4
                                        "
                                    />

                                    Try Again

                                </button>

                            )}


                            <button
                                onClick={handleGoToUpload}
                                className="
                                    flex
                                    items-center
                                    justify-center
                                    gap-2
                                    px-5
                                    py-3
                                    rounded-xl
                                    bg-slate-800
                                    hover:bg-slate-700
                                    transition
                                    font-medium
                                "
                            >

                                <Upload
                                    className="
                                        w-4
                                        h-4
                                    "
                                />

                                Upload Another Image

                            </button>

                        </div>


                        {/* ==================================
                            IMAGE QUALITY SUGGESTION
                        ================================== */}

                        {error.type === "no-text" && (

                            <div
                                className="
                                    mt-8
                                    p-4
                                    rounded-xl
                                    bg-slate-900
                                    border
                                    border-slate-800
                                    text-left
                                "
                            >

                                <p
                                    className="
                                        text-sm
                                        font-medium
                                        text-white
                                    "
                                >
                                    Tips for better OCR
                                </p>


                                <ul
                                    className="
                                        mt-3
                                        space-y-2
                                        text-sm
                                        text-slate-400
                                    "
                                >

                                    <li>
                                        • Use a clear,
                                        well-lit image.
                                    </li>

                                    <li>
                                        • Keep the handwriting
                                        in focus.
                                    </li>

                                    <li>
                                        • Try Auto Enhance
                                        before running OCR.
                                    </li>

                                    <li>
                                        • Avoid heavily tilted
                                        or blurry images.
                                    </li>

                                </ul>

                            </div>

                        )}

                    </div>

                </main>


                <Footer />

            </div>
        );
    }


    // ==========================================
    // PROCESSING SCREEN
    // ==========================================

    return (

        <div
            className="
                min-h-screen
                bg-slate-950
                text-white
                flex
                flex-col
            "
        >

            <Navbar />


            <main
                className="
                    flex-1
                    flex
                    items-center
                    justify-center
                    px-6
                    py-12
                "
            >

                <div
                    className="
                        w-full
                        max-w-xl
                    "
                >

                    {/* ==================================
                        HEADER
                    ================================== */}

                    <div
                        className="
                            text-center
                            mb-8
                        "
                    >

                        <div
                            className="
                                w-20
                                h-20
                                mx-auto
                                rounded-2xl
                                bg-indigo-500/10
                                border
                                border-indigo-500/20
                                flex
                                items-center
                                justify-center
                                mb-6
                            "
                        >

                            <Loader2
                                className="
                                    w-10
                                    h-10
                                    text-indigo-400
                                    animate-spin
                                "
                            />

                        </div>


                        <h1
                            className="
                                text-3xl
                                md:text-4xl
                                font-bold
                            "
                        >
                            Reading your handwriting...
                        </h1>


                        <p
                            className="
                                text-slate-400
                                mt-3
                            "
                        >
                            InkAI is analyzing your document.
                        </p>

                    </div>


                    {/* ==================================
                        FILE
                    ================================== */}

                    {uploadedFiles.length > 0 && (

                        <div
                            className="
                                mb-6
                                p-4
                                rounded-xl
                                bg-slate-900
                                border
                                border-slate-800
                                flex
                                items-center
                                gap-3
                            "
                        >

                            <div
                                className="
                                    w-10
                                    h-10
                                    rounded-lg
                                    bg-slate-800
                                    flex
                                    items-center
                                    justify-center
                                    shrink-0
                                "
                            >

                                <FileText
                                    className="
                                        w-5
                                        h-5
                                        text-indigo-400
                                    "
                                />

                            </div>


                            <div
                                className="
                                    min-w-0
                                "
                            >

                                <p
                                    className="
                                        text-sm
                                        font-medium
                                        truncate
                                    "
                                >
                                    {
                                        uploadedFiles[
                                            currentFileIndex
                                        ]?.name ||
                                        "Document"
                                    }
                                </p>


                                <p
                                    className="
                                        text-xs
                                        text-slate-500
                                        mt-1
                                    "
                                >
                                    Document{" "}
                                    {currentFileIndex + 1}{" "}
                                    of{" "}
                                    {uploadedFiles.length}
                                </p>

                            </div>

                        </div>

                    )}


                    {/* ==================================
                        PROCESSING CARD
                    ================================== */}

                    <div
                        className="
                            bg-slate-900
                            border
                            border-slate-800
                            rounded-2xl
                            p-6
                            md:p-8
                        "
                    >

                        <div
                            className="
                                space-y-6
                            "
                        >

                            {PROCESSING_STEPS.map(
                                (step, index) => {

                                    const completed =
                                        index <
                                        currentStep;

                                    const active =
                                        index ===
                                        currentStep;


                                    return (

                                        <div
                                            key={step.key}
                                            className="
                                                flex
                                                items-center
                                                gap-4
                                            "
                                        >

                                            <div
                                                className={`
                                                    w-9
                                                    h-9
                                                    rounded-full
                                                    flex
                                                    items-center
                                                    justify-center
                                                    shrink-0

                                                    ${
                                                        completed
                                                            ? "bg-emerald-500/15 text-emerald-400"
                                                            : active
                                                            ? "bg-indigo-500/15 text-indigo-400"
                                                            : "bg-slate-800 text-slate-600"
                                                    }
                                                `}
                                            >

                                                {completed ? (

                                                    <Check
                                                        className="
                                                            w-5
                                                            h-5
                                                        "
                                                    />

                                                ) : active ? (

                                                    <Loader2
                                                        className="
                                                            w-5
                                                            h-5
                                                            animate-spin
                                                        "
                                                    />

                                                ) : (

                                                    <span
                                                        className="
                                                            w-2.5
                                                            h-2.5
                                                            rounded-full
                                                            bg-current
                                                        "
                                                    />

                                                )}

                                            </div>


                                            <span
                                                className={`
                                                    text-sm
                                                    md:text-base

                                                    ${
                                                        completed
                                                            ? "text-emerald-400"
                                                            : active
                                                            ? "text-white font-medium"
                                                            : "text-slate-500"
                                                    }
                                                `}
                                            >
                                                {step.label}
                                            </span>

                                        </div>

                                    );
                                }
                            )}

                        </div>


                        {/* ==================================
                            PROGRESS
                        ================================== */}

                        <div
                            className="
                                mt-8
                            "
                        >

                            <div
                                className="
                                    h-1.5
                                    w-full
                                    rounded-full
                                    bg-slate-800
                                    overflow-hidden
                                "
                            >

                                <div
                                    className="
                                        h-full
                                        rounded-full
                                        bg-indigo-500
                                        transition-all
                                        duration-500
                                    "
                                    style={{
                                        width:
                                            `${
                                                (
                                                    (
                                                        currentStep + 1
                                                    ) /
                                                    PROCESSING_STEPS.length
                                                ) *
                                                100
                                            }%`,
                                    }}
                                />

                            </div>


                            <div
                                className="
                                    flex
                                    justify-between
                                    mt-2
                                    text-xs
                                    text-slate-500
                                "
                            >

                                <span>
                                    Processing
                                </span>


                                <span>
                                    {
                                        Math.round(
                                            (
                                                (
                                                    currentStep + 1
                                                ) /
                                                PROCESSING_STEPS.length
                                            ) *
                                            100
                                        )
                                    }
                                    %
                                </span>

                            </div>

                        </div>

                    </div>


                    {/* ==================================
                        NOTICE
                    ================================== */}

                    <p
                        className="
                            text-center
                            text-xs
                            text-slate-500
                            mt-6
                        "
                    >
                        Handwriting recognition may take
                        a little longer for detailed documents.
                    </p>

                </div>

            </main>


            <Footer />

        </div>
    );
}


// ==========================================
// ERROR CLASS
// ==========================================

class OCROperationError extends Error {

    constructor(message, type = "failure") {

        super(message);

        this.name =
            "OCROperationError";

        this.type =
            type;
    }
}


// ==========================================
// WAIT HELPER
// ==========================================

function wait(milliseconds) {

    return new Promise(
        (resolve) =>
            setTimeout(
                resolve,
                milliseconds
            )
    );
}


export default OCRPage;