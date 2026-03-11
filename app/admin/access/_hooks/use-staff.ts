import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { deleteApi, getApi, patchApi, postApi } from "@/lib/admin-panel/client"

import { CreateStaffPayload, CreateStaffResponse, StaffResponse, UpdateStaffPayload } from "../_types"

export function useStaffUsers() {
  return useQuery({
    queryKey: ["admin-staff"],
    queryFn: () => getApi<StaffResponse>("/api/admin/staff"),
  })
}

export function useCreateStaffUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateStaffPayload) => postApi<CreateStaffResponse>("/api/admin/staff", payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-staff"] }),
  })
}

export function useUpdateStaffUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateStaffPayload) => patchApi(`/api/admin/staff/${payload.id}`, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-staff"] }),
  })
}

export function useDeleteStaffUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id }: { id: string }) => deleteApi(`/api/admin/staff/${id}`, { id }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-staff"] }),
  })
}
