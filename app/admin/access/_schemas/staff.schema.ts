import { z } from "zod"

export const createStaffSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  role: z.string().min(1),
})

export type CreateStaffFormValues = z.infer<typeof createStaffSchema>
