import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { getApi, patchApi, postApi } from "@/lib/admin-panel/client"

import { CreateUserPayload, CreateUserResponse, UsersResponse } from "../_types"

export function useUsers(query: string) {
  return useQuery({
    queryKey: ["admin-users", query],
    queryFn: () => getApi<UsersResponse>(`/api/admin/users?q=${encodeURIComponent(query)}`),
  })
}

export function useToggleUserVerification() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, isVerified }: { id: string; isVerified: boolean }) =>
      patchApi(`/api/admin/users/${id}`, { isVerified }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] })
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] })
    },
  })
}

export function useCreateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateUserPayload) => postApi<CreateUserResponse>("/api/admin/users", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] })
    },
  })
}
