import { z } from "zod";
import { localizedStringSchema, slugSchema } from "../content-types";
import { LocalizedStringType } from "@/lib/types";

export interface ProjectType {
    project_id: string;
    img_urls: string[];
    title: LocalizedStringType;
    location: string;
    description: LocalizedStringType;
    type: LocalizedStringType;
    area: string | null;
    slug: string | null;
    created_at: string;
    updated_at: string;
}

export const projectSchema = z.object({
    img_urls: z.array(z.any()).optional(),
    title: localizedStringSchema("Title"),
    location: z
        .string({ required_error: "Location is required" })
        .min(1, "Location is required"),
    description: localizedStringSchema("Description"),
    type: localizedStringSchema("Type"),
    area: z
        .string({ required_error: "Area is required" })
        .min(1, "Area is required"),
    slug: slugSchema,
});


export type ProjectFormInput = z.infer<typeof projectSchema>; 