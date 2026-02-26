export interface DashboardResponse {
  centers: {
    pending: number
    active: number
    rejected: number
  }
  totalPatients: number
  seo: {
    metaTitle: string
    metaDescription: string
  }
}
