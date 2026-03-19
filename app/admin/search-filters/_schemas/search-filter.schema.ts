import { z } from "zod"

export type CreateSearchFilterFormValues = {
  kind: "department" | "therapy" | "service" | "ageRange" | "location" | "language"
  name: string
  description?: string
  parentId?: string
  enabled?: boolean
  fromAge?: number
  toAge?: number
  unit?: "month" | "year"
}

export const createSearchFilterSchema: z.ZodType<CreateSearchFilterFormValues> = z.object({
  kind: z.enum(["department", "therapy", "service", "ageRange", "location", "language"]),
  name: z.string().min(2),
  description: z.string().optional(),
  parentId: z.string().optional(),
  enabled: z.boolean().optional(),
  fromAge: z.number().int().min(0).optional(),
  toAge: z.number().int().min(0).optional(),
  unit: z.enum(["month", "year"]).optional(),
}).superRefine((val, ctx) => {
  if (val.kind !== "ageRange") return

  if (val.fromAge === undefined) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "From age is required", path: ["fromAge"] })
  }
  if (val.toAge === undefined) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "To age is required", path: ["toAge"] })
  }
  if (val.unit === undefined) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Unit is required", path: ["unit"] })
  }
  if (val.fromAge !== undefined && val.toAge !== undefined && val.toAge < val.fromAge) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "To age must be >= from age", path: ["toAge"] })
  }
})
