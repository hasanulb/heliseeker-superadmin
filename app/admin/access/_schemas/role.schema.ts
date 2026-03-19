import { z } from "zod"

export const rolePermissionSchema = z.object({
  module: z.string(),
  view: z.boolean(),
  create: z.boolean(),
  edit: z.boolean(),
  delete: z.boolean().optional(),
})

export const createRoleSchema = z.object({
  name: z.string().min(2),
  permissions: z
    .array(rolePermissionSchema)
    .refine((items) => items.some((item) => item.view || item.create || item.edit || item.delete), {
      message: "Select at least one permission.",
    }),
})

export type CreateRoleFormValues = z.infer<typeof createRoleSchema>
