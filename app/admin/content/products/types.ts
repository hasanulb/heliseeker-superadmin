import { z } from "zod";
import { LocalizedStringType } from "@/lib/types";
import { localizedStringSchema, slugSchema } from "../content-types";

export type KeyFeatureType = {
    en: string[];
    ar: string[];
};

export type InstallationStepsType = {
    en: string[];
    ar: string[];
};

export type MaterialAndDimensionType = {
    en: {
        items: {
            title: string;
            value: string;
        }[];
    };
    ar: {
        items: {
            title: string;
            value: string;
        }[];
    };
};

export type ProductType = {
    product_id: string;
    img_urls: string[];
    name: LocalizedStringType;
    intro: LocalizedStringType;
    description: LocalizedStringType;
    tags: string[] | null;
    created_at: string;
    updated_at: string;
    key_features: KeyFeatureType;
    installation_steps: InstallationStepsType;
    materials_and_dimensions?: MaterialAndDimensionType;
    slug: string | null;
};

const keyFeatureSchema = z.object({
    en: z.array(z.string().trim()).optional(),
    ar: z.array(z.string().trim()).optional(),
});

const installationStepsSchema = z
    .object({
        en: z.array(z.string().trim()).optional(),
        ar: z.array(z.string().trim()).optional(),
    })
    .optional()
    .nullable();

const nonEmptyString = (label: string) =>
    z.string().trim().min(1, { message: `${label} is required` });

const itemsArraySchema = (langLabel: string) =>
    z.array(
        z.object({
            title: nonEmptyString(`Title (${langLabel})`),
            value: nonEmptyString(`Value (${langLabel})`)
        })
    );

const materialAndDimensionSchema = z.object({
    en: z.object({
        items: itemsArraySchema("English")
    }),
    ar: z.object({
        items: itemsArraySchema("Arabic")
    })
});

export const productSchema = z.object({
    img_urls: z.array(z.any()).optional(),
    name: localizedStringSchema("Name"),
    intro: localizedStringSchema("Intro"),
    description: localizedStringSchema("Description"),
    tags: z.array(z.string()).optional(),
    key_features: keyFeatureSchema.nullable().optional(),
    installation_steps: installationStepsSchema.nullable().optional(),
    materials_and_dimensions: materialAndDimensionSchema.nullable().optional(),
    slug: slugSchema,
});

export type ProductFormInputType = z.infer<typeof productSchema>; 