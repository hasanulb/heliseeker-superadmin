import { StaffPermission, StaffUser } from "@/lib/admin-panel/types"

export interface StaffResponse {
  data: StaffUser[]
}

export interface CreateStaffPayload {
  name: string
  email: string
  role: StaffUser["role"]
  permissions: StaffPermission[]
}
