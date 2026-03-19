import { TRPCError } from "@trpc/server"
import { desc, eq, ilike, or } from "drizzle-orm"
import { z } from "zod"

import { db } from "@/db"
import { leads } from "@/drizzle/schema"
import { createTRPCRouter, publicProcedure } from "@/trpc/init"
import type { TRPCContext } from "@/trpc/context"

async function requireAdmin(ctx: TRPCContext) {
  const authUserId = ctx.user?.id
  if (!authUserId) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Not authenticated" })
  }

  const { data, error } = await ctx.supabase
    .from("admins")
    .select("admin_id")
    .eq("auth_user_id", authUserId)
    .maybeSingle()

  if (error || !data?.admin_id) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" })
  }
}

const listLeadsSchema = z
  .object({
    q: z.string().trim().min(1).optional(),
    limit: z.number().int().min(1).max(200).optional(),
  })
  .optional()

export const leadsRouter = createTRPCRouter({
  list: publicProcedure.input(listLeadsSchema).query(async ({ input, ctx }) => {
    await requireAdmin(ctx)

    const limit = input?.limit ?? 50
    const term = input?.q ? `%${input.q.toLowerCase()}%` : null

    const where = term
      ? or(
          ilike(leads.firstName, term),
          ilike(leads.lastName, term),
          ilike(leads.email, term),
          ilike(leads.phone, term),
          ilike(leads.message, term),
        )
      : undefined

    const data = await db.select().from(leads).where(where).orderBy(desc(leads.createdAt)).limit(limit)
    return { data }
  }),

  byId: publicProcedure.input(z.object({ id: z.string().uuid() })).query(async ({ input, ctx }) => {
    await requireAdmin(ctx)

    const rows = await db.select().from(leads).where(eq(leads.id, input.id)).limit(1)
    if (rows.length === 0) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Enquiry not found" })
    }
    return { data: rows[0] }
  }),
})
