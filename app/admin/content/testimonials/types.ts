import { z } from "zod";
import { LocalizedStringType } from "@/lib/types";
import { localizedStringSchema } from "../content-types";

export interface TestimonialType {
    testimonial_id: string;
    img_urls: string[];
    name: LocalizedStringType;
    role: LocalizedStringType;
    quote: LocalizedStringType;
    created_at: string;
    updated_at: string;
}

export const testimonialSchema = z.object({
    img_urls: z.array(z.any()).optional(),
    name: localizedStringSchema("Name"),
    role: localizedStringSchema("Role"),
    quote: localizedStringSchema("Quote"),
});

export type TestimonialFormInputType = z.infer<typeof testimonialSchema>;