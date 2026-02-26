import { FilterKind, SearchFilterItem } from "@/lib/admin-panel/types"

export interface SearchFiltersResponse {
  data: SearchFilterItem[]
}

export interface CreateSearchFilterPayload {
  kind: FilterKind
  name: string
  description?: string
  parentId?: string
}
