import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { getApi, patchApi, postApi } from "@/lib/admin-panel/client"

import { FlatPagesResponse } from "../_types"

export function useFlatPages() {
  return useQuery({
    queryKey: ["admin-flat-pages"],
    queryFn: () => getApi<FlatPagesResponse>("/api/admin/flat-pages"),
  })
}

export function useCreateFlatPage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: { title: string; slug: string; description: string }) => postApi("/api/admin/flat-pages", payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-flat-pages"] }),
  })
}

export function useUpdateFlatPage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) => patchApi(`/api/admin/flat-pages/${id}`, { enabled }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-flat-pages"] }),
  })
}
