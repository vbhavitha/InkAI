import imageCompression from "browser-image-compression";

export const compressImage = async (file) => {

    const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 3000,
        useWebWorker: true,
        initialQuality: 0.8
    };

    const compressedFile = await imageCompression(
        file,
        options
    );

    return new File(
        [compressedFile],
        file.name,
        {
            type: compressedFile.type,
            lastModified: Date.now()
        }
    );
};