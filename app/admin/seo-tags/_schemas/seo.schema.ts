import { z } from "zod"

export const seoSchema = z.object({
  metaTitle: z.string().min(2),
  metaDescription: z.string().min(2),
})

export const tagSchema = z.object({
  tagName: z.string().min(2),
  tagType: z.string().min(2),
  keyword: z.string().min(2),
  question: z.string().min(2),
  linkedCategory: z.string().min(2),
})

export type SeoFormValues = z.infer<typeof seoSchema>
export type TagFormValues = z.infer<typeof tagSchema>
