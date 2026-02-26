import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { getApi, patchApi } from "@/lib/admin-panel/client"

import { PatientsResponse } from "../_types"

export function usePatients(query: string) {
  return useQuery({
    queryKey: ["admin-patients", query],
    queryFn: () => getApi<PatientsResponse>(`/api/admin/patients?q=${encodeURIComponent(query)}`),
  })
}

export function useTogglePatientStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => patchApi(`/api/admin/patients/${id}`, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-patients"] })
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] })
    },
  })
}
