import { AdminPanelDb } from "./types"

const now = new Date().toISOString()

export const defaultAdminDb: AdminPanelDb = {
  centers: [
    { id: "c_1", name: "Hope Therapy Center", department: "Occupational Therapy", city: "New York", status: "pending", referralType: "patient", createdAt: now },
    { id: "c_2", name: "Bright Minds Clinic", department: "Speech Therapy", city: "Chicago", status: "active", referralType: "self", createdAt: now },
    { id: "c_3", name: "Sunrise Rehab Hub", department: "Physiotherapy", city: "Dallas", status: "rejected", referralType: "patient", approvalNote: "Missing license", createdAt: now },
  ],
  patients: [
    {
      id: "p_1",
      name: "Ava Johnson",
      email: "ava@example.com",
      isActive: true,
      createdAt: now,
      referralHistory: [
        { centerName: "Hope Therapy Center", usedAt: now, note: "Initial intake referral" },
      ],
    },
    {
      id: "p_2",
      name: "Mason Lee",
      email: "mason@example.com",
      isActive: false,
      createdAt: now,
      referralHistory: [
        { centerName: "Bright Minds Clinic", usedAt: now, note: "Follow-up referral" },
      ],
    },
  ],
  searchFilters: [
    { id: "f_1", kind: "department", name: "Rehab", enabled: true, order: 1 },
    { id: "f_2", kind: "therapy", name: "Speech Therapy", parentId: "f_1", enabled: true, order: 1 },
    { id: "f_3", kind: "service", name: "S1", description: "Assessment and planning", parentId: "f_2", enabled: true, order: 1 },
    { id: "f_4", kind: "ageRange", name: "Infancy 0-2", enabled: true, order: 1 },
    { id: "f_5", kind: "ageRange", name: "Early Childhood 2-6", enabled: true, order: 2 },
    { id: "f_6", kind: "location", name: "Map Enabled", description: "Google Map Integration", enabled: true, order: 1 },
    { id: "f_7", kind: "language", name: "English", enabled: true, order: 1 },
  ],
  staffUsers: [
    {
      id: "s_1",
      name: "Admin User",
      email: "admin@burjcon.com",
      role: "super_admin",
      active: true,
      permissions: [
        { module: "centers", view: true, create: true, edit: true },
        { module: "patients", view: true, create: false, edit: true },
        { module: "seo", view: true, create: true, edit: true },
      ],
    },
  ],
  flatPages: [
    { id: "fp_1", title: "About Us", slug: "about-us", description: "<p>About page</p>", enabled: true, updatedAt: now },
  ],
  seo: {
    metaTitle: "Burjcon Admin",
    metaDescription: "Admin SEO defaults",
  },
  tags: [
    {
      id: "t_1",
      tagName: "Autism Support",
      tagType: "condition",
      keyword: "autism therapy",
      question: "What therapy supports autism?",
      linkedCategory: "Rehab > Speech Therapy",
      enabled: true,
    },
  ],
}
