import { relations } from "drizzle-orm/relations";
import { usersInAuth, users, termsAndConditions, ageGroups, services, departments, specialists, specialistLanguages, specializations, specialistEducations, pricingSettings, customerProfiles, centerProfiles, languages, clientReferralRequests, therapists, serviceSpecializations, serviceTherapists } from "./schema";

export const usersRelations = relations(users, ({one, many}) => ({
	usersInAuth: one(usersInAuth, {
		fields: [users.authUserId],
		references: [usersInAuth.id]
	}),
	customerProfiles: many(customerProfiles),
	centerProfiles: many(centerProfiles),
	clientReferralRequests_centerUserId: many(clientReferralRequests, {
		relationName: "clientReferralRequests_centerUserId_users_id"
	}),
	clientReferralRequests_customerUserId: many(clientReferralRequests, {
		relationName: "clientReferralRequests_customerUserId_users_id"
	}),
}));

export const usersInAuthRelations = relations(usersInAuth, ({many}) => ({
	users: many(users),
	termsAndConditions: many(termsAndConditions),
	services: many(services),
	specialists: many(specialists),
	specializations: many(specializations),
	departments: many(departments),
	pricingSettings: many(pricingSettings),
	customerProfiles: many(customerProfiles),
	centerProfiles: many(centerProfiles),
	ageGroups: many(ageGroups),
	languages: many(languages),
	clientReferralRequests: many(clientReferralRequests),
	therapists: many(therapists),
}));

export const termsAndConditionsRelations = relations(termsAndConditions, ({one}) => ({
	usersInAuth: one(usersInAuth, {
		fields: [termsAndConditions.authUserId],
		references: [usersInAuth.id]
	}),
}));

export const servicesRelations = relations(services, ({one, many}) => ({
	ageGroup: one(ageGroups, {
		fields: [services.ageGroupId],
		references: [ageGroups.id]
	}),
	department: one(departments, {
		fields: [services.departmentId],
		references: [departments.id]
	}),
	usersInAuth: one(usersInAuth, {
		fields: [services.authUserId],
		references: [usersInAuth.id]
	}),
	serviceSpecializations: many(serviceSpecializations),
	serviceTherapists: many(serviceTherapists),
}));

export const ageGroupsRelations = relations(ageGroups, ({one, many}) => ({
	services: many(services),
	usersInAuth: one(usersInAuth, {
		fields: [ageGroups.authUserId],
		references: [usersInAuth.id]
	}),
}));

export const departmentsRelations = relations(departments, ({one, many}) => ({
	services: many(services),
	usersInAuth: one(usersInAuth, {
		fields: [departments.authUserId],
		references: [usersInAuth.id]
	}),
}));

export const specialistsRelations = relations(specialists, ({one, many}) => ({
	usersInAuth: one(usersInAuth, {
		fields: [specialists.createdBy],
		references: [usersInAuth.id]
	}),
	specialistLanguages: many(specialistLanguages),
	specialistEducations: many(specialistEducations),
}));

export const specialistLanguagesRelations = relations(specialistLanguages, ({one}) => ({
	specialist: one(specialists, {
		fields: [specialistLanguages.specialistId],
		references: [specialists.id]
	}),
}));

export const specializationsRelations = relations(specializations, ({one, many}) => ({
	usersInAuth: one(usersInAuth, {
		fields: [specializations.authUserId],
		references: [usersInAuth.id]
	}),
	serviceSpecializations: many(serviceSpecializations),
}));

export const specialistEducationsRelations = relations(specialistEducations, ({one}) => ({
	specialist: one(specialists, {
		fields: [specialistEducations.specialistId],
		references: [specialists.id]
	}),
}));

export const pricingSettingsRelations = relations(pricingSettings, ({one}) => ({
	usersInAuth: one(usersInAuth, {
		fields: [pricingSettings.authUserId],
		references: [usersInAuth.id]
	}),
}));

export const customerProfilesRelations = relations(customerProfiles, ({one}) => ({
	usersInAuth: one(usersInAuth, {
		fields: [customerProfiles.authUserId],
		references: [usersInAuth.id]
	}),
	user: one(users, {
		fields: [customerProfiles.userId],
		references: [users.id]
	}),
}));

export const centerProfilesRelations = relations(centerProfiles, ({one}) => ({
	usersInAuth: one(usersInAuth, {
		fields: [centerProfiles.authUserId],
		references: [usersInAuth.id]
	}),
	user: one(users, {
		fields: [centerProfiles.userId],
		references: [users.id]
	}),
}));

export const languagesRelations = relations(languages, ({one}) => ({
	usersInAuth: one(usersInAuth, {
		fields: [languages.authUserId],
		references: [usersInAuth.id]
	}),
}));

export const clientReferralRequestsRelations = relations(clientReferralRequests, ({one}) => ({
	user_centerUserId: one(users, {
		fields: [clientReferralRequests.centerUserId],
		references: [users.id],
		relationName: "clientReferralRequests_centerUserId_users_id"
	}),
	usersInAuth: one(usersInAuth, {
		fields: [clientReferralRequests.customerAuthUserId],
		references: [usersInAuth.id]
	}),
	user_customerUserId: one(users, {
		fields: [clientReferralRequests.customerUserId],
		references: [users.id],
		relationName: "clientReferralRequests_customerUserId_users_id"
	}),
}));

export const therapistsRelations = relations(therapists, ({one, many}) => ({
	usersInAuth: one(usersInAuth, {
		fields: [therapists.authUserId],
		references: [usersInAuth.id]
	}),
	serviceTherapists: many(serviceTherapists),
}));

export const serviceSpecializationsRelations = relations(serviceSpecializations, ({one}) => ({
	service: one(services, {
		fields: [serviceSpecializations.serviceId],
		references: [services.id]
	}),
	specialization: one(specializations, {
		fields: [serviceSpecializations.specializationId],
		references: [specializations.id]
	}),
}));

export const serviceTherapistsRelations = relations(serviceTherapists, ({one}) => ({
	service: one(services, {
		fields: [serviceTherapists.serviceId],
		references: [services.id]
	}),
	therapist: one(therapists, {
		fields: [serviceTherapists.therapistId],
		references: [therapists.id]
	}),
}));