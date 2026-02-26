export type CenterApprovalStatus = "pending" | "active" | "deactive" | "rejected" | "blacklisted"

export interface CenterProfile {
  id: string
  authUserId: string
  userId?: string | null
  centerName: string
  contactEmail?: string | null
  contactPhone?: string | null
  approvalStatus: CenterApprovalStatus
  approvalNote?: string | null
  decidedAt?: string | null
  createdAt: string
  updatedAt: string
}

export interface CentersResponse {
  data: CenterProfile[]
}

export interface CreateCenterPayload {
  authUserId: string
  centerName: string
  contactEmail?: string
  contactPhone?: string
}

export interface UpdateCenterPayload {
  id: string
  status: CenterApprovalStatus
  approvalNote?: string
}

export interface UpdateCenterDetailsPayload {
  id: string
  centerName?: string
  contactEmail?: string
  contactPhone?: string
  approvalNote?: string
}

export interface DeleteCenterPayload {
  id: string
}
