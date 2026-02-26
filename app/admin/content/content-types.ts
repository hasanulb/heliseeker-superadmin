import { z } from "zod";

// Common Schema
export const localizedStringSchema = (label: string) =>
  z.object({
    en: z.string().min(1, `${label} (English) is required`),
    ar: z.string().optional(),
  });

export const localizedStringSchemaOptional = (label: string) =>
  z.object({
    en: z.string().optional(),
    ar: z.string().optional(),
  });

export const imageSchema = z.object({
  url: z.string(),
  alt: z.string(),
});

export const slugSchema = z
  .string()
  .trim()
  .regex(/^[A-Za-z0-9-]+$/, {
    message: "Slug can only contain letters, numbers, and hyphens",
  })
  .nullable()
  .optional();