"use client"

import { useQuery } from "@tanstack/react-query"

import { useTRPC } from "@/trpc/client"

export function useLeads(filters: { q?: string; enabled?: boolean }) {
  const trpc = useTRPC()
  const input = { q: filters.q?.trim() || undefined }
  const hasFilters = Boolean(input.q)

  return useQuery({
    ...trpc.leads.list.queryOptions(hasFilters ? input : {}),
    placeholderData: { data: [] as any[] },
    enabled: filters.enabled ?? true,
  })
}

export function useLeadById(id?: string, options?: { enabled?: boolean }) {
  const trpc = useTRPC()
  return useQuery({
    ...trpc.leads.byId.queryOptions({ id: id ?? "" }),
    enabled: options?.enabled ?? Boolean(id),
  })
}
