import { useQuery } from "@tanstack/react-query"

import { getApi } from "@/lib/admin-panel/client"

import { DashboardResponse } from "../_types"

export function useDashboard() {
  return useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: () => getApi<DashboardResponse>("/api/admin/dashboard"),
  })
}
