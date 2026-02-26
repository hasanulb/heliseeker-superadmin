import { z } from "zod"

export const createCenterSchema = z.object({
  authUserId: z.string().uuid("Auth User ID must be a valid UUID"),
  centerName: z.string().min(2),
  contactEmail: z.union([z.string().email(), z.literal("")]).optional(),
  contactPhone: z.union([z.string().min(4), z.literal("")]).optional(),
})

export type CreateCenterFormValues = z.infer<typeof createCenterSchema>
