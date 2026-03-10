export interface UserItem {
  id: string
  name: string
  email: string
  isVerified: boolean
  createdAt?: string
}

export interface UsersResponse {
  data: UserItem[]
}

export interface CreateUserPayload {
  name: string
  email: string
}

export interface CreateUserResponse {
  data: UserItem
  tempPassword: string
}
