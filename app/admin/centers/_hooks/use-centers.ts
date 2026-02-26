import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { useTRPC } from "@/trpc/client"

import { CentersResponse } from "../_types"

export function useCenters(filters: { status?: string; q?: string }) {
  const trpc = useTRPC()
  const input = {
    status: filters.status || undefined,
    q: filters.q || undefined,
  }
  const hasFilters = Boolean(input.status || input.q)

  return useQuery({
    ...trpc.centers.list.queryOptions(hasFilters ? input : {}),
    placeholderData: { data: [] } satisfies CentersResponse,
  })
}

export function useCreateCenter() {
  const queryClient = useQueryClient()
  const trpc = useTRPC()

  return useMutation(trpc.centers.create.mutationOptions({
    onSuccess: () => {
      queryClient.invalidateQueries(trpc.centers.list.pathFilter())
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] })
    },
  }))
}

export function useUpdateCenterStatus() {
  const queryClient = useQueryClient()
  const trpc = useTRPC()

  return useMutation(trpc.centers.updateStatus.mutationOptions({
    onSuccess: () => {
      queryClient.invalidateQueries(trpc.centers.list.pathFilter())
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] })
    },
  }))
}

export function useUpdateCenter() {
  const queryClient = useQueryClient()
  const trpc = useTRPC()

  return useMutation(trpc.centers.update.mutationOptions({
    onSuccess: () => {
      queryClient.invalidateQueries(trpc.centers.list.pathFilter())
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] })
    },
  }))
}

export function useDeleteCenter() {
  const queryClient = useQueryClient()
  const trpc = useTRPC()

  return useMutation(trpc.centers.remove.mutationOptions({
    onSuccess: () => {
      queryClient.invalidateQueries(trpc.centers.list.pathFilter())
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] })
    },
  }))
}
