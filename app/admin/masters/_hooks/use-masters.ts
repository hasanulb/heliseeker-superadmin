import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { deleteApi, getApi, patchApi, postApi } from "@/lib/admin-panel/client"

export function useMasterItems(slug: string) {
  return useQuery({
    queryKey: ["admin-masters", slug],
    queryFn: () => getApi<{ data: any[] }>(`/api/admin/masters/${slug}`),
    enabled: Boolean(slug),
  })
}

export function useCreateMasterItem(slug: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => postApi(`/api/admin/masters/${slug}`, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-masters", slug] }),
  })
}

export function useUpdateMasterItem(slug: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => patchApi(`/api/admin/masters/${slug}`, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-masters", slug] }),
  })
}

export function useDeleteMasterItem(slug: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: { id: string }) => deleteApi(`/api/admin/masters/${slug}`, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-masters", slug] }),
  })
}
