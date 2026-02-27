import { pgTable, foreignKey, unique, pgPolicy, uuid, text, timestamp, boolean, index, date, uniqueIndex, check, integer, jsonb, varchar, primaryKey, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const centerApprovalStatus = pgEnum("center_approval_status", ['pending', 'active', 'deactive', 'rejected', 'blacklisted'])
export const departmentStatus = pgEnum("department_status", ['active', 'inactive'])
export const referralRequestStatus = pgEnum("referral_request_status", ['pending', 'approved', 'rejected'])
export const userType = pgEnum("user_type", ['customer', 'center', 'admin'])


export const users = pgTable("users", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	authUserId: uuid("auth_user_id"),
	email: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	userType: userType("user_type").default('customer').notNull(),
	isVerified: boolean("is_verified").default(false).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.authUserId],
			foreignColumns: [table.id],
			name: "users_auth_user_id_fkey"
		}).onDelete("cascade"),
	unique("users_auth_user_id_key").on(table.authUserId),
	pgPolicy("Public can view center users", { as: "permissive", for: "select", to: ["anon", "authenticated"], using: sql`(user_type = 'center'::user_type)` }),
]);

export const termsAndConditions = pgTable("terms_and_conditions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	termsContent: text("terms_content").notNull(),
	lastRevised: date("last_revised"),
	isVisible: boolean("is_visible").default(true).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	authUserId: uuid("auth_user_id"),
}, (table) => [
	index("idx_terms_and_conditions_auth_user_id").using("btree", table.authUserId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.authUserId],
			foreignColumns: [users.id],
			name: "terms_and_conditions_auth_user_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("terms_and_conditions_manage_own", { as: "permissive", for: "all", to: ["authenticated"], using: sql`(auth.uid() = auth_user_id)`, withCheck: sql`(auth.uid() = auth_user_id)`  }),
]);

export const services = pgTable("services", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	serviceName: text("service_name").notNull(),
	description: text(),
	departmentId: uuid("department_id").notNull(),
	ageGroupId: uuid("age_group_id"),
	expiryDate: date("expiry_date"),
	status: text().default('active').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	authUserId: uuid("auth_user_id"),
}, (table) => [
	index("idx_services_auth_user_id").using("btree", table.authUserId.asc().nullsLast().op("uuid_ops")),
	uniqueIndex("services_auth_user_id_service_name_key").using("btree", table.authUserId.asc().nullsLast().op("text_ops"), table.serviceName.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.ageGroupId],
			foreignColumns: [ageGroups.id],
			name: "fk_age_group"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.departmentId],
			foreignColumns: [departments.id],
			name: "fk_department"
		}).onDelete("restrict"),
	foreignKey({
			columns: [table.authUserId],
			foreignColumns: [users.id],
			name: "services_auth_user_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("Public can view active services", { as: "permissive", for: "select", to: ["anon", "authenticated"], using: sql`(lower(status) = 'active'::text)` }),
	pgPolicy("services_manage_own", { as: "permissive", for: "all", to: ["authenticated"] }),
	check("services_status_check", sql`status = ANY (ARRAY['active'::text, 'inactive'::text])`),
]);

export const specialists = pgTable("specialists", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	email: text().notNull(),
	phoneNumber: text("phone_number").notNull(),
	gender: text().notNull(),
	dob: date(),
	yearsOfExperience: integer("years_of_experience"),
	departmentId: uuid("department_id"),
	designation: text().notNull(),
	medicalLicenseNumber: text("medical_license_number").notNull(),
	licenseIssuedBy: text("license_issued_by"),
	profileImage: text("profile_image"),
	bio: text(),
	featureOnWebsite: boolean("feature_on_website").default(false),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	department: text(),
	createdBy: uuid("created_by"),
}, (table) => [
	index("idx_specialists_created_by").using("btree", table.createdBy.asc().nullsLast().op("uuid_ops")),
	uniqueIndex("specialists_created_by_email_key").using("btree", table.createdBy.asc().nullsLast().op("text_ops"), table.email.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "specialists_created_by_fkey"
		}).onDelete("cascade"),
	pgPolicy("Authenticated users can manage specialists", { as: "permissive", for: "all", to: ["public"], using: sql`(auth.role() = 'authenticated'::text)` }),
	pgPolicy("specialists_manage_own", { as: "permissive", for: "all", to: ["authenticated"] }),
	check("specialists_gender_check", sql`gender = ANY (ARRAY['male'::text, 'female'::text, 'other'::text])`),
	check("specialists_years_of_experience_check", sql`years_of_experience >= 0`),
]);

export const specialistLanguages = pgTable("specialist_languages", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	specialistId: uuid("specialist_id"),
	language: text().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.specialistId],
			foreignColumns: [specialists.id],
			name: "specialist_languages_specialist_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("specialist_languages_manage_own", { as: "permissive", for: "all", to: ["authenticated"], using: sql`(EXISTS ( SELECT 1
   FROM specialists s
  WHERE ((s.id = specialist_languages.specialist_id) AND (s.created_by = auth.uid()))))`, withCheck: sql`(EXISTS ( SELECT 1
   FROM specialists s
  WHERE ((s.id = specialist_languages.specialist_id) AND (s.created_by = auth.uid()))))`  }),
]);

export const specializations = pgTable("specializations", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	authUserId: uuid("auth_user_id"),
}, (table) => [
	index("idx_specializations_auth_user_id").using("btree", table.authUserId.asc().nullsLast().op("uuid_ops")),
	uniqueIndex("specializations_auth_user_id_name_key").using("btree", table.authUserId.asc().nullsLast().op("text_ops"), table.name.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.authUserId],
			foreignColumns: [users.id],
			name: "specializations_auth_user_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("specializations_manage_own", { as: "permissive", for: "all", to: ["authenticated"], using: sql`(auth.uid() = auth_user_id)`, withCheck: sql`(auth.uid() = auth_user_id)`  }),
]);

export const centerSettings = pgTable("center_settings", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	authUserId: uuid("auth_user_id").notNull(),
	centerName: text("center_name"),
	commercialRegistrationNumber: text("commercial_registration_number"),
	shortDescription: text("short_description"),
	location: text(),
	website: text(),
	officialEmail: text("official_email"),
	phoneNumber: text("phone_number"),
	address: text(),
	logoUrl: text("logo_url"),
	primaryAccentColor: text("primary_accent_color").default('#ABBA30').notNull(),
	languageSupported: text("language_supported"),
	therapistCount: integer("therapist_count").default(0).notNull(),
	centerContactNumber: text("center_contact_number"),
	managerName: text("manager_name"),
	managerEmail: text("manager_email"),
	managerPhone: text("manager_phone"),
	managerPrimary: boolean("manager_primary").default(true).notNull(),
	marketingRepName: text("marketing_rep_name"),
	marketingRepEmail: text("marketing_rep_email"),
	marketingRepPhone: text("marketing_rep_phone"),
	marketingRepPrimary: boolean("marketing_rep_primary").default(false).notNull(),
	workingHours: jsonb("working_hours"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("center_settings_auth_user_id_key").on(table.authUserId),
	pgPolicy("Authenticated users can manage own center settings", { as: "permissive", for: "all", to: ["authenticated"], using: sql`(auth.uid() = auth_user_id)`, withCheck: sql`(auth.uid() = auth_user_id)`  }),
	pgPolicy("Public can view center settings", { as: "permissive", for: "select", to: ["anon", "authenticated"] }),
]);

export const specialistEducations = pgTable("specialist_educations", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	specialistId: uuid("specialist_id"),
	degree: text().notNull(),
	university: text().notNull(),
	fromDate: date("from_date").notNull(),
	toDate: date("to_date"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.specialistId],
			foreignColumns: [specialists.id],
			name: "specialist_education_specialist_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("specialist_educations_manage_own", { as: "permissive", for: "all", to: ["authenticated"], using: sql`(EXISTS ( SELECT 1
   FROM specialists s
  WHERE ((s.id = specialist_educations.specialist_id) AND (s.created_by = auth.uid()))))`, withCheck: sql`(EXISTS ( SELECT 1
   FROM specialists s
  WHERE ((s.id = specialist_educations.specialist_id) AND (s.created_by = auth.uid()))))`  }),
]);

export const admins = pgTable("admins", {
	adminId: uuid("admin_id").defaultRandom().primaryKey().notNull(),
	authUserId: uuid("auth_user_id"),
	name: varchar({ length: 255 }).notNull(),
	email: varchar({ length: 255 }).notNull(),
	role: varchar({ length: 50 }).default('super_admin').notNull(),
	img: text(),
	isActive: boolean("is_active").default(true).notNull(),
	lastLoginAt: timestamp("last_login_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("admins_email_unique").on(table.email),
]);

export const departments = pgTable("departments", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	status: departmentStatus().default('active').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	authUserId: uuid("auth_user_id"),
}, (table) => [
	uniqueIndex("departments_auth_user_id_name_key").using("btree", table.authUserId.asc().nullsLast().op("text_ops"), table.name.asc().nullsLast().op("text_ops")),
	index("idx_departments_auth_user_id").using("btree", table.authUserId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.authUserId],
			foreignColumns: [users.id],
			name: "departments_auth_user_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("departments_manage_own", { as: "permissive", for: "all", to: ["authenticated"], using: sql`(auth.uid() = auth_user_id)`, withCheck: sql`(auth.uid() = auth_user_id)`  }),
]);

export const pricingSettings = pgTable("pricing_settings", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	pricingContent: text("pricing_content").notNull(),
	expiryDate: date("expiry_date"),
	isVisible: boolean("is_visible").default(true).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	authUserId: uuid("auth_user_id"),
}, (table) => [
	index("idx_pricing_settings_auth_user_id").using("btree", table.authUserId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.authUserId],
			foreignColumns: [users.id],
			name: "pricing_settings_auth_user_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("pricing_settings_manage_own", { as: "permissive", for: "all", to: ["authenticated"], using: sql`(auth.uid() = auth_user_id)`, withCheck: sql`(auth.uid() = auth_user_id)`  }),
]);

export const customerProfiles = pgTable("customer_profiles", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	authUserId: uuid("auth_user_id").notNull(),
	userId: uuid("user_id"),
	guardianName: text("guardian_name"),
	countryOfResidency: text("country_of_residency"),
	phoneNumber: text("phone_number"),
	nationality: text(),
	childName: text("child_name"),
	childDob: date("child_dob"),
	primaryLanguage: text("primary_language"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.authUserId],
			foreignColumns: [users.id],
			name: "customer_profiles_auth_user_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "customer_profiles_user_id_fkey"
		}).onDelete("set null"),
	unique("customer_profiles_auth_user_id_key").on(table.authUserId),
	pgPolicy("Customer profiles can insert own", { as: "permissive", for: "insert", to: ["authenticated"], withCheck: sql`(auth.uid() = auth_user_id)`  }),
	pgPolicy("Customer profiles can update own", { as: "permissive", for: "update", to: ["authenticated"] }),
	pgPolicy("Customer profiles can view own", { as: "permissive", for: "select", to: ["authenticated"] }),
]);

export const centerProfiles = pgTable("center_profiles", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	authUserId: uuid("auth_user_id").notNull(),
	userId: uuid("user_id"),
	centerName: text("center_name").notNull(),
	contactEmail: text("contact_email"),
	contactPhone: text("contact_phone"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	approvalStatus: centerApprovalStatus("approval_status").default('pending').notNull(),
	approvalNote: text("approval_note"),
	decidedAt: timestamp("decided_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.authUserId],
			foreignColumns: [users.id],
			name: "center_profiles_auth_user_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "center_profiles_user_id_fkey"
		}).onDelete("set null"),
	unique("center_profiles_auth_user_id_key").on(table.authUserId),
	pgPolicy("Center profiles can insert own", { as: "permissive", for: "insert", to: ["authenticated"], withCheck: sql`(auth.uid() = auth_user_id)`  }),
	pgPolicy("Center profiles can update own", { as: "permissive", for: "update", to: ["authenticated"] }),
	pgPolicy("Center profiles can view own", { as: "permissive", for: "select", to: ["authenticated"] }),
	pgPolicy("Public can view center profiles", { as: "permissive", for: "select", to: ["anon", "authenticated"] }),
]);

export const ageGroups = pgTable("age_groups", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	authUserId: uuid("auth_user_id"),
}, (table) => [
	uniqueIndex("age_groups_auth_user_id_name_key").using("btree", table.authUserId.asc().nullsLast().op("text_ops"), table.name.asc().nullsLast().op("text_ops")),
	index("idx_age_groups_auth_user_id").using("btree", table.authUserId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.authUserId],
			foreignColumns: [users.id],
			name: "age_groups_auth_user_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("age_groups_manage_own", { as: "permissive", for: "all", to: ["authenticated"], using: sql`(auth.uid() = auth_user_id)`, withCheck: sql`(auth.uid() = auth_user_id)`  }),
]);

export const languages = pgTable("languages", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	authUserId: uuid("auth_user_id"),
}, (table) => [
	foreignKey({
			columns: [table.authUserId],
			foreignColumns: [users.id],
			name: "languages_auth_user_id_fkey"
		}),
]);

export const clientReferralRequests = pgTable("client_referral_requests", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	centerUserId: uuid("center_user_id").notNull(),
	customerUserId: uuid("customer_user_id").notNull(),
	customerAuthUserId: uuid("customer_auth_user_id").notNull(),
	customerEmail: text("customer_email"),
	customerName: text("customer_name"),
	customerPhone: text("customer_phone"),
	note: text(),
	status: referralRequestStatus().default('pending').notNull(),
	referralCode: text("referral_code"),
	rejectionNote: text("rejection_note"),
	decidedAt: timestamp("decided_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_client_referral_requests_center_user_id").using("btree", table.centerUserId.asc().nullsLast().op("uuid_ops")),
	index("idx_client_referral_requests_customer_user_id").using("btree", table.customerUserId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.centerUserId],
			foreignColumns: [users.id],
			name: "client_referral_requests_center_user_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.customerAuthUserId],
			foreignColumns: [users.id],
			name: "client_referral_requests_customer_auth_user_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.customerUserId],
			foreignColumns: [users.id],
			name: "client_referral_requests_customer_user_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("Centers can update own referral requests", { as: "permissive", for: "update", to: ["authenticated"], using: sql`((EXISTS ( SELECT 1
   FROM users u
  WHERE ((u.id = client_referral_requests.center_user_id) AND (u.auth_user_id = auth.uid())))) OR (EXISTS ( SELECT 1
   FROM center_profiles cp
  WHERE ((cp.user_id = client_referral_requests.center_user_id) AND (cp.auth_user_id = auth.uid())))))`, withCheck: sql`((EXISTS ( SELECT 1
   FROM users u
  WHERE ((u.id = client_referral_requests.center_user_id) AND (u.auth_user_id = auth.uid())))) OR (EXISTS ( SELECT 1
   FROM center_profiles cp
  WHERE ((cp.user_id = client_referral_requests.center_user_id) AND (cp.auth_user_id = auth.uid())))))`  }),
	pgPolicy("Centers can view own referral requests", { as: "permissive", for: "select", to: ["authenticated"] }),
	pgPolicy("Customers can insert own referral requests", { as: "permissive", for: "insert", to: ["authenticated"] }),
	pgPolicy("Customers can view own referral requests", { as: "permissive", for: "select", to: ["authenticated"] }),
]);

export const therapists = pgTable("therapists", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	fullName: text("full_name").notNull(),
	email: text(),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	authUserId: uuid("auth_user_id"),
}, (table) => [
	index("idx_therapists_auth_user_id").using("btree", table.authUserId.asc().nullsLast().op("uuid_ops")),
	uniqueIndex("therapists_auth_user_id_full_name_key").using("btree", table.authUserId.asc().nullsLast().op("text_ops"), table.fullName.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.authUserId],
			foreignColumns: [users.id],
			name: "therapists_auth_user_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("therapists_manage_own", { as: "permissive", for: "all", to: ["authenticated"], using: sql`(auth.uid() = auth_user_id)`, withCheck: sql`(auth.uid() = auth_user_id)`  }),
]);

export const serviceSpecializations = pgTable("service_specializations", {
	serviceId: uuid("service_id").notNull(),
	specializationId: uuid("specialization_id").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.serviceId],
			foreignColumns: [services.id],
			name: "service_specializations_service_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.specializationId],
			foreignColumns: [specializations.id],
			name: "service_specializations_specialization_id_fkey"
		}).onDelete("cascade"),
	primaryKey({ columns: [table.serviceId, table.specializationId], name: "service_specializations_pkey"}),
	pgPolicy("service_specializations_manage_own", { as: "permissive", for: "all", to: ["authenticated"], using: sql`(EXISTS ( SELECT 1
   FROM services s
  WHERE ((s.id = service_specializations.service_id) AND (s.auth_user_id = auth.uid()))))`, withCheck: sql`(EXISTS ( SELECT 1
   FROM services s
  WHERE ((s.id = service_specializations.service_id) AND (s.auth_user_id = auth.uid()))))`  }),
]);

export const serviceTherapists = pgTable("service_therapists", {
	serviceId: uuid("service_id").notNull(),
	therapistId: uuid("therapist_id").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.serviceId],
			foreignColumns: [services.id],
			name: "service_therapists_service_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.therapistId],
			foreignColumns: [therapists.id],
			name: "service_therapists_therapist_id_fkey"
		}).onDelete("cascade"),
	primaryKey({ columns: [table.serviceId, table.therapistId], name: "service_therapists_pkey"}),
	pgPolicy("service_therapists_manage_own", { as: "permissive", for: "all", to: ["authenticated"], using: sql`(EXISTS ( SELECT 1
   FROM services s
  WHERE ((s.id = service_therapists.service_id) AND (s.auth_user_id = auth.uid()))))`, withCheck: sql`(EXISTS ( SELECT 1
   FROM services s
  WHERE ((s.id = service_therapists.service_id) AND (s.auth_user_id = auth.uid()))))`  }),
]);
