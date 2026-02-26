import { z } from "zod";
import { LocalizedStringType } from "@/lib/types";
import { localizedStringSchema } from "../content-types";

export interface TeamType {
    team_id: string;
    img_urls: string[];
    name: LocalizedStringType;
    position: LocalizedStringType;
    description: LocalizedStringType;
    order_index?: number;
    created_at: string;
    updated_at: string;
}

export const teamSchema = z.object({
    img_urls: z.array(z.any()).default([]),
    name: localizedStringSchema("Name"),
    position: localizedStringSchema("Position"),
    description: localizedStringSchema("Description"),
});

export type TeamFormInputType = z.infer<typeof teamSchema>;