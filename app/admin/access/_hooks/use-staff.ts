import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { getApi, patchApi, postApi } from "@/lib/admin-panel/client"

import { CreateStaffPayload, CreateStaffResponse, StaffResponse } from "../_types"

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
    mutationFn: ({ id, active }: { id: string; active: boolean }) => patchApi(`/api/admin/staff/${id}`, { active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-staff"] }),
  })
}
