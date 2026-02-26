import { z } from "zod";
import { localizedStringSchema, localizedStringSchemaOptional, slugSchema } from "../content-types";
import { LocalizedStringType, LocalizedStringTypeOptional } from "@/lib/types";

// Service Type
export type FeatureItem = {
    items: {
        title: string;
        description: string;
    }[]
};

export type ServiceFeatureType = {
    en: FeatureItem;
    ar: FeatureItem;
};

export type ParagraphType = {
    en: {
        title: string;
        description: string;
    };
    ar: {
        title: string;
        description: string;
    };
};

export type ServiceType = {
    service_id: string;
    sort_index: number;
    img_urls: string[];
    title: LocalizedStringType;
    intro: LocalizedStringType;
    image_description: LocalizedStringTypeOptional;
    paragraph_one: ParagraphType;
    paragraph_two: ParagraphType;
    service_features: ServiceFeatureType;
    slug: string | null;
    created_at: string;
    updated_at: string;
};

// Service Schema
const nonEmptyString = (label: string) =>
    z.string().trim().min(1, { message: `${label} is required` });

const itemsArraySchema = (langLabel: string) =>
    z.array(
        z.object({
            title: nonEmptyString(`Title (${langLabel})`),
            description: nonEmptyString(`Description (${langLabel})`)
        })
    );

export const serviceFeaturesSchema = z.object({
    en: z.object({
        items: itemsArraySchema("English").min(3, { message: `At least 3 features are required for English` })
    }),
    ar: z.object({
        items: itemsArraySchema("Arabic")
    })
});

export const paragraphSchema = z.object({
    en: z.object({
        title: nonEmptyString(`Title (English)`),
        description: nonEmptyString(`Description (English)`)
    }),
    ar: z.object({
        title: z.string().optional(),
        description: z.string().optional()
    }).optional()
});

export const serviceSchema = z.object({
    img_urls: z.array(z.any()).optional(),
    title: localizedStringSchema('Title'),
    intro: localizedStringSchema('Intro'),
    image_description: localizedStringSchemaOptional('Image Description'),
    paragraph_one: paragraphSchema,
    paragraph_two: paragraphSchema,
    service_features: serviceFeaturesSchema,
    slug: slugSchema,

});

export type ServiceFormInputType = z.infer<typeof serviceSchema>;