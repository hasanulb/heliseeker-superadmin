import { TRPCError } from "@trpc/server"
import { and, desc, eq, ilike, or, sql } from "drizzle-orm"
import { z } from "zod"

import { db } from "@/db"
import { centerProfiles } from "@/drizzle/schema"
import { createTRPCRouter, publicProcedure } from "@/trpc/init"

const centerStatusSchema = z.enum(["pending", "active", "deactive", "rejected", "blacklisted"])

const listCentersSchema = z.object({
  status: centerStatusSchema.optional(),
  q: z.string().trim().min(1).optional(),
})

const createCenterSchema = z.object({
  authUserId: z.string().uuid(),
  centerName: z.string().min(2),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().min(4).optional(),
})

const requestOnboardingSchema = z.object({
  centerName: z.string().min(2),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().min(4).optional(),
})

const updateCenterStatusSchema = z.object({
  id: z.string().uuid(),
  status: centerStatusSchema,
  approvalNote: z.string().trim().min(1).optional(),
})

const updateCenterSchema = z.object({
  id: z.string().uuid(),
  centerName: z.string().min(2).optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().min(4).optional(),
  approvalNote: z.string().trim().min(1).optional(),
})

export const centersRouter = createTRPCRouter({
  list: publicProcedure.input(listCentersSchema.optional()).query(async ({ input }) => {
    const filters = []

    if (input?.status) filters.push(eq(centerProfiles.approvalStatus, input.status))
    if (input?.q) {
      const term = `%${input.q.toLowerCase()}%`
      filters.push(
        or(
          ilike(centerProfiles.centerName, term),
          ilike(centerProfiles.contactEmail, term),
          ilike(centerProfiles.contactPhone, term),
        ),
      )
    }

    const data = await db
      .select()
      .from(centerProfiles)
      .where(filters.length ? and(...filters) : undefined)
      .orderBy(desc(centerProfiles.createdAt))

    return { data }
  }),

  byId: publicProcedure.input(z.object({ id: z.string().uuid() })).query(async ({ input }) => {
    const center = await db.select().from(centerProfiles).where(eq(centerProfiles.id, input.id)).limit(1)
    if (center.length === 0) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Center not found" })
    }
    return { data: center[0] }
  }),

  myProfile: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.user?.id) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "Not authenticated" })
    }

    const center = await db
      .select()
      .from(centerProfiles)
      .where(eq(centerProfiles.authUserId, ctx.user.id))
      .limit(1)

    if (center.length === 0) {
      return { data: null }
    }

    return { data: center[0] }
  }),

  create: publicProcedure.input(createCenterSchema).mutation(async ({ input }) => {
    const [created] = await db
      .insert(centerProfiles)
      .values({
        authUserId: input.authUserId,
        centerName: input.centerName,
        contactEmail: input.contactEmail,
        contactPhone: input.contactPhone,
        approvalStatus: "pending",
      })
      .returning()

    return { data: created }
  }),

  requestOnboarding: publicProcedure
    .input(requestOnboardingSchema)
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user?.id) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Not authenticated" })
      }

      const [created] = await db
        .insert(centerProfiles)
        .values({
          authUserId: ctx.user.id,
          centerName: input.centerName,
          contactEmail: input.contactEmail,
          contactPhone: input.contactPhone,
          approvalStatus: "pending",
          decidedAt: null,
          approvalNote: null,
        })
        .onConflictDoUpdate({
          target: centerProfiles.authUserId,
          set: {
            centerName: input.centerName,
            contactEmail: input.contactEmail,
            contactPhone: input.contactPhone,
            approvalStatus: "pending",
            decidedAt: null,
            approvalNote: null,
          },
        })
        .returning()

      return { data: created }
    }),

  updateStatus: publicProcedure.input(updateCenterStatusSchema).mutation(async ({ input }) => {
    const updateValues: Record<string, unknown> = {
      approvalStatus: input.status,
      updatedAt: new Date(),
    }

    if (input.approvalNote !== undefined) {
      updateValues.approvalNote = input.approvalNote
    }

    const [updated] = await db
      .update(centerProfiles)
      .set(updateValues)
      .where(eq(centerProfiles.id, input.id))
      .returning()

    if (!updated) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Center not found" })
    }

    return { data: updated }
  }),

  update: publicProcedure.input(updateCenterSchema).mutation(async ({ input }) => {
    const updateValues: Partial<typeof centerProfiles.$inferInsert> = {
      updatedAt: new Date(),
    }

    if (input.centerName !== undefined) updateValues.centerName = input.centerName
    if (input.contactEmail !== undefined) updateValues.contactEmail = input.contactEmail
    if (input.contactPhone !== undefined) updateValues.contactPhone = input.contactPhone
    if (input.approvalNote !== undefined) updateValues.approvalNote = input.approvalNote

    if (Object.keys(updateValues).length === 0) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "No updates provided" })
    }

    const [updated] = await db
      .update(centerProfiles)
      .set(updateValues)
      .where(eq(centerProfiles.id, input.id))
      .returning()

    if (!updated) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Center not found" })
    }

    return { data: updated }
  }),

  remove: publicProcedure.input(z.object({ id: z.string().uuid() })).mutation(async ({ input }) => {
    const [deleted] = await db.delete(centerProfiles).where(eq(centerProfiles.id, input.id)).returning()
    if (!deleted) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Center not found" })
    }
    return { data: deleted }
  }),
})
