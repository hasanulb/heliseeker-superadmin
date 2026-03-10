import { z } from "zod"

export const rolePermissionSchema = z.object({
  module: z.string(),
  view: z.boolean(),
  create: z.boolean(),
  edit: z.boolean(),
})

export const createRoleSchema = z.object({
  name: z.string().min(2),
  permissions: z
    .array(rolePermissionSchema)
    .refine((items) => items.some((item) => item.view || item.create || item.edit), {
      message: "Select at least one permission.",
    }),
})

export type CreateRoleFormValues = z.infer<typeof createRoleSchema>
