const LeadSourceValues = ["cost estimation", "contact us", "footer"] as const;

export const LeadSourceEnum = {
  COST_ESTIMATION: "cost estimation",
  CONTACT_US: "contact us",
  FOOTER: "footer",
} as const;

export type LeadSourceType = (typeof LeadSourceValues)[number];

export interface LeadType {
  lead_id: string;
  first_name: string;
  last_name: string;
  email: string;
  mobile: string;
  message: string;
  source: LeadSourceType;
  created_at: string;
}