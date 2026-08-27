import axios from "axios";


const API = axios.create({

    baseURL: "http://127.0.0.1:8000"

});


// ==========================================
// UPLOAD FILE
// ==========================================

export const uploadFile = async (
    file,
    controller,
    onProgress
) => {

    const formData =
        new FormData();


    formData.append(
        "file",
        file
    );


    const response = await API.post(

        "/upload/",

        formData,

        {

            signal:
                controller.signal,

            onUploadProgress:
                (progressEvent) => {

                    if (
                        progressEvent.total
                    ) {

                        const percent =
                            Math.round(

                                (
                                    progressEvent.loaded *
                                    100
                                ) /
                                progressEvent.total

                            );


                        onProgress(percent);

                    }

                }

        }

    );


    return response.data;

};


// ==========================================
// DELETE FILE
// ==========================================

export const deleteFile = async (
    fileId
) => {

    const response = await API.delete(

        `/upload/${fileId}`

    );


    return response.data;

};