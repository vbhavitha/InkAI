import { useState } from "react";
import Cropper from "react-easy-crop";
import { X, RotateCcw, Check } from "lucide-react";


function CropModal({
    file,
    onClose,
    onSave
}) {

    const [crop, setCrop] = useState({
        x: 0,
        y: 0
    });

    const [zoom, setZoom] = useState(1);

    const [rotation, setRotation] = useState(0);

    const [croppedAreaPixels, setCroppedAreaPixels] =
        useState(null);


    // ==========================================
    // CROP COMPLETE
    // ==========================================

    const onCropComplete = (
        croppedArea,
        croppedAreaPixels
    ) => {

        setCroppedAreaPixels(
            croppedAreaPixels
        );

    };


    // ==========================================
    // SAVE CROP
    // ==========================================

    const handleSave = async () => {

        if (!croppedAreaPixels) {
            return;
        }


        try {

            const croppedImage =
                await getCroppedImg(
                    URL.createObjectURL(file),
                    croppedAreaPixels,
                    rotation
                );


            onSave(croppedImage);

        }

        catch (error) {

            console.error(
                "Crop failed:",
                error
            );

        }

    };


    return (

        <div
            className="
                fixed
                inset-0
                z-50
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
                    max-w-4xl
                    bg-slate-900
                    rounded-2xl
                    border
                    border-slate-700
                    shadow-2xl
                    overflow-hidden
                "
            >

                {/* ==================================
                    HEADER
                ================================== */}

                <div
                    className="
                        flex
                        items-center
                        justify-between
                        px-6
                        py-4
                        border-b
                        border-slate-800
                    "
                >

                    <div>

                        <h2 className="text-xl font-bold text-white">
                            Crop Image
                        </h2>

                        <p className="text-sm text-slate-400 mt-1">
                            Adjust the crop area and save your changes.
                        </p>

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


                {/* ==================================
                    CROPPER
                ================================== */}

                <div
                    className="
                        relative
                        w-full
                        h-[500px]
                        bg-black
                    "
                >

                    <Cropper
                        image={URL.createObjectURL(file)}
                        crop={crop}
                        zoom={zoom}
                        rotation={rotation}
                        aspect={undefined}
                        onCropChange={setCrop}
                        onZoomChange={setZoom}
                        onRotationChange={setRotation}
                        onCropComplete={onCropComplete}
                    />

                </div>


                {/* ==================================
                    CONTROLS
                ================================== */}

                <div className="px-6 py-5">

                    {/* ZOOM */}

                    <div className="mb-5">

                        <div className="flex justify-between mb-2">

                            <span className="text-sm text-slate-300">
                                Zoom
                            </span>

                            <span className="text-sm text-indigo-400">
                                {zoom.toFixed(1)}x
                            </span>

                        </div>


                        <input
                            type="range"
                            min="1"
                            max="3"
                            step="0.1"
                            value={zoom}
                            onChange={(event) =>
                                setZoom(
                                    Number(event.target.value)
                                )
                            }
                            className="w-full accent-indigo-500"
                        />

                    </div>


                    {/* ROTATION */}

                    <div className="flex items-center gap-3">

                        <button
                            type="button"
                            onClick={() =>
                                setRotation(
                                    (rotation - 90 + 360) % 360
                                )
                            }
                            className="
                                flex
                                items-center
                                gap-2
                                px-4
                                py-2
                                rounded-lg
                                bg-slate-800
                                hover:bg-slate-700
                                text-slate-300
                                hover:text-white
                                transition
                            "
                        >

                            <RotateCcw size={16} />

                            Rotate Left

                        </button>


                        <span className="text-sm text-slate-500">

                            {rotation}°

                        </span>


                        <button
                            type="button"
                            onClick={() =>
                                setRotation(
                                    (rotation + 90) % 360
                                )
                            }
                            className="
                                px-4
                                py-2
                                rounded-lg
                                bg-slate-800
                                hover:bg-slate-700
                                text-slate-300
                                hover:text-white
                                transition
                            "
                        >

                            Rotate Right

                        </button>

                    </div>

                </div>


                {/* ==================================
                    FOOTER
                ================================== */}

                <div
                    className="
                        flex
                        justify-end
                        gap-3
                        px-6
                        py-4
                        border-t
                        border-slate-800
                    "
                >

                    <button
                        type="button"
                        onClick={onClose}
                        className="
                            px-5
                            py-2.5
                            rounded-lg
                            bg-slate-800
                            hover:bg-slate-700
                            text-slate-300
                            transition
                        "
                    >

                        Cancel

                    </button>


                    <button
                        type="button"
                        onClick={handleSave}
                        className="
                            flex
                            items-center
                            gap-2
                            px-5
                            py-2.5
                            rounded-lg
                            bg-indigo-600
                            hover:bg-indigo-700
                            text-white
                            font-semibold
                            transition
                        "
                    >

                        <Check size={18} />

                        Save Crop

                    </button>

                </div>

            </div>

        </div>

    );

}


export default CropModal;


// ==========================================
// CREATE CROPPED IMAGE
// ==========================================

async function getCroppedImg(
    imageSrc,
    pixelCrop,
    rotation = 0
) {

    const image =
        await createImage(imageSrc);


    const canvas =
        document.createElement("canvas");


    const ctx =
        canvas.getContext("2d");


    const maxSize = Math.max(
        image.width,
        image.height
    );


    const safeArea =
        2 * ((maxSize / 2) * Math.sqrt(2));


    canvas.width = safeArea;
    canvas.height = safeArea;


    ctx.translate(
        safeArea / 2,
        safeArea / 2
    );


    ctx.rotate(
        (rotation * Math.PI) / 180
    );


    ctx.translate(
        -image.width / 2,
        -image.height / 2
    );


    ctx.drawImage(
        image,
        0,
        0
    );


    const data =
        ctx.getImageData(
            0,
            0,
            safeArea,
            safeArea
        );


    canvas.width =
        pixelCrop.width;

    canvas.height =
        pixelCrop.height;


    ctx.putImageData(
        data,
        Math.round(
            -pixelCrop.x
        ),
        Math.round(
            -pixelCrop.y
        )
    );


    return new Promise(
        (resolve, reject) => {

            canvas.toBlob(
                (blob) => {

                    if (!blob) {

                        reject(
                            new Error(
                                "Canvas is empty"
                            )
                        );

                        return;

                    }


                    const croppedFile =
                        new File(
                            [blob],
                            "cropped-image.jpg",
                            {
                                type: "image/jpeg"
                            }
                        );


                    resolve(
                        croppedFile
                    );

                },
                "image/jpeg",
                0.9
            );

        }
    );

}


// ==========================================
// CREATE IMAGE
// ==========================================

function createImage(url) {

    return new Promise(
        (resolve, reject) => {

            const image =
                new Image();

            image.addEventListener(
                "load",
                () => resolve(image)
            );

            image.addEventListener(
                "error",
                (error) => reject(error)
            );

            image.setAttribute(
                "crossOrigin",
                "anonymous"
            );

            image.src = url;

        }
    );

}