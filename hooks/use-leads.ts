"use client"

import { useQuery } from "@tanstack/react-query"
import type { LeadType } from "@/app/admin/leads/types"

export interface LeadsQueryParams {
  search?: string
  source?: string
  page?: number
  pageSize?: number
  sort?: { field: string; dir: "asc" | "desc" }
}

export function useLeads(params: LeadsQueryParams) {
  const {
    search = "",
    source = "",
    page = 1,
    pageSize = 10,
    sort = { field: "created_at", dir: "desc" },
  } = params

  return useQuery({
    queryKey: ["leads", { search, source, page, pageSize, sort }],
    queryFn: async () => {
      const qs = new URLSearchParams({
        search,
        source,
        page: String(page),
        pageSize: String(pageSize),
        sortField: String(sort.field),
        sortDir: String(sort.dir),
      })

      const res = await fetch(`/api/leads?${qs.toString()}`, {
        credentials: "include",
      })
      const result = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(result?.message || "Failed to fetch leads")
      return (result?.data ?? { data: [], count: 0 }) as {
        data: LeadType[]
        count: number
      }
    },
  })
}

export function useLead(id?: string) {
  return useQuery({
    queryKey: ["lead", id],
    queryFn: async () => {
      const res = await fetch(`/api/leads/${id}`, { credentials: "include" })
      const result = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(result?.message || "Failed to fetch lead")
      return result?.data as LeadType
    },
    enabled: !!id,
  })
}
