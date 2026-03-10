import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { getApi, postApi } from "@/lib/admin-panel/client"

import { CreateRolePayload, RoleResponse } from "../_types"

export function useRoles() {
  return useQuery({
    queryKey: ["admin-roles"],
    queryFn: () => getApi<RoleResponse>("/api/admin/roles"),
  })
}

export function useCreateRole() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateRolePayload) => postApi("/api/admin/roles", payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-roles"] }),
  })
}
