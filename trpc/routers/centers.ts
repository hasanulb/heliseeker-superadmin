import { TRPCError } from "@trpc/server"
import { and, desc, eq, ilike, or, sql } from "drizzle-orm"
import { z } from "zod"

import { client, db } from "@/db"
import { centerProfiles } from "@/drizzle/schema"
import { dispatchCenterDecisionNotification } from "@/lib/notifications/center-approval"
import { createTRPCRouter, publicProcedure } from "@/trpc/init"

const centerStatusSchema = z.enum(["submitted", "pending", "active", "deactive", "rejected", "blacklisted"])
const terminalCenterStatusSchema = z.enum(["active", "deactive", "rejected", "blacklisted"])
const terminalCenterStatuses = ["active", "deactive", "rejected", "blacklisted"] as const

function isTerminalCenterStatus(status: z.infer<typeof centerStatusSchema>): status is z.infer<typeof terminalCenterStatusSchema> {
  return (terminalCenterStatuses as readonly string[]).includes(status)
}

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

    const authUserId = center[0].authUserId

    type CenterSettingsRow = {
      center_name: string | null
      commercial_registration_number: string | null
      short_description: string | null
      location: string | null
      website: string | null
      official_email: string | null
      phone_number: string | null
      address: string | null
      logo_url: string | null
      primary_accent_color: string | null
      language_supported: string | null
      therapist_count: number | null
      center_contact_number: string | null
      manager_name: string | null
      manager_email: string | null
      manager_phone: string | null
      manager_primary: boolean | null
      marketing_rep_name: string | null
      marketing_rep_email: string | null
      marketing_rep_phone: string | null
      marketing_rep_primary: boolean | null
    }

    type DepartmentRow = {
      id: string
      name: string
      description: string | null
      status: string | null
      updated_at: string | null
    }

    type ServiceRow = {
      id: string
      service_name: string
      description: string | null
      status: string | null
      department_id: string | null
      department_name: string | null
    }

    const [settingsRows, departmentRows, serviceRows] = await Promise.all([
      client<CenterSettingsRow[]>`
        select
          center_name,
          commercial_registration_number,
          short_description,
          location,
          website,
          official_email,
          phone_number,
          address,
          logo_url,
          primary_accent_color,
          language_supported,
          therapist_count,
          center_contact_number,
          manager_name,
          manager_email,
          manager_phone,
          manager_primary,
          marketing_rep_name,
          marketing_rep_email,
          marketing_rep_phone,
          marketing_rep_primary
        from center_settings
        where auth_user_id = ${authUserId}
        limit 1
      `,
      client<DepartmentRow[]>`
        select id, name, description, status, updated_at
        from departments
        where auth_user_id = ${authUserId}
        order by name asc
      `,
      client<ServiceRow[]>`
        select
          s.id,
          s.service_name,
          s.description,
          s.status,
          s.department_id,
          d.name as department_name
        from services s
        left join departments d on d.id = s.department_id
        where s.auth_user_id = ${authUserId}
        order by s.service_name asc
      `,
    ])

    const settings = settingsRows[0] ?? null
    const languageSupported = settings?.language_supported ?? ""
    const languages = languageSupported
      ? languageSupported
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean)
      : []

    const onboarding = {
      basicInfo: {
        centerName: settings?.center_name ?? null,
        shortDescription: settings?.short_description ?? null,
        location: settings?.location ?? null,
        commercialRegistrationNumber: settings?.commercial_registration_number ?? null,
        website: settings?.website ?? null,
        officialEmail: settings?.official_email ?? null,
        phoneNumber: settings?.phone_number ?? null,
        address: settings?.address ?? null,
      },
      operations: {
        languageSupported: languages,
        therapistCount: settings?.therapist_count ?? null,
        centerContactNumber: settings?.center_contact_number ?? null,
        managerName: settings?.manager_name ?? null,
        managerEmail: settings?.manager_email ?? null,
        managerPhone: settings?.manager_phone ?? null,
        managerPrimary: settings?.manager_primary ?? null,
        marketingRepName: settings?.marketing_rep_name ?? null,
        marketingRepEmail: settings?.marketing_rep_email ?? null,
        marketingRepPhone: settings?.marketing_rep_phone ?? null,
        marketingRepPrimary: settings?.marketing_rep_primary ?? null,
      },
      customize: {
        logoUrl: settings?.logo_url ?? null,
        primaryAccentColor: settings?.primary_accent_color ?? null,
      },
      departments: departmentRows.map((department) => ({
        id: department.id,
        name: department.name,
        description: department.description,
        status: department.status,
        updatedAt: department.updated_at,
      })),
      services: serviceRows.map((service) => ({
        id: service.id,
        serviceName: service.service_name,
        description: service.description,
        status: service.status,
        departmentId: service.department_id,
        departmentName: service.department_name,
      })),
    }

    return { data: { ...center[0], onboarding } }
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
        approvalStatus: "submitted",
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
          approvalStatus: "submitted",
          decidedAt: null,
          approvalNote: null,
        })
        .onConflictDoUpdate({
          target: centerProfiles.authUserId,
          set: {
            centerName: input.centerName,
            contactEmail: input.contactEmail,
            contactPhone: input.contactPhone,
            approvalStatus: "submitted",
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

    const isTerminalStatus = isTerminalCenterStatus(input.status)

    if (isTerminalStatus) {
      updateValues.decidedAt = new Date()
    } else {
      updateValues.decidedAt = null
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

    if (isTerminalStatus) {
      const notificationResult = await dispatchCenterDecisionNotification({
        centerId: updated.id,
        authUserId: updated.authUserId,
        centerName: updated.centerName,
        contactEmail: updated.contactEmail,
        status: input.status,
        approvalNote: updated.approvalNote,
        decidedAt: updated.decidedAt,
      })

      if (!notificationResult.dispatched) {
        console.warn(
          `[centers.updateStatus] notification dispatch failed for ${updated.id}: ${notificationResult.reason ?? "unknown reason"}`,
        )
      }
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
