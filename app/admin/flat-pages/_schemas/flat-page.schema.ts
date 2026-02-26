import { z } from "zod"

export const flatPageSchema = z.object({
  title: z.string().min(2),
  slug: z.string().min(2),
  description: z.string().min(2),
})

export type FlatPageFormValues = z.infer<typeof flatPageSchema>
