export interface DashboardResponse {
  centers: {
    pending: number
    active: number
    rejected: number
    submitted: number
  }
  centersByLocation: {
    location: string
    total: number
  }[]
  totalUsers: number
  users: {
    id: string
    email?: string | null
    phoneNumber?: string | null
    profileName?: string | null
  }[]
  seo: {
    metaTitle: string
    metaDescription: string
  }
}
