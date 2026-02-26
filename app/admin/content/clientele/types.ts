import { z } from "zod";
import { localizedStringSchemaOptional } from "../content-types";

export type ClientLogoType = {
  client_logo_id: string;
  name?: string;
  img_url: string;
  group_id: string;
  order_index: number;
  created_at: string;
  updated_at: string;
};

export type ClienteleGroupType = {
  group_id: string;
  group_name: string;
  order_index: number;
  created_at: string;
  updated_at: string;
  client_logos?: ClientLogoType[];
};

export type ClienteleGroupWithLogos = ClienteleGroupType & {
  client_logos: ClientLogoType[];
};

const nonEmptyString = (label: string) =>
  z.string().trim().min(1, { message: `${label} is required` });

export const clientLogoSchema = z.object({
  name: z.string().trim().optional(),
  img_url: z.string().trim().optional(),
  group_id: z.string().min(1, "Group is required"),
  order_index: z.number().min(0).optional(),
});

export const clienteleGroupSchema = z.object({
  group_name: nonEmptyString("Group name"),
  order_index: z.number().min(0).optional(),
});

export type ClientLogoFormInputType = z.infer<typeof clientLogoSchema>;
export type ClienteleGroupFormInputType = z.infer<typeof clienteleGroupSchema>;

export type ReorderRequestType = {
  items: Array<{
    id: string;
    order_index: number;
  }>;
};