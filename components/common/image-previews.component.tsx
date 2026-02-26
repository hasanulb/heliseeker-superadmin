"use client"

import { useState } from "react"

import { LabelComponent } from "@/components/custom-ui"
import { getImageUrl } from "@/lib/utils"
import { ImagePreviewModal } from "@/components/common"
import { ImageType } from "@/lib/types"

export const ImagePreviews = ({ previews, for_, onRemove }: { previews: string[]; for_: ImageType; onRemove?: (idx: number) => void }) => {
    const [modalImage, setModalImage] = useState<string | null>(null);
    const label = for_ === ImageType.Uploaded ? "Uploaded Images" : "Existing Images"
    return (
        <>
            {
                previews.length ? (
                    <>
                        <div className="flex flex-col gap-2 mt-2 border rounded p-4">
                            {for_ !== ImageType.ViewOnly && <LabelComponent text={label} optional />}
                            <div className="flex flex-wrap gap-2">
                                {previews.map((src, idx) => (
                                    <div className="relative p-2 border rounded" key={idx}>
                                        {/* Remove (unselect) button */}
                                        {for_ !== ImageType.ViewOnly && <button
                                            type="button"
                                            className="absolute top-1 right-1 z-10 bg-white dark:bg-gray-800 rounded-full p-1 shadow hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                            onClick={() => onRemove && onRemove(idx)}
                                            aria-label="Remove image"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                        </button>}
                                        {/* Image preview */}
                                        <img
                                            src={for_ === ImageType.Uploaded ? src : `${getImageUrl(src)}`}
                                            alt={`Preview ${idx + 1}`}
                                            className="h-32 w-32 object-cover rounded cursor-pointer transition-transform hover:scale-105"
                                            onClick={() => setModalImage(src)}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Modal for image preview */}
                        <ImagePreviewModal open={!!modalImage} src={modalImage} onClose={() => setModalImage(null)} for_={for_}/>
                    </>
                ) : (
                    for_ !== ImageType.Uploaded &&
                    <div className="text-gray-400 text-sm">No images</div>
                )
            }
        </>
    )
}
