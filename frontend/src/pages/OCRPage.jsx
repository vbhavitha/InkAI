import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    Check,
    Loader2,
    AlertCircle,
    FileText,
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
    // FILES RECEIVED FROM UPLOAD PAGE
    // ==========================================

    const uploadedFiles =
        location.state?.files || [];


    // ==========================================
    // CURRENT FILE
    // ==========================================

    const [currentFileIndex, setCurrentFileIndex] =
        useState(0);


    // ==========================================
    // PROCESSING STATE
    // ==========================================

    const [currentStep, setCurrentStep] =
        useState(0);


    const [processing, setProcessing] =
        useState(true);


    const [error, setError] =
        useState(null);


    // ==========================================
    // PROCESSING FUNCTION
    // ==========================================

    useEffect(() => {

        let cancelled = false;

        let timers = [];


        const runOCR = async () => {

            // --------------------------------------
            // NO FILES
            // --------------------------------------

            if (!uploadedFiles.length) {

                setProcessing(false);

                setError(
                    "No uploaded document was found."
                );

                return;
            }


            const file =
                uploadedFiles[currentFileIndex];


            if (!file?.id) {

                setProcessing(false);

                setError(
                    "The uploaded file ID is missing."
                );

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


                /*
                 * The actual backend OCR request
                 * happens here.
                 *
                 * This can take several seconds because
                 * EasyOCR and TrOCR may both be used.
                 */

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


                if (!response.ok) {

                    let message =
                        "OCR processing failed.";

                    try {

                        const errorData =
                            await response.json();

                        if (errorData?.detail) {
                            message =
                                errorData.detail;
                        }

                    }
                    catch {
                        // Ignore invalid error JSON
                    }


                    throw new Error(message);
                }


                const result =
                    await response.json();


                if (cancelled) {
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


                /*
                 * Navigate to OCR Results.
                 *
                 * We pass:
                 *
                 * - OCR result
                 * - file ID
                 * - file name
                 *
                 * The Results page can use these
                 * values later.
                 */

                navigate(
                    "/ocr-results",
                    {
                        state: {
                            ocrResult: result,

                            fileId: file.id,

                            fileName: file.name,

                            imageUrl: null,
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

                setError(
                    err.message ||
                    "Unable to process this document."
                );
            }
        };


        runOCR();


        // ==========================================
        // CLEANUP
        // ==========================================

        return () => {

            cancelled = true;

            timers.forEach(
                (timer) =>
                    clearTimeout(timer)
            );

        };

    }, [
        currentFileIndex,
        navigate,
        uploadedFiles,
    ]);


    // ==========================================
    // RETRY
    // ==========================================

    const handleRetry = () => {

        setError(null);

        setCurrentStep(0);

        setProcessing(true);

        /*
         * Changing currentFileIndex temporarily
         * forces the OCR effect to run again.
         */

        setCurrentFileIndex(
            (index) => index
        );

        window.location.reload();
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
            <div className="min-h-screen bg-slate-950 text-white flex flex-col">

                <Navbar />


                <main className="flex-1 flex items-center justify-center px-6">

                    <div className="w-full max-w-md text-center">

                        <div
                            className="
                                w-16
                                h-16
                                mx-auto
                                rounded-2xl
                                bg-red-500/10
                                border
                                border-red-500/20
                                flex
                                items-center
                                justify-center
                                mb-6
                            "
                        >

                            <AlertCircle
                                className="
                                    w-8
                                    h-8
                                    text-red-400
                                "
                            />

                        </div>


                        <h1
                            className="
                                text-2xl
                                font-bold
                                text-white
                            "
                        >
                            OCR Processing Failed
                        </h1>


                        <p
                            className="
                                text-slate-400
                                mt-3
                                leading-6
                            "
                        >
                            {error}
                        </p>


                        <div
                            className="
                                flex
                                justify-center
                                gap-3
                                mt-8
                            "
                        >

                            <button
                                onClick={() =>
                                    navigate("/upload")
                                }
                                className="
                                    px-5
                                    py-3
                                    rounded-xl
                                    bg-slate-800
                                    hover:bg-slate-700
                                    transition
                                    font-medium
                                "
                            >
                                Back to Upload
                            </button>


                            <button
                                onClick={handleRetry}
                                className="
                                    px-5
                                    py-3
                                    rounded-xl
                                    bg-indigo-600
                                    hover:bg-indigo-500
                                    transition
                                    font-medium
                                "
                            >
                                Retry OCR
                            </button>

                        </div>

                    </div>

                </main>


                <Footer />

            </div>
        );
    }


    // ==========================================
    // MAIN PROCESSING SCREEN
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
                        TOP
                    ================================== */}

                    <div className="text-center mb-8">

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
                        FILE INFORMATION
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


                            <div className="min-w-0">

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
                        PROGRESS CARD
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

                        <div className="space-y-6">

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

                                            {/* STATUS ICON */}

                                            <div
                                                className={`
                                                    w-9
                                                    h-9
                                                    rounded-full
                                                    flex
                                                    items-center
                                                    justify-center
                                                    shrink-0
                                                    transition-all
                                                    duration-300

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


                                            {/* LABEL */}

                                            <span
                                                className={`
                                                    text-sm
                                                    md:text-base
                                                    transition-colors

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
                            PROGRESS BAR
                        ================================== */}

                        <div className="mt-8">

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
                                        width: `${
                                            ((currentStep + 1) /
                                                PROCESSING_STEPS.length) *
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
                                    {Math.round(
                                        ((currentStep + 1) /
                                            PROCESSING_STEPS.length) *
                                        100
                                    )}
                                    %
                                </span>

                            </div>

                        </div>

                    </div>


                    {/* ==================================
                        INFORMATION
                    ================================== */}

                    <p
                        className="
                            text-center
                            text-xs
                            text-slate-500
                            mt-6
                        "
                    >
                        Handwriting recognition may take a
                        little longer for detailed documents.
                    </p>

                </div>

            </main>


            <Footer />

        </div>
    );
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