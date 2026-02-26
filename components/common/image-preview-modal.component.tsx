import { ReactNode } from "react";
import { getImageUrl } from "@/lib/utils";
import { ImageType } from "@/lib/types";

interface ImagePreviewModalProps {
  open: boolean;
  src: string | null;
  onClose: () => void;
  children?: ReactNode;
  for_?: ImageType;
}

export const ImagePreviewModal = ({ open, src, onClose, children, for_ = ImageType.Uploaded }: ImagePreviewModalProps) => {
  if (!open || !src) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={onClose}>
      <div className="relative" onClick={e => e.stopPropagation()}>
        <button
          className="absolute top-2 right-2 bg-white dark:bg-gray-800 rounded-full p-1 shadow hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          onClick={onClose}
          aria-label="Close image preview"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-900 dark:text-gray-100" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
        <img src={for_ === ImageType.Uploaded ? src : `${getImageUrl(src)}`} alt="Preview" className="max-h-[80vh] max-w-[90vw] rounded shadow-lg bg-white dark:bg-gray-900" />
        {children}
      </div>
    </div>
  );
}
