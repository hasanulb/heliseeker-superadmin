import { boolean, pgEnum, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const centerApprovalStatus = pgEnum("center_approval_status", [
  "pending",
  "active",
  "deactive",
  "rejected",
  "blacklisted",
])

export const centerProfiles = pgTable("center_profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  authUserId: uuid("auth_user_id").notNull(),
  userId: uuid("user_id"),
  centerName: text("center_name").notNull(),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  approvalStatus: centerApprovalStatus("approval_status").notNull().default("pending"),
  approvalNote: text("approval_note"),
  decidedAt: timestamp("decided_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => sql`now()`),
})

export const admins = pgTable("admins", {
  adminId: uuid("admin_id").defaultRandom().primaryKey(),
  authUserId: uuid("auth_user_id"),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash"),
  role: varchar("role", { length: 50 }).notNull().default("super_admin"),
  img: text("img"),
  isActive: boolean("is_active").notNull().default(true),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => sql`now()`),
})

export type Admin = typeof admins.$inferSelect
export type NewAdmin = typeof admins.$inferInsert
export type CenterProfile = typeof centerProfiles.$inferSelect
export type NewCenterProfile = typeof centerProfiles.$inferInsert
