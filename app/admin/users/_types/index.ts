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
