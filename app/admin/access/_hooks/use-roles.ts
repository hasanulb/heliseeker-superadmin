import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { deleteApi, getApi, patchApi, postApi } from "@/lib/admin-panel/client"

import { CreateRolePayload, RoleResponse, UpdateRolePayload } from "../_types"

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

export function useUpdateRole() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateRolePayload) => patchApi(`/api/admin/roles/${payload.id}`, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-roles"] }),
  })
}

export function useDeleteRole() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id }: { id: string }) => deleteApi(`/api/admin/roles/${id}`, { id }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-roles"] }),
  })
}
