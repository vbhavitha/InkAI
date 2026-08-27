import { useRef, useState } from "react";
import Webcam from "react-webcam";
import {
    Camera,
    X,
    RotateCcw,
    Check
} from "lucide-react";


function CameraModal({
    onClose,
    onCapture
}) {

    const webcamRef = useRef(null);


    const [capturedImage, setCapturedImage] =
        useState(null);


    const [cameraError, setCameraError] =
        useState(false);


    // ==========================================
    // CAPTURE PHOTO
    // ==========================================

    const capturePhoto = () => {

        if (!webcamRef.current) {

            console.error(
                "Webcam reference is not available."
            );

            return;

        }


        const imageSrc =
            webcamRef.current.getScreenshot();


        if (!imageSrc) {

            alert(
                "Unable to capture image. Please check camera permission."
            );

            return;

        }


        setCapturedImage(
            imageSrc
        );

    };


    // ==========================================
    // RETAKE
    // ==========================================

    const retakePhoto = () => {

        setCapturedImage(null);

    };


    // ==========================================
    // USE PHOTO
    // ==========================================

    const usePhoto = async () => {

        if (!capturedImage) {
            return;
        }


        try {

            const response =
                await fetch(
                    capturedImage
                );


            const blob =
                await response.blob();


            const file =
                new File(

                    [blob],

                    `camera-${Date.now()}.jpg`,

                    {
                        type: "image/jpeg",

                        lastModified:
                            Date.now()
                    }

                );


            console.log(
                "Camera file created:",
                file
            );


            onCapture(file);

            onClose();

        }

        catch (error) {

            console.error(
                "Camera image conversion failed:",
                error
            );

            alert(
                "Unable to use captured image."
            );

        }

    };


    // ==========================================
    // CAMERA ERROR
    // ==========================================

    const handleCameraError = (
        error
    ) => {

        console.error(
            "Camera error:",
            error
        );

        setCameraError(true);

    };


    return (

        <div
            className="
                fixed
                inset-0
                z-[9999]
                bg-black/80
                backdrop-blur-sm
                flex
                items-center
                justify-center
                p-4
            "
        >

            <div
                className="
                    w-full
                    max-w-3xl
                    bg-slate-900
                    border
                    border-slate-700
                    rounded-3xl
                    shadow-2xl
                    overflow-hidden
                "
            >

                {/* ================================= */}
                {/* HEADER */}
                {/* ================================= */}

                <div
                    className="
                        flex
                        items-center
                        justify-between
                        px-6
                        py-5
                        border-b
                        border-slate-800
                    "
                >

                    <div
                        className="
                            flex
                            items-center
                            gap-3
                        "
                    >

                        <div
                            className="
                                w-10
                                h-10
                                rounded-xl
                                bg-indigo-500/20
                                flex
                                items-center
                                justify-center
                            "
                        >

                            <Camera
                                size={22}
                                className="
                                    text-indigo-400
                                "
                            />

                        </div>


                        <div>

                            <h2
                                className="
                                    text-xl
                                    font-bold
                                    text-white
                                "
                            >
                                Capture Notes
                            </h2>


                            <p
                                className="
                                    text-sm
                                    text-slate-400
                                "
                            >
                                Take a photo of your handwritten notes
                            </p>

                        </div>

                    </div>


                    <button
                        type="button"
                        onClick={onClose}
                        className="
                            w-10
                            h-10
                            rounded-full
                            bg-slate-800
                            hover:bg-red-600
                            flex
                            items-center
                            justify-center
                            text-slate-300
                            hover:text-white
                            transition
                        "
                    >

                        <X size={20} />

                    </button>

                </div>


                {/* ================================= */}
                {/* CAMERA */}
                {/* ================================= */}

                <div className="p-6">

                    {cameraError ? (

                        <div
                            className="
                                h-96
                                rounded-2xl
                                bg-slate-800
                                flex
                                flex-col
                                items-center
                                justify-center
                                text-center
                                px-6
                            "
                        >

                            <Camera
                                size={60}
                                className="
                                    text-red-400
                                    mb-4
                                "
                            />


                            <h3
                                className="
                                    text-xl
                                    font-semibold
                                    text-white
                                "
                            >
                                Camera unavailable
                            </h3>


                            <p
                                className="
                                    text-slate-400
                                    mt-2
                                    max-w-md
                                "
                            >
                                Please allow camera access
                                in your browser and try again.
                            </p>

                        </div>

                    ) : capturedImage ? (

                        /* ================================= */
                        /* CAPTURED IMAGE */
                        /* ================================= */

                        <div
                            className="
                                rounded-2xl
                                overflow-hidden
                                bg-black
                                flex
                                justify-center
                            "
                        >

                            <img
                                src={capturedImage}
                                alt="Captured notes"
                                className="
                                    max-h-[60vh]
                                    w-auto
                                    max-w-full
                                    object-contain
                                "
                            />

                        </div>

                    ) : (

                        /* ================================= */
                        /* LIVE CAMERA */
                        /* ================================= */

                        <div
                            className="
                                rounded-2xl
                                overflow-hidden
                                bg-black
                                min-h-[400px]
                                flex
                                items-center
                                justify-center
                            "
                        >

                            <Webcam
                                ref={webcamRef}
                                audio={false}
                                screenshotFormat="image/jpeg"
                                screenshotQuality={0.92}
                                onUserMediaError={
                                    handleCameraError
                                }
                                className="
                                    w-full
                                    max-h-[60vh]
                                    object-contain
                                "
                            />

                        </div>

                    )}

                </div>


                {/* ================================= */}
                {/* ACTIONS */}
                {/* ================================= */}

                <div
                    className="
                        px-6
                        pb-6
                        flex
                        justify-center
                        gap-4
                    "
                >

                    {!capturedImage ? (

                        <button
                            type="button"
                            onClick={capturePhoto}
                            disabled={cameraError}
                            className="
                                bg-indigo-600
                                hover:bg-indigo-700
                                disabled:bg-slate-700
                                disabled:cursor-not-allowed
                                text-white
                                px-8
                                py-3
                                rounded-xl
                                font-semibold
                                flex
                                items-center
                                gap-2
                                transition
                            "
                        >

                            <Camera size={20} />

                            Capture Photo

                        </button>

                    ) : (

                        <>

                            <button
                                type="button"
                                onClick={retakePhoto}
                                className="
                                    bg-slate-800
                                    hover:bg-slate-700
                                    text-white
                                    px-6
                                    py-3
                                    rounded-xl
                                    font-semibold
                                    flex
                                    items-center
                                    gap-2
                                    transition
                                "
                            >

                                <RotateCcw size={18} />

                                Retake

                            </button>


                            <button
                                type="button"
                                onClick={usePhoto}
                                className="
                                    bg-emerald-600
                                    hover:bg-emerald-700
                                    text-white
                                    px-6
                                    py-3
                                    rounded-xl
                                    font-semibold
                                    flex
                                    items-center
                                    gap-2
                                    transition
                                "
                            >

                                <Check size={18} />

                                Use Photo

                            </button>

                        </>

                    )}

                </div>

            </div>

        </div>

    );

}


export default CameraModal;