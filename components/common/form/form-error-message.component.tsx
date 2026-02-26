"use client";
import React, { useEffect, useState } from "react";
import { FieldError, FieldErrors, UseFormReturn } from "react-hook-form";

interface FormErrorMessageProps {
  name: string; // e.g. "tags", "materials_and_dimensions.en.items.0.value"
  form: UseFormReturn<any>;
  className?: string;
}

// Helper to get nested error object
function getNestedError(errors: FieldErrors, name: string): any {
  return name.split('.').reduce<any>((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), errors);
}

// Helper to extract error message
function extractErrorMessage(error: any): string | null {
  if (!error) return null;
  if (typeof error.message === 'string') return error.message;
  // Sometimes error is a nested object or array
  if (Array.isArray(error)) {
    for (const item of error) {
      const msg = extractErrorMessage(item);
      if (msg) return msg;
    }
  } else if (typeof error === 'object') {
    for (const key in error) {
      if (Object.prototype.hasOwnProperty.call(error, key)) {
        const msg = extractErrorMessage(error[key]);
        if (msg) return msg;
      }
    }
  }
  return null;
}

export const FormErrorMessage: React.FC<FormErrorMessageProps> = ({ name, form, className = "" }) => {
  const [shake, setShake] = useState(false);
  const errorObj = getNestedError(form.formState.errors, name);
  const errorMsg = extractErrorMessage(errorObj);
  const submitCount = form.formState.submitCount;

  useEffect(() => {
    if (errorMsg && submitCount > 0) {
      setShake(true);
      const timeout = setTimeout(() => setShake(false), 400);
      return () => clearTimeout(timeout);
    } else {
      setShake(false);
    }
  }, [errorMsg, submitCount]);

  if (!errorMsg) return null;

  return (
    <div
      className={`text-red-500 text-xs mt-1 ${shake ? "animate-shake" : ""} ${className}`}
      aria-live="polite"
      data-error-field={name}
    >
      {errorMsg}
    </div>
  );
};
