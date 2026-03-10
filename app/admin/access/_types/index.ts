import { Role, StaffPermission } from "@/lib/admin-panel/types"

export interface StaffUserRow {
  id: string
  authUserId?: string | null
  name: string
  email: string
  role: string
  active: boolean
  createdAt?: string | null
}

export interface StaffResponse {
  data: StaffUserRow[]
}

export interface CreateStaffPayload {
  name: string
  email: string
  role: string
}

export interface CreateStaffResponse {
  data: StaffUserRow
  tempPassword: string
}

export interface RoleResponse {
  data: Role[]
}

export interface CreateRolePayload {
  name: string
  permissions: StaffPermission[]
}
