import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { deleteApi, getApi, patchApi, postApi } from "@/lib/admin-panel/client"
import { SearchFilterItem } from "@/lib/admin-panel/types"

import { CreateSearchFilterPayload, SearchFiltersResponse } from "../_types"

export function useSearchFilters() {
  return useQuery({
    queryKey: ["admin-search-filters"],
    queryFn: () => getApi<SearchFiltersResponse>("/api/admin/search-filters"),
  })
}

export function useCreateSearchFilter() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateSearchFilterPayload) => postApi("/api/admin/search-filters", payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-search-filters"] }),
  })
}

export function useUpdateSearchFilter() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: { id: string; enabled?: boolean; name?: string; description?: string }) =>
      patchApi("/api/admin/search-filters", payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-search-filters"] }),
  })
}

export function useReorderSearchFilters() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (items: SearchFilterItem[]) =>
      patchApi("/api/admin/search-filters/reorder", { orderedIds: items.map((item) => item.id) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-search-filters"] }),
  })
}

export function useDeleteSearchFilter() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: { id: string }) => deleteApi("/api/admin/search-filters", payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-search-filters"] }),
  })
}
