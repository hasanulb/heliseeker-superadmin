"use client";

import React, { useRef, useState } from "react";
import { ImagePreviews } from "../image-previews.component";
import { ImageType } from "@/lib/types";
import { UseFormReturn, FieldPath, FieldValues } from "react-hook-form";

interface CustomImageInputProps<TFormValues extends FieldValues> {
    min?: number;
    max?: number;
    onChange?: (files: File[]) => void;
    form: UseFormReturn<TFormValues>;
    name: FieldPath<TFormValues>;
}

export const CustomImageInput = <TFormValues extends FieldValues>({
    min = 1,
    max = 5,
    onChange,
    form,
    name,
}: CustomImageInputProps<TFormValues>) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [files, setFiles] = useState<File[]>([]);

    // Get form error for this field
    const formError = form.formState.errors[name]?.message as string;

    // Create preview URLs
    const previews = files.map((file) => URL.createObjectURL(file));

    const handleFiles = (fileList: FileList | null) => {
        if (!fileList) return;
        let selected = Array.from(fileList);
        let newFiles = [...files, ...selected];
        // Remove duplicates by name/size/type
        newFiles = newFiles.filter(
            (file, idx, arr) =>
                arr.findIndex((f) => f.name === file.name && f.size === file.size && f.type === file.type) === idx
        );
        if (newFiles.length > max) {
            form.setError(name, { message: `You can only select up to ${max} images.` });
            newFiles = newFiles.slice(0, max);
        } else if (newFiles.length < min) {
            form.setError(name, { message: `Select at least ${min} image${min > 1 ? "s" : ""}.` });
        } else {
            form.clearErrors(name);
        }
        setFiles(newFiles);
        if (onChange) onChange(newFiles);
    };

    const handleRemove = (idx: number) => {
        let newFiles = files.filter((_, i) => i !== idx);
        setFiles(newFiles);
        if (onChange) onChange(newFiles);
        if (newFiles.length > max) {
            form.setError(name, { message: `You can only select up to ${max} images.` });
            newFiles = newFiles.slice(0, max);
        } else if (newFiles.length < min) {
            form.setError(name, { message: `Select at least ${min} image${min > 1 ? "s" : ""}.` });
        } else {
            form.clearErrors(name);
        }
    };

    const handleClick = () => {
        if (files.length >= max) {
            form.setError(name, { message: `You can only select up to ${max} images.` });
            return;
        }
        inputRef.current?.click();
    };

    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
                <button
                    type="button"
                    className={`px-4 py-2 border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition ${files.length >= max ? "opacity-50 cursor-not-allowed" : ""}`}
                    onClick={handleClick}
                    disabled={files.length >= max}
                >
                    Choose Files
                </button>
                <span className="text-gray-400 text-sm">
                    {files.length === 0 ? "No file chosen" : `${files.length} file${files.length > 1 ? "s" : ""}`}
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
            {min > 0 && (
                <div className="text-gray-500 text-xs mt-1">
                    {`Select at least ${min} image${min > 1 ? "s" : ""}, up to ${max}.`}
                </div>
            )}
            <ImagePreviews
                previews={previews}
                for_={ImageType.Uploaded}
                onRemove={handleRemove}
            />
        </div>
    );
};