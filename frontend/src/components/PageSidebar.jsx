import {
    DndContext,
    closestCenter
} from "@dnd-kit/core";

import {
    arrayMove,
    SortableContext,
    verticalListSortingStrategy
} from "@dnd-kit/sortable";

import {
    useSortable
} from "@dnd-kit/sortable";

import {
    CSS
} from "@dnd-kit/utilities";

import {
    GripVertical,
    FileText
} from "lucide-react";


function PageSidebar({
    files,
    reorderFiles
}) {

    if (files.length === 0) {
        return null;
    }


    const handleDragEnd = (event) => {

        const {
            active,
            over
        } = event;


        if (!over) {
            return;
        }


        if (active.id === over.id) {
            return;
        }


        const oldIndex =
            files.findIndex(
                (file) =>
                    file._dndId === active.id
            );


        const newIndex =
            files.findIndex(
                (file) =>
                    file._dndId === over.id
            );


        if (
            oldIndex === -1 ||
            newIndex === -1
        ) {
            return;
        }


        reorderFiles(
            oldIndex,
            newIndex
        );

    };


    return (

        <aside
            className="
                w-72
                bg-slate-900
                border
                border-slate-800
                rounded-2xl
                p-4
                h-fit
                sticky
                top-6
            "
        >

            <div className="mb-4">

                <h2
                    className="
                        text-lg
                        font-bold
                        text-white
                    "
                >
                    Pages
                </h2>

                <p
                    className="
                        text-sm
                        text-slate-500
                        mt-1
                    "
                >
                    Drag to reorder pages
                </p>

            </div>


            <DndContext
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >

                <SortableContext
                    items={
                        files.map(
                            (file) =>
                                file._dndId
                        )
                    }
                    strategy={
                        verticalListSortingStrategy
                    }
                >

                    <div className="space-y-3">

                        {files.map(
                            (file, index) => (

                                <SortablePage
                                    key={
                                        file._dndId
                                    }
                                    file={file}
                                    index={index}
                                />

                            )
                        )}

                    </div>

                </SortableContext>

            </DndContext>

        </aside>

    );

}


// ==================================================
// SORTABLE PAGE
// ==================================================

function SortablePage({
    file,
    index
}) {

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({
        id: file._dndId
    });


    const style = {

        transform:
            CSS.Transform.toString(
                transform
            ),

        transition

    };


    const previewFile =
        file.processedFile ||
        file.file;


    const isImage =
        previewFile.type?.startsWith(
            "image/"
        );


    return (

        <div
            ref={setNodeRef}
            style={style}
            className={`
                flex
                items-center
                gap-3
                p-3
                rounded-xl
                border
                transition

                ${
                    isDragging
                        ? "bg-slate-700 border-indigo-500 shadow-xl"
                        : "bg-slate-800 border-slate-700"
                }
            `}
        >

            {/* DRAG HANDLE */}

            <button
                type="button"
                {...attributes}
                {...listeners}
                className="
                    cursor-grab
                    active:cursor-grabbing
                    text-slate-500
                    hover:text-white
                    shrink-0
                "
                aria-label={`Reorder page ${index + 1}`}
            >

                <GripVertical
                    size={20}
                />

            </button>


            {/* THUMBNAIL */}

            <div
                className="
                    w-12
                    h-14
                    rounded-lg
                    bg-slate-950
                    overflow-hidden
                    flex
                    items-center
                    justify-center
                    shrink-0
                "
            >

                {isImage ? (

                    <img
                        src={
                            URL.createObjectURL(
                                previewFile
                            )
                        }
                        alt={
                            `Page ${index + 1}`
                        }
                        className="
                            w-full
                            h-full
                            object-cover
                        "
                    />

                ) : (

                    <FileText
                        size={22}
                        className="text-red-400"
                    />

                )}

            </div>


            {/* PAGE INFORMATION */}

            <div className="min-w-0">

                <p
                    className="
                        text-white
                        text-sm
                        font-semibold
                    "
                >
                    Page {index + 1}
                </p>


                <p
                    className="
                        text-slate-500
                        text-xs
                        truncate
                        max-w-[130px]
                    "
                    title={file.file.name}
                >
                    {file.file.name}
                </p>

            </div>

        </div>

    );

}


export default PageSidebar;