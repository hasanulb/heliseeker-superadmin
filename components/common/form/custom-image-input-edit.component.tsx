"use client";

import React, { useRef, useState } from "react";
import { FieldPath, FieldValues, UseFormReturn } from "react-hook-form";

import { ImagePreviews } from "../image-previews.component";
import { ImageType } from "@/lib/types";

interface CustomImageInputEditProps<TFormValues extends FieldValues> {
  form: UseFormReturn<TFormValues>;
  name: FieldPath<TFormValues>;
  existingImages: string[]; // URLs or keys for already uploaded images
  onRemoveExisting: (idx: number) => void;
  min?: number;
  max?: number;
  onChange?: (files: File[]) => void;
}

export const CustomImageInputEdit = <TFormValues extends FieldValues>({
  form,
  name,
  existingImages = [],
  onRemoveExisting,
  min = 1,
  max = 5,
  onChange,
}: CustomImageInputEditProps<TFormValues>) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);

  // Preview URLs for new files
  const previews = files.map((file) => URL.createObjectURL(file));
  const totalImages = existingImages.length + files.length;

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    let selected = Array.from(fileList);
    let newFiles = [...files, ...selected];
    // Remove duplicates by name/size/type
    newFiles = newFiles.filter(
      (file, idx, arr) =>
        arr.findIndex((f) => f.name === file.name && f.size === file.size && f.type === file.type) === idx
    );
    if (newFiles.length + existingImages.length > max) {
      form.setError(name, {
        type: "manual",
        message: `You can only select up to ${max} images in total.`,
      });
      newFiles = newFiles.slice(0, max - existingImages.length);
    } else if (newFiles.length + existingImages.length < min) {
      form.setError(name, {
        type: "manual",
        message: `Please upload at least ${min} image${min > 1 ? "s" : ""}.`,
      });
    } else {
      form.clearErrors(name);
    }
    setFiles(newFiles);
    if (onChange) onChange(newFiles);
  };

  const handleRemove = (idx: number) => {
    const newFiles = files.filter((_, i) => i !== idx);
    setFiles(newFiles);
    if (onChange) onChange(newFiles);

    if (newFiles.length + existingImages.length < min) {
      form.setError(name, {
        type: "manual",
        message: `Please upload at least ${min} image${min > 1 ? "s" : ""}.`,
      });
    } else {
      form.clearErrors(name);
    }
  };

  const handleClick = () => {
    if (totalImages >= max) {
      form.setError(name, {
        type: "manual",
        message: `You can only select up to ${max} images.`,
      });
      return;
    }
    inputRef.current?.click();
  };

  // Validate min on every render (for display only, Zod should still validate in parent)
  const showMinError = totalImages < min;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <button
          type="button"
          className={`px-4 py-2 border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition ${totalImages >= max ? "opacity-50 cursor-not-allowed" : ""}`}
          onClick={handleClick}
          disabled={totalImages >= max}
        >
          Choose Files
        </button>
        <span className="text-gray-400 text-sm">
          {totalImages === 0 ? "No file chosen" : `${totalImages} file${totalImages > 1 ? "s" : ""}`}
        </span>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      {showMinError && (
        <div className="text-red-500 text-xs mt-1">
          {`Select at least ${min} image${min > 1 ? "s" : ""}, up to ${max}.`}
        </div>
      )}
      {/* Existing Images */}
      <ImagePreviews
        previews={existingImages}
        for_={ImageType.Existing}
        onRemove={onRemoveExisting}
      />
      {/* New Images */}
      <ImagePreviews
        previews={previews}
        for_={ImageType.Uploaded}
        onRemove={handleRemove}
      />
    </div>
  );
};
