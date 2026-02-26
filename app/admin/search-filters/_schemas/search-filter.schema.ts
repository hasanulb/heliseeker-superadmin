import { z } from "zod"

export const createSearchFilterSchema = z.object({
  kind: z.enum(["department", "therapy", "service", "ageRange", "location", "language"]),
  name: z.string().min(2),
  description: z.string().optional(),
  parentId: z.string().optional(),
})

export type CreateSearchFilterFormValues = z.infer<typeof createSearchFilterSchema>
